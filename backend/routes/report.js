const express = require("express");
const db = require("../db");

const router = express.Router();
const MIN_REASON_LENGTH = 10;
const MAX_REASON_LENGTH = 2000;

function parsePositiveInteger(value) {
  if (typeof value !== "number" && typeof value !== "string") {
    return null;
  }

  if (typeof value === "string" && !/^[1-9]\d*$/.test(value.trim())) {
    return null;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 && parsed <= 4294967295
    ? parsed
    : null;
}

function optionalPositiveInteger(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return parsePositiveInteger(value);
}

router.post("/", async (req, res) => {
  const body = req.body || {};
  const reporterId = parsePositiveInteger(body.reporterId);
  const targetUserId = optionalPositiveInteger(body.targetUserId);
  const listingId = optionalPositiveInteger(body.listingId);
  const targetUserWasProvided = body.targetUserId !== undefined
    && body.targetUserId !== null
    && body.targetUserId !== "";
  const listingWasProvided = body.listingId !== undefined
    && body.listingId !== null
    && body.listingId !== "";

  if (!reporterId) {
    return res.status(400).json({ message: "reporterId must be a valid positive integer." });
  }

  if ((targetUserWasProvided && !targetUserId) || (listingWasProvided && !listingId)) {
    return res.status(400).json({ message: "Report target IDs must be valid positive integers." });
  }

  if (!targetUserId && !listingId) {
    return res.status(400).json({ message: "targetUserId or listingId is required." });
  }

  if (targetUserId === reporterId) {
    return res.status(400).json({ message: "You cannot report yourself." });
  }

  if (typeof body.reason !== "string") {
    return res.status(400).json({ message: "Reason must be text." });
  }

  const reason = body.reason.trim();

  if (reason.length < MIN_REASON_LENGTH || reason.length > MAX_REASON_LENGTH) {
    return res.status(400).json({
      message: `Reason must be between ${MIN_REASON_LENGTH} and ${MAX_REASON_LENGTH} characters.`
    });
  }

  try {
    const checks = [
      db.query("SELECT user_id FROM User WHERE user_id = ?", [reporterId])
    ];

    if (targetUserId) {
      checks.push(db.query("SELECT user_id FROM User WHERE user_id = ?", [targetUserId]));
    }

    if (listingId) {
      checks.push(db.query("SELECT listing_id, user_id FROM Listing WHERE listing_id = ?", [listingId]));
    }

    const results = await Promise.all(checks);
    let resultIndex = 0;
    const reporterRows = results[resultIndex++][0];
    const targetRows = targetUserId ? results[resultIndex++][0] : null;
    const listingRows = listingId ? results[resultIndex][0] : null;

    if (reporterRows.length === 0) {
      return res.status(401).json({ message: "The signed-in user could not be found." });
    }

    if (targetRows && targetRows.length === 0) {
      return res.status(404).json({ message: "The reported user could not be found." });
    }

    if (listingRows && listingRows.length === 0) {
      return res.status(404).json({ message: "The reported listing could not be found." });
    }

    if (listingRows && Number(listingRows[0].user_id) === reporterId) {
      return res.status(400).json({ message: "You cannot report your own listing." });
    }

    if (listingRows && targetUserId && Number(listingRows[0].user_id) !== targetUserId) {
      return res.status(400).json({
        message: "targetUserId must identify the seller of the reported listing."
      });
    }

    const [result] = await db.query(
      `INSERT INTO Report (reason, reporter_id, target_user_id, listing_id)
       VALUES (?, ?, ?, ?)`,
      [reason, reporterId, targetUserId, listingId]
    );

    return res.status(201).json({
      message: "Report submitted. Thank you for helping keep the marketplace safe.",
      report: {
        reportId: result.insertId,
        reporterId,
        targetUserId,
        listingId,
        reason,
        reportStatus: "PENDING"
      }
    });
  } catch (error) {
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(404).json({ message: "A referenced user or listing was not found." });
    }

    console.error("Create report error:", error);
    return res.status(500).json({ message: "Could not submit the report." });
  }
});


