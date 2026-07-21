const fs = require("fs");
const path = require("path");
const express = require("express");
const router = express.Router();
const db = require("../db");

async function findOrCreate(table, idColumn, valueColumn, value) {
  const [rows] = await db.query(
    `SELECT ${idColumn} FROM ${table} WHERE ${valueColumn} = ? LIMIT 1`,
    [value]
  );

  if (rows.length > 0) {
    return rows[0][idColumn];
  }

  const [result] = await db.query(
    `INSERT INTO ${table} (${valueColumn}) VALUES (?)`,
    [value]
  );

  return result.insertId;
}

function getImageExtension(dataUrl) {
  const match = dataUrl.match(/^data:image\/(png|jpe?g|webp);base64,/i);
  if (!match) {
    return null;
  }
  const ext = match[1].toLowerCase();
  return ext === "jpeg" ? "jpg" : ext;
}

async function saveListingPhoto(listingId, dataUrl) {
  const imagesDir = path.join(__dirname, "../../frontend/pictures");;
  const extension = getImageExtension(dataUrl);
  if (!extension) {
    return null;
  }

  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex < 0) {
    return null;
  }

  const base64Data = dataUrl.slice(commaIndex + 1);
  const buffer = Buffer.from(base64Data, "base64");
  await fs.promises.mkdir(imagesDir, { recursive: true });

  const fileName = `listing-${listingId}-${Date.now()}.${extension}`;
  const filePath = path.join(imagesDir, fileName);
  await fs.promises.writeFile(filePath, buffer);

  return `/pictures/${fileName}`;
}

async function getCategoryId(name) {
  return findOrCreate("Category", "category_id", "category_name", name);
}

async function getLocationId(name) {
  return findOrCreate("Location", "location_id", "location_name", name);
}

async function getDepartmentId(name) {
  return findOrCreate("Department", "department_id", "department_name", name);
}

function normalizeCondition(value) {
  if (!value) return "USED";
  const normalized = value.trim().toUpperCase();
  if (["NEW", "LIKE NEW", "GOOD", "FAIR", "USED"].includes(normalized)) {
    return normalized;
  }
  return "USED";
}

router.get("/", async (req, res) => {
  const { userId } = req.query;

  try {
    // Using 'Listing' (singular, capital L)
    let query = `SELECT l.listing_id, l.user_id, l.listing_title, l.listing_description, l.price, l.listing_condition, l.listing_status, l.created_at, li.image_url AS photo
      FROM Listing l
      LEFT JOIN Listing_image li ON li.listing_id = l.listing_id AND li.is_primary = TRUE
      WHERE l.listing_status = 'ACTIVE'`;
    const params = [];

    if (userId) {
      query += " AND l.user_id = ?";
      params.push(userId);
    }

    query += " ORDER BY l.created_at DESC";

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error("Error loading listings:", error);
    res.status(500).json({
      message: "Could not load listings."
    });
  }
});

// GET /api/listing/:id?userId=X -> full listing detail, all photos, seller info
router.get("/:id", async (req, res) => {
  try {
    const listingId = Number(req.params.id);
    const viewerId = req.query.userId ? Number(req.query.userId) : null;

    if (!listingId) {
      return res.status(400).json({ message: "A valid listing id is required." });
    }

    const [rows] = await db.query(
      `SELECT l.listing_id, l.user_id, l.listing_title, l.listing_description, l.price,
              l.listing_condition, l.listing_status, l.created_at,
              c.category_name, d.department_name, loc.location_name,
              CONCAT(u.first_name, ' ', u.last_name) AS seller_name
         FROM Listing l
         JOIN User u ON u.user_id = l.user_id
         LEFT JOIN Category c ON c.category_id = l.category_id
         LEFT JOIN Department d ON d.department_id = l.department_id
         LEFT JOIN Location loc ON loc.location_id = l.location_id
        WHERE l.listing_id = ?`,
      [listingId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Listing not found." });
    }

    const listing = rows[0];

    const [images] = await db.query(
      `SELECT image_url, is_primary FROM Listing_image
        WHERE listing_id = ?
        ORDER BY is_primary DESC, image_url ASC`,
      [listingId]
    );

    const [ratingRows] = await db.query(
      `SELECT ROUND(AVG(rating), 1) AS avg_rating, COUNT(*) AS review_count
         FROM Review WHERE reviewed_user_id = ?`,
      [listing.user_id]
    );

    let favorited = false;
    if (viewerId) {
      const [favRows] = await db.query(
        `SELECT 1 FROM Favorite WHERE user_id = ? AND listing_id = ? LIMIT 1`,
        [viewerId, listingId]
      );
      favorited = favRows.length > 0;
    }

    res.json({
      ...listing,
      photos: images.map((img) => img.image_url),
      seller: {
        user_id: listing.user_id,
        name: listing.seller_name,
        avgRating: ratingRows[0].avg_rating,
        reviewCount: ratingRows[0].review_count
      },
      favorited
    });
  } catch (error) {
    console.error("Load listing detail error:", error);
    res.status(500).json({ message: "Could not load listing." });
  }
});

router.post("/", async (req, res) => {
  try {
    const { userId, title, description, price, category, condition, location, photo } = req.body;

    if (!userId || !title || !description || !price || !category) {
      return res.status(400).json({ message: "userId, title, description, price, and category are required." });
    }

    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({ message: "Price must be a positive number." });
    }

    // These lines insert helper data into Category, Location, Department tables.
    // Ensure these table names match your database exactly (e.g., if 'Category' fails, change to 'category')
    const categoryId = await getCategoryId(category);
    const locationId = await getLocationId(location || "Richmond Campus");
    const departmentId = await getDepartmentId("General");
    const listingCondition = normalizeCondition(condition);

    // Using 'Listing' (singular, capital L)
    const [result] = await db.query(
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
      [userId, categoryId, departmentId, locationId, title, description, numericPrice, listingCondition]
    );

    if (photo) {
      const photoUrl = await saveListingPhoto(result.insertId, photo);
      if (photoUrl) {
        // Using 'Listing_image' (exactly as it is named in your DB)
        await db.query(
          `INSERT INTO Listing_image (listing_id, image_url, is_primary) VALUES (?, ?, TRUE)`,
          [result.insertId, photoUrl]
        );
      }
    }

    // Using 'Listing' (singular, capital L)
    const [newRows] = await db.query(
      `SELECT l.listing_id, l.user_id, l.listing_title, l.listing_description, l.price, l.listing_condition, l.listing_status, l.created_at, li.image_url AS photo
       FROM Listing l
       LEFT JOIN Listing_image li ON li.listing_id = l.listing_id AND li.is_primary = TRUE
       WHERE l.listing_id = ?`,
      [result.insertId]
    );

    res.status(201).json(newRows[0]);
  } catch (error) {
    console.error("Create listing error:", error);
    res.status(500).json({ message: "Could not create listing." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const listingId = Number(req.params.id);
    const userId = Number(req.body.userId || req.query.userId);

    if (!listingId || !userId) {
      return res.status(400).json({ message: "Listing ID and userId are required." });
    }

    const [result] = await db.query(
      `UPDATE Listing SET listing_status = 'REMOVED' WHERE listing_id = ? AND user_id = ? AND listing_status = 'ACTIVE'`,
      [listingId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Listing not found or you do not have permission to delete it." });
    }

    res.json({ message: "Listing deleted." });
  } catch (error) {
    console.error("Delete listing error:", error);
    res.status(500).json({ message: "Could not delete listing." });
  }
});

module.exports = router;