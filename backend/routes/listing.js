const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const db = require("../db");

const router = express.Router();

const MAX_PHOTOS = 4;
const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
const MAX_TOTAL_PHOTO_BYTES = MAX_PHOTOS * MAX_PHOTO_BYTES;
const IMAGES_DIR = path.join(__dirname, "../../frontend/pictures");
const ALLOWED_CONDITIONS = new Set(["NEW", "LIKE NEW", "GOOD", "FAIR", "USED"]);
const LEGACY_DEPARTMENTS = {
  1: "Computer Science",
  2: "Business",
  3: "Engineering"
};
let imageSchemaCapabilitiesPromise;

const LISTING_SELECT = `
  SELECT
    l.listing_id,
    l.user_id,
    l.listing_title,
    l.listing_description,
    l.price,
    l.listing_condition,
    l.listing_status,
    l.created_at,
    c.category_name,
    d.department_name,
    loc.location_name,
    CONCAT_WS(' ', u.first_name, u.last_name) AS seller_name,
    ratings.avg_rating,
    COALESCE(ratings.review_count, 0) AS review_count,
    EXISTS (
      SELECT 1
      FROM Favorite favorite
      WHERE favorite.user_id = ?
        AND favorite.listing_id = l.listing_id
    ) AS favorited
  FROM Listing l
  JOIN User u ON u.user_id = l.user_id
  LEFT JOIN Category c ON c.category_id = l.category_id
  LEFT JOIN Department d ON d.department_id = l.department_id
  LEFT JOIN Location loc ON loc.location_id = l.location_id
  LEFT JOIN (
    SELECT
      reviewed_user_id,
      ROUND(AVG(rating), 1) AS avg_rating,
      COUNT(*) AS review_count
    FROM Review
    GROUP BY reviewed_user_id
  ) ratings ON ratings.reviewed_user_id = l.user_id`;

function clientError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function parsePositiveInteger(value, label) {
  let parsed;

  if (typeof value === "number") {
    parsed = value;
  } else if (typeof value === "string" && /^[1-9]\d*$/.test(value.trim())) {
    parsed = Number(value.trim());
  } else {
    throw clientError(400, `${label} must be a positive integer.`);
  }

  if (!Number.isSafeInteger(parsed) || parsed <= 0 || parsed > 4294967295) {
    throw clientError(400, `${label} must be a positive integer.`);
  }

  return parsed;
}

function parseOptionalPositiveInteger(value, label) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return parsePositiveInteger(value, label);
}

function requiredString(value, label, maxLength) {
  if (typeof value !== "string" || value.trim() === "") {
    throw clientError(400, `${label} is required.`);
  }

  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw clientError(400, `${label} must be ${maxLength} characters or fewer.`);
  }

  return normalized;
}

function normalizePrice(value) {
  let price;

  if (typeof value === "number") {
    price = value;
  } else if (
    typeof value === "string"
    && /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(value.trim())
  ) {
    price = Number(value.trim());
  } else {
    throw clientError(400, "Price must be a positive number with at most two decimal places.");
  }

  if (!Number.isFinite(price) || price <= 0) {
    throw clientError(400, "Price must be a positive number.");
  }

  if (Number(price.toFixed(2)) !== price) {
    throw clientError(400, "Price must have at most two decimal places.");
  }

  if (price > 99999999.99) {
    throw clientError(400, "Price is too large.");
  }

  return Math.round(price * 100) / 100;
}

function normalizeCondition(value) {
  if (value === undefined || value === null || value === "" || value === "Select...") {
    return "USED";
  }

  if (typeof value !== "string") {
    throw clientError(400, "Condition must be text.");
  }

  const condition = value.trim().toUpperCase();
  if (!ALLOWED_CONDITIONS.has(condition)) {
    throw clientError(400, "Condition must be NEW, LIKE NEW, GOOD, FAIR, or USED.");
  }

  return condition;
}

function normalizeDepartment(value) {
  if (typeof value === "number" && LEGACY_DEPARTMENTS[value]) {
    return LEGACY_DEPARTMENTS[value];
  }

  if (typeof value !== "string") {
    throw clientError(400, "Department must be text or a supported legacy department id.");
  }

  const department = requiredString(value, "Department", 100);
  return LEGACY_DEPARTMENTS[department] || department;
}

function normalizeLocation(value) {
  if (value === undefined || value === null || value === "" || value === "Select...") {
    return "Richmond Campus";
  }

  return requiredString(value, "Location", 100);
}