router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         r.report_id,
         r.reason,
         r.report_status,
         r.created_at,
         r.listing_id,
         r.target_user_id,
         reporter.email_addr AS reporter_email,
         l.listing_title,
         tu.first_name AS target_first_name,
         tu.last_name AS target_last_name
       FROM Report r
       JOIN User reporter ON reporter.user_id = r.reporter_id
       LEFT JOIN Listing l ON l.listing_id = r.listing_id
       LEFT JOIN User tu ON tu.user_id = r.target_user_id
       ORDER BY r.created_at DESC`
    );

    const reports = rows.map((row) => ({
      reportId: row.report_id,
      type: row.listing_id ? "LISTING" : "USER",
      name: row.listing_id
        ? row.listing_title
        : `${row.target_first_name} ${row.target_last_name}`,
      reason: row.reason,
      reportedBy: row.reporter_email,
      createdAt: row.created_at,
      status: row.report_status,
      listingId: row.listing_id,
      targetUserId: row.target_user_id
    }));

    return res.json({ reports });
  } catch (error) {
    console.error("List reports error:", error);
    return res.status(500).json({ message: "Could not load reports." });
  }
});

router.patch("/:reportId/dismiss", async (req, res) => {
  const reportId = parsePositiveInteger(req.params.reportId);

  if (!reportId) {
    return res.status(400).json({ message: "reportId must be a valid positive integer." });
  }

  try {
    const [result] = await db.query(
      "UPDATE Report SET report_status = 'REJECTED' WHERE report_id = ?",
      [reportId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Report not found." });
    }

    return res.json({ message: "Report dismissed.", reportId, status: "REJECTED" });
  } catch (error) {
    console.error("Dismiss report error:", error);
    return res.status(500).json({ message: "Could not dismiss the report." });
  }
});

router.patch("/:reportId/remove", async (req, res) => {
  const reportId = parsePositiveInteger(req.params.reportId);

  if (!reportId) {
    return res.status(400).json({ message: "reportId must be a valid positive integer." });
  }

  try {
    const [reportRows] = await db.query(
      "SELECT listing_id, target_user_id FROM Report WHERE report_id = ?",
      [reportId]
    );

    if (reportRows.length === 0) {
      return res.status(404).json({ message: "Report not found." });
    }

    const { listing_id: listingId, target_user_id: targetUserId } = reportRows[0];
    const actions = [
      db.query("UPDATE Report SET report_status = 'RESOLVED' WHERE report_id = ?", [reportId])
    ];

    if (listingId) {
      actions.push(
        db.query("UPDATE Listing SET listing_status = 'REMOVED' WHERE listing_id = ?", [listingId])
      );
    }

    if (targetUserId) {
      actions.push(
        db.query("UPDATE User SET account_status = 'SUSPENDED' WHERE user_id = ?", [targetUserId])
      );
    }

    await Promise.all(actions);

    return res.json({ message: "Report resolved and content removed.", reportId, status: "RESOLVED" });
  } catch (error) {
    console.error("Remove report error:", error);
    return res.status(500).json({ message: "Could not remove the reported content." });
  }
});

router.get("/activity", async (req, res) => {
  try {

    const [[users]] = await db.query(`
      SELECT COUNT(*) AS totalUsers
      FROM User
    `);

    const [[listings]] = await db.query(`
      SELECT COUNT(*) AS totalListings
      FROM Listing
      WHERE listing_status = 'ACTIVE'
    `);

    const avgListings =
      users.totalUsers > 0
        ? listings.totalListings / users.totalUsers
        : 0;

    const [categories] = await db.query(`
      SELECT
        c.category_name,
        COUNT(l.listing_id) AS total
      FROM Category c
      LEFT JOIN Listing l
        ON l.category_id = c.category_id
       AND l.listing_status = 'ACTIVE'
      GROUP BY c.category_id, c.category_name
      ORDER BY
        CASE c.category_name
          WHEN 'Books & Textbooks' THEN 1
          WHEN 'Electronics' THEN 2
          WHEN 'Dorm & Furniture' THEN 3
          WHEN 'Clothing & Accessories' THEN 4
          WHEN 'School Supplies' THEN 5
          WHEN 'Services' THEN 6
          ELSE 99
        END,
        c.category_name ASC
    `);

    const [sellers] = await db.query(`
      SELECT
        u.first_name,
        u.last_name,
        u.email_addr,
        COUNT(*) AS listings
      FROM Listing l
      JOIN User u
        ON u.user_id = l.user_id
      WHERE l.listing_status = 'ACTIVE'
      GROUP BY u.user_id
      ORDER BY listings DESC
      LIMIT 5
    `);

    res.json({
      totalUsers: users.totalUsers,
      totalListings: listings.totalListings,
      avgListings: avgListings.toFixed(1),
      categories,
      sellers
    });

  } catch (error) {
    console.error("Activity report error:", error);

    res.status(500).json({
      message: "Could not load activity report."
    });
  }
});

module.exports = router;
