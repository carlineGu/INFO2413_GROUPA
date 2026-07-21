const express = require("express");
const router = express.Router();
const db = require("../db");

// GET /api/favorite?userId=X  -> list of listings the user has favorited
router.get("/", async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(401).json({ message: "userId is required." });
  }

  try {
    const [rows] = await db.query(
      `SELECT l.listing_id, l.user_id, l.listing_title, l.listing_description, l.price,
              l.listing_condition, l.listing_status, l.created_at,
              li.image_url AS photo,
              f.created_at AS favorited_at,
              CONCAT(u.first_name, ' ', u.last_name) AS seller_name
         FROM Favorite f
         JOIN Listing l ON l.listing_id = f.listing_id
         JOIN User u ON u.user_id = l.user_id
         LEFT JOIN Listing_image li ON li.listing_id = l.listing_id AND li.is_primary = TRUE
        WHERE f.user_id = ?
        ORDER BY f.created_at DESC`,
      [userId]
    );

    res.json(rows);
  } catch (error) {
    console.error("Load favorites error:", error);
    res.status(500).json({ message: "Could not load favorites." });
  }
});

// POST /api/favorite  { userId, listingId } -> favorite a listing
router.post("/", async (req, res) => {
  try {
    const userId = Number(req.body.userId);
    const listingId = Number(req.body.listingId);

    if (!userId || !listingId) {
      return res.status(400).json({ message: "userId and listingId are required." });
    }

    const [listingRows] = await db.query(
      `SELECT listing_id, user_id FROM Listing WHERE listing_id = ?`,
      [listingId]
    );

    if (listingRows.length === 0) {
      return res.status(404).json({ message: "Listing not found." });
    }

    if (listingRows[0].user_id === userId) {
      return res.status(400).json({ message: "You cannot favorite your own listing." });
    }

    await db.query(
      `INSERT INTO Favorite (user_id, listing_id) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE created_at = created_at`,
      [userId, listingId]
    );

    res.status(201).json({ message: "Listing favorited." });
  } catch (error) {
    console.error("Add favorite error:", error);
    res.status(500).json({ message: "Could not favorite listing." });
  }
});

// DELETE /api/favorite/:listingId?userId=X -> remove a favorite
router.delete("/:listingId", async (req, res) => {
  try {
    const listingId = Number(req.params.listingId);
    const userId = Number(req.body.userId || req.query.userId);

    if (!listingId || !userId) {
      return res.status(400).json({ message: "userId and listingId are required." });
    }

    await db.query(
      `DELETE FROM Favorite WHERE user_id = ? AND listing_id = ?`,
      [userId, listingId]
    );

    res.json({ message: "Listing unfavorited." });
  } catch (error) {
    console.error("Remove favorite error:", error);
    res.status(500).json({ message: "Could not unfavorite listing." });
  }
});

module.exports = router;