function decodePhoto(photo, index) {
  let dataUrl;
  let isPrimary = false;

  if (typeof photo === "string") {
    dataUrl = photo;
  } else if (photo && typeof photo === "object" && typeof photo.dataUrl === "string") {
    dataUrl = photo.dataUrl;
    isPrimary = photo.isPrimary === true;
  } else {
    throw clientError(400, `Photo ${index + 1} must be an image data URL.`);
  }

  const match = dataUrl.match(
    /^data:image\/(png|jpe?g|webp);base64,([A-Za-z0-9+/=\s]+)$/i
  );

  if (!match) {
    throw clientError(400, `Photo ${index + 1} must be a PNG, JPEG, or WebP data URL.`);
  }

  const encoded = match[2].replace(/\s/g, "");
  const buffer = Buffer.from(encoded, "base64");
  const normalizedInput = encoded.replace(/=+$/, "");
  const normalizedBuffer = buffer.toString("base64").replace(/=+$/, "");

  if (buffer.length === 0 || normalizedInput !== normalizedBuffer) {
    throw clientError(400, `Photo ${index + 1} contains invalid base64 data.`);
  }

  if (buffer.length > MAX_PHOTO_BYTES) {
    throw clientError(413, `Photo ${index + 1} must be 4 MB or smaller.`);
  }

  const sourceExtension = match[1].toLowerCase();
  const extension = sourceExtension === "jpeg" ? "jpg" : sourceExtension;

  return { buffer, extension, isPrimary };
}

function normalizePhotos(body) {
  let photoInputs = [];

  if (body.photos !== undefined) {
    if (!Array.isArray(body.photos)) {
      throw clientError(400, "Photos must be an array.");
    }

    photoInputs = body.photos.filter((photo) => photo !== null && photo !== "");
  }

  // Temporary compatibility for pages that still send one `photo` data URL.
  if (photoInputs.length === 0 && body.photo) {
    photoInputs = [body.photo];
  }

  if (photoInputs.length > MAX_PHOTOS) {
    throw clientError(400, `A listing can have at most ${MAX_PHOTOS} photos.`);
  }

  const photos = photoInputs.map(decodePhoto);
  const primaryPhotos = photos.filter((photo) => photo.isPrimary);

  if (primaryPhotos.length > 1) {
    throw clientError(400, "Only one photo can be marked as primary.");
  }

  if (photos.length > 0 && primaryPhotos.length === 0) {
    photos[0].isPrimary = true;
  }

  const totalBytes = photos.reduce((total, photo) => total + photo.buffer.length, 0);
  if (totalBytes > MAX_TOTAL_PHOTO_BYTES) {
    throw clientError(413, "The combined photo size must be 16 MB or smaller.");
  }

  return photos;
}

function normalizeCreatePayload(body) {
  if (!body || typeof body !== "object") {
    throw clientError(400, "A JSON request body is required.");
  }

  return {
    userId: parsePositiveInteger(body.userId, "userId"),
    title: requiredString(body.title, "Title", 100),
    description: requiredString(body.description, "Description", 10000),
    price: normalizePrice(body.price),
    department: normalizeDepartment(body.department),
    category: requiredString(body.category, "Category", 100),
    condition: normalizeCondition(body.condition),
    location: normalizeLocation(body.location),
    photos: normalizePhotos(body)
  };
}

async function findOrCreate(connection, table, idColumn, valueColumn, value) {
  const [result] = await connection.query(
    `INSERT INTO ${table} (${valueColumn}) VALUES (?)
     ON DUPLICATE KEY UPDATE ${idColumn} = LAST_INSERT_ID(${idColumn})`,
    [value]
  );

  return Number(result.insertId);
}

async function getImageSchemaCapabilities() {
  if (!imageSchemaCapabilitiesPromise) {
    imageSchemaCapabilitiesPromise = db.query(
      `SELECT LOWER(COLUMN_NAME) AS column_name
         FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND LOWER(TABLE_NAME) = LOWER('Listing_image')`
    ).then(([rows]) => {
      const columns = new Set(rows.map((row) => row.column_name));
      return {
        hasDisplayOrder: columns.has("display_order"),
        hasImageId: columns.has("image_id")
      };
    }).catch((error) => {
      imageSchemaCapabilitiesPromise = null;
      throw error;
    });
  }

  return imageSchemaCapabilitiesPromise;
}

