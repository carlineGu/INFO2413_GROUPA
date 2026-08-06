const express = require("express");
const db = require("../db");

const router = express.Router();
const MAX_COMMENT_LENGTH = 2000;

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

function isProvided(value) {
  return value !== undefined && value !== null && value !== "";
}

router.get("/", async (req, res) => {
  const reviewedUserProvided = isProvided(req.query.reviewedUserId);
  const listingProvided = isProvided(req.query.listingId);
  const reviewedUserId = reviewedUserProvided
    ? parsePositiveInteger(req.query.reviewedUserId)
    : null;
  const listingId = listingProvided
    ? parsePositiveInteger(req.query.listingId)
    : null;
  const limitProvided = isProvided(req.query.limit);
  const limit = limitProvided ? parsePositiveInteger(req.query.limit) : 10;

  if (!reviewedUserProvided && !listingProvided) {
    return res.status(400).json({
      message: "reviewedUserId or listingId is required."
    });
  }

  if ((reviewedUserProvided && !reviewedUserId) || (listingProvided && !listingId)) {
    return res.status(400).json({ message: "Review filters must be valid positive integers." });
  }

  if (!limit || limit > 50) {
    return res.status(400).json({ message: "limit must be a positive integer no greater than 50." });
  }

  try {
    const conditions = [];
    const values = [];

    if (reviewedUserId) {
      conditions.push("r.reviewed_user_id = ?");
      values.push(reviewedUserId);
    }

    if (listingId) {
      conditions.push("r.listing_id = ?");
      values.push(listingId);
    }

    const [rows] = await db.query(
      `SELECT r.review_id,
              r.rating,
              r.comment,
              r.reviewer_user_id,
              r.reviewed_user_id,
              r.listing_id,
              r.created_at,
              CONCAT(u.first_name, ' ', u.last_name) AS reviewer_name
         FROM Review r
         JOIN User u ON u.user_id = r.reviewer_user_id
        WHERE ${conditions.join(" AND ")}
        ORDER BY r.created_at DESC, r.review_id DESC
        LIMIT ?`,
      [...values, limit]
    );

    return res.json({
      reviews: rows.map((row) => ({
        reviewId: row.review_id,
        rating: row.rating,
        comment: row.comment,
        reviewerUserId: row.reviewer_user_id,
        reviewedUserId: row.reviewed_user_id,
        listingId: row.listing_id,
        createdAt: row.created_at,
        reviewerName: row.reviewer_name
      }))
    });
  } catch (error) {
    console.error("Load reviews error:", error);
    return res.status(500).json({ message: "Could not load reviews." });
  }
});

router.post("/", async (req, res) => {
  const body = req.body || {};
  const reviewerUserId = parsePositiveInteger(body.reviewerUserId);
  const reviewedUserId = parsePositiveInteger(body.reviewedUserId);
  const listingId = parsePositiveInteger(body.listingId);
  const rating = typeof body.rating === "number" || typeof body.rating === "string"
    ? Number(body.rating)
    : Number.NaN;

  if (!reviewerUserId || !reviewedUserId || !listingId) {
    return res.status(400).json({
      message: "reviewerUserId, reviewedUserId, and listingId must be valid positive integers."
    });
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating must be an integer from 1 to 5." });
  }

  if (reviewerUserId === reviewedUserId) {
    return res.status(400).json({ message: "You cannot review yourself." });
  }

  if (isProvided(body.comment) && typeof body.comment !== "string") {
    return res.status(400).json({ message: "Comment must be text." });
  }

  const comment = typeof body.comment === "string" ? body.comment.trim() : "";

  if (comment.length > MAX_COMMENT_LENGTH) {
    return res.status(400).json({
      message: `Comment must be ${MAX_COMMENT_LENGTH} characters or fewer.`
    });
  }

  try {
    const [listingResult, reviewerResult] = await Promise.all([
      db.query("SELECT user_id FROM Listing WHERE listing_id = ?", [listingId]),
      db.query("SELECT user_id FROM User WHERE user_id = ?", [reviewerUserId])
    ]);
    const listingRows = listingResult[0];
    const reviewerRows = reviewerResult[0];

    if (reviewerRows.length === 0) {
      return res.status(401).json({ message: "The signed-in user could not be found." });
    }

    if (listingRows.length === 0) {
      return res.status(404).json({ message: "Listing not found." });
    }

    if (Number(listingRows[0].user_id) !== reviewedUserId) {
      return res.status(400).json({
        message: "reviewedUserId must identify the seller of this listing."
      });
    }

    const [result] = await db.query(
      `INSERT INTO Review
         (rating, comment, reviewer_user_id, reviewed_user_id, listing_id)
       VALUES (?, ?, ?, ?, ?)`,
      [rating, comment || null, reviewerUserId, reviewedUserId, listingId]
    );

    return res.status(201).json({
      message: "Review submitted.",
      review: {
        reviewId: result.insertId,
        rating,
        comment: comment || null,
        reviewerUserId,
        reviewedUserId,
        listingId
      }
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "You have already reviewed this seller for this listing."
      });
    }

    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(404).json({ message: "A referenced user or listing was not found." });
    }

    console.error("Create review error:", error);
    return res.status(500).json({ message: "Could not submit the review." });
  }
});

module.exports = router;
