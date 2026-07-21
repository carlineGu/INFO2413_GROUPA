const express = require("express");
const db = require("../db");

const router = express.Router();

router.get("/me", async (req, res) => {
  try {
    const userId = req.query.userId || req.query.user_id;
    const email = req.query.email || req.query.email_addr;

    if (!userId && !email) {
      return res.status(401).json({ message: "User not authenticated." });
    }

    let query = "SELECT user_id, first_name, last_name, email_addr, account_status FROM User WHERE 1 = 1";
    const values = [];

    if (userId) {
      query += " AND user_id = ?";
      values.push(userId);
    } else if (email) {
      query += " AND email_addr = ?";
      values.push(email.toLowerCase().trim());
    }

    const [rows] = await db.query(query, values);

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const user = rows[0];
    const fullName = `${user.first_name} ${user.last_name}`.trim();

    return res.json({
      user_id: user.user_id,
      fullName,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email_addr,
      email_addr: user.email_addr,
      account_status: user.account_status
    });
  } catch (error) {
    console.error("User profile error:", error);
    return res.status(500).json({ message: "Could not load user profile." });
  }
});

// GET /api/user/:id -> public profile info for viewing another user (e.g. a seller)
router.get("/:id", async (req, res) => {
  try {
    const userId = Number(req.params.id);

    if (!userId) {
      return res.status(400).json({ message: "A valid user id is required." });
    }

    const [rows] = await db.query(
      "SELECT user_id, first_name, last_name, account_status, created_at FROM User WHERE user_id = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const user = rows[0];

    const [listingCountRows] = await db.query(
      "SELECT COUNT(*) AS listing_count FROM Listing WHERE user_id = ? AND listing_status = 'ACTIVE'",
      [userId]
    );

    const [ratingRows] = await db.query(
      "SELECT ROUND(AVG(rating), 1) AS avg_rating, COUNT(*) AS review_count FROM Review WHERE reviewed_user_id = ?",
      [userId]
    );

    res.json({
      user_id: user.user_id,
      fullName: `${user.first_name} ${user.last_name}`.trim(),
      first_name: user.first_name,
      last_name: user.last_name,
      account_status: user.account_status,
      memberSince: user.created_at,
      listingCount: listingCountRows[0].listing_count,
      avgRating: ratingRows[0].avg_rating,
      reviewCount: ratingRows[0].review_count
    });
  } catch (error) {
    console.error("Public profile error:", error);
    res.status(500).json({ message: "Could not load user profile." });
  }
});

module.exports = router;