async function getPhotosByListing(executor, listingIds) {
  const photosByListing = new Map();

  if (listingIds.length === 0) {
    return photosByListing;
  }

  const placeholders = listingIds.map(() => "?").join(", ");
  const imageSchema = await getImageSchemaCapabilities();
  const orderColumns = ["listing_id ASC", "is_primary DESC"];
  if (imageSchema.hasDisplayOrder) orderColumns.push("display_order ASC");
  if (imageSchema.hasImageId) orderColumns.push("image_id ASC");
  if (!imageSchema.hasDisplayOrder && !imageSchema.hasImageId) {
    orderColumns.push("image_url ASC");
  }
  const [rows] = await executor.query(
    `SELECT listing_id, image_url, is_primary
       FROM Listing_image
      WHERE listing_id IN (${placeholders})
      ORDER BY ${orderColumns.join(", ")}`,
    listingIds
  );

  rows.forEach((row) => {
    const listingId = Number(row.listing_id);
    const listingPhotos = photosByListing.get(listingId) || [];
    listingPhotos.push(row.image_url);
    photosByListing.set(listingId, listingPhotos);
  });

  return photosByListing;
}

function toListingDto(row, photos) {
  return {
    listingId: Number(row.listing_id),
    userId: Number(row.user_id),
    title: row.listing_title,
    description: row.listing_description || "",
    price: Number(row.price),
    condition: row.listing_condition,
    status: row.listing_status,
    categoryName: row.category_name || null,
    departmentName: row.department_name || null,
    locationName: row.location_name || null,
    createdAt: row.created_at,
    photo: photos[0] || null,
    photos,
    isFavorited: Boolean(row.favorited),
    seller: {
      userId: Number(row.user_id),
      fullName: row.seller_name,
      averageRating: row.avg_rating === null ? null : Number(row.avg_rating),
      reviewCount: Number(row.review_count)
    }
  };
}

async function getListingById(listingId, viewerId = null) {
  const [rows] = await db.query(
    `${LISTING_SELECT}
     WHERE l.listing_id = ?
     LIMIT 1`,
    [viewerId, listingId]
  );

  if (rows.length === 0) {
    return null;
  }

  const photosByListing = await getPhotosByListing(db, [listingId]);
  return toListingDto(rows[0], photosByListing.get(listingId) || []);
}

async function savePhoto(listingId, photo, displayOrder) {
  await fs.promises.mkdir(IMAGES_DIR, { recursive: true });

  const uniquePart = crypto.randomUUID();
  const fileName = `listing-${listingId}-${uniquePart}.${photo.extension}`;
  const filePath = path.join(IMAGES_DIR, fileName);
  await fs.promises.writeFile(filePath, photo.buffer, { flag: "wx" });

  return {
    filePath,
    imageUrl: `/pictures/${fileName}`,
    displayOrder,
    isPrimary: photo.isPrimary
  };
}

async function removeFiles(filePaths) {
  const results = await Promise.allSettled(
    filePaths.map((filePath) => fs.promises.unlink(filePath))
  );

  results.forEach((result) => {
    if (result.status === "rejected" && result.reason?.code !== "ENOENT") {
      console.error("Could not clean up a listing photo:", result.reason);
    }
  });
}

function sendRouteError(res, error, logLabel, fallbackMessage) {
  if (error.statusCode) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  console.error(`${logLabel}:`, error);
  return res.status(500).json({ message: fallbackMessage });
}

router.get("/", async (req, res) => {
  try {
    // `userId` remains a temporary alias for the old owner filter.
    const ownerId = parseOptionalPositiveInteger(
      req.query.ownerId ?? req.query.userId,
      "ownerId"
    );
    const viewerId = parseOptionalPositiveInteger(req.query.viewerId, "viewerId");

    let whereClause = "WHERE l.listing_status = 'ACTIVE'";
    const params = [viewerId];

    if (ownerId !== null) {
      whereClause += " AND l.user_id = ?";
      params.push(ownerId);
    }

    const [rows] = await db.query(
      `${LISTING_SELECT}
       ${whereClause}
       ORDER BY l.created_at DESC, l.listing_id DESC`,
      params
    );

    const listingIds = rows.map((row) => Number(row.listing_id));
    const photosByListing = await getPhotosByListing(db, listingIds);
    const listings = rows.map((row) =>
      toListingDto(row, photosByListing.get(Number(row.listing_id)) || [])
    );

    return res.json(listings);
  } catch (error) {
    return sendRouteError(res, error, "Load listings error", "Could not load listings.");
  }
});

router.get("/:id", async (req, res) => {
  try {
    const listingId = parsePositiveInteger(req.params.id, "Listing id");
    // `userId` remains a temporary alias for the old detail viewer parameter.
    const viewerId = parseOptionalPositiveInteger(
      req.query.viewerId ?? req.query.userId,
      "viewerId"
    );
    const listing = await getListingById(listingId, viewerId);

    if (!listing) {
      return res.status(404).json({ message: "Listing not found." });
    }

    return res.json(listing);
  } catch (error) {
    return sendRouteError(res, error, "Load listing detail error", "Could not load listing.");
  }
});

router.post("/", async (req, res) => {
  let connection;
  let savedFiles = [];

  try {
    const payload = normalizeCreatePayload(req.body);
    const imageSchema = await getImageSchemaCapabilities();
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [users] = await connection.query(
      "SELECT user_id FROM User WHERE user_id = ? LIMIT 1",
      [payload.userId]
    );

    if (users.length === 0) {
      throw clientError(404, "User not found.");
    }

    const categoryId = await findOrCreate(
      connection,
      "Category",
      "category_id",
      "category_name",
      payload.category
    );
    const departmentId = await findOrCreate(
      connection,
      "Department",
      "department_id",
      "department_name",
      payload.department
    );
    const locationId = await findOrCreate(
      connection,
      "Location",
      "location_id",
      "location_name",
      payload.location
    );

    const [result] = await connection.query(
      `INSERT INTO Listing (
         user_id,
         category_id,
         department_id,
         location_id,
         listing_title,
         listing_description,
         price,
         listing_condition
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.userId,
        categoryId,
        departmentId,
        locationId,
        payload.title,
        payload.description,
        payload.price,
        payload.condition
      ]
    );

    for (const [index, photo] of payload.photos.entries()) {
      const savedPhoto = await savePhoto(result.insertId, photo, index + 1);
      savedFiles.push(savedPhoto.filePath);

      if (imageSchema.hasDisplayOrder) {
        await connection.query(
          `INSERT INTO Listing_image (
             listing_id,
             image_url,
             display_order,
             is_primary
           ) VALUES (?, ?, ?, ?)`,
          [
            result.insertId,
            savedPhoto.imageUrl,
            savedPhoto.displayOrder,
            savedPhoto.isPrimary
          ]
        );
      } else {
        await connection.query(
          `INSERT INTO Listing_image (listing_id, image_url, is_primary)
           VALUES (?, ?, ?)`,
          [result.insertId, savedPhoto.imageUrl, savedPhoto.isPrimary]
        );
      }
    }

    await connection.commit();
    savedFiles = [];

    const listing = await getListingById(Number(result.insertId), payload.userId);
    return res.status(201).json(listing);
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Create listing rollback error:", rollbackError);
      }
    }

    await removeFiles(savedFiles);
    return sendRouteError(res, error, "Create listing error", "Could not create listing.");
  } finally {
    connection?.release();
  }
});

router.delete("/admin/:id", async (req, res) => {
  try {
    const listingId = parsePositiveInteger(
      req.params.id,
      "Listing id"
    );

    const [result] = await db.query(
      `UPDATE Listing
          SET listing_status = 'REMOVED'
        WHERE listing_id = ?
          AND listing_status = 'ACTIVE'`,
      [listingId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Listing not found or already removed."
      });
    }

    return res.json({
      message: "Listing removed by admin.",
      listingId,
      status: "REMOVED"
    });

  } catch (error) {
    return sendRouteError(
      res,
      error,
      "Admin delete listing error",
      "Could not remove listing."
    );
  }
});

router.delete("/:id", async (req, res) => {
  try {
    console.log("Req.params = ", req.params);
    const listingId = parsePositiveInteger(req.params.id, "Listing id");
    const userId = parsePositiveInteger(
      req.body?.userId ?? req.query.userId,
      "userId"
    );

    const [result] = await db.query(
      `UPDATE Listing
          SET listing_status = 'REMOVED'
        WHERE listing_id = ?
          AND user_id = ?
          AND listing_status = 'ACTIVE'`,
      [listingId, userId]
    );

    if (result.affectedRows === 0) {
      const [rows] = await db.query(
        "SELECT user_id, listing_status FROM Listing WHERE listing_id = ? LIMIT 1",
        [listingId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: "Listing not found." });
      }

      if (Number(rows[0].user_id) !== userId) {
        return res.status(403).json({ message: "Only the listing owner can remove it." });
      }

      return res.status(409).json({
        message: `Only an active listing can be removed; this listing is ${rows[0].listing_status}.`
      });
    }

    return res.json({
      message: "Listing removed.",
      listingId,
      status: "REMOVED"
    });
  } catch (error) {
    return sendRouteError(res, error, "Delete listing error", "Could not remove listing.");
  }
});

module.exports = router;
