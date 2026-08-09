"use strict";

const express = require("express");
const db = require("../db");

const router = express.Router();


function toFavoriteDto(row) {
  return {
    listingId: Number(row.listing_id),
    userId: Number(row.user_id),
    title: row.listing_title,
    description: row.listing_description,
    price: Number(row.price),
    condition: row.listing_condition,
    status: row.listing_status,
    createdAt: row.created_at,
    photo: row.photo || null,
    favoritedAt: row.favorited_at,
    sellerName: row.seller_name
  };
}

router.get("/", async (req, res) => {
  const userId = Number(req.query.userId ?? req.query.user_id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: "A valid userId is required." });
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
         LEFT JOIN Listing_image li
           ON li.listing_id = l.listing_id AND li.is_primary = TRUE
        WHERE f.user_id = ?
        ORDER BY f.created_at DESC`,
      [userId]
    );

    return res.json(rows.map(toFavoriteDto));
  } catch (error) {
    console.error("Load favorites error:", error);
    return res.status(500).json({ message: "Could not load favorites." });
  }
});

router.post("/", async (req, res) => {
  const userId = Number(req.body.userId ?? req.body.user_id);
  const listingId = Number(req.body.listingId ?? req.body.listing_id);

  if (!Number.isInteger(userId) || userId <= 0 || !Number.isInteger(listingId) || listingId <= 0) {
    return res.status(400).json({ message: "Valid userId and listingId values are required." });
  }

  try {
    const [listingRows] = await db.query(
      "SELECT listing_id, user_id FROM Listing WHERE listing_id = ? AND listing_status = 'ACTIVE'",
      [listingId]
    );

    if (listingRows.length === 0) {
      return res.status(404).json({ message: "Listing not found." });
    }

    if (Number(listingRows[0].user_id) === userId) {
      return res.status(400).json({ message: "You cannot favorite your own listing." });
    }

    await db.query(
      `INSERT INTO Favorite (user_id, listing_id) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE created_at = created_at`,
      [userId, listingId]
    );

    return res.status(201).json({ message: "Listing added to favorites.", listingId });
  } catch (error) {
    console.error("Add favorite error:", error);
    return res.status(500).json({ message: "Could not favorite listing." });
  }
});

router.delete("/:listingId", async (req, res) => {
  // console.log("Req.params = ", req.params);
  const listingId = Number(req.params.listingId);
  //console.log("Req = ",req); 
  //console.log("Req.body =", req.body);
  //console.log("Req.body.userId =", req.body.userId);

  const userId = Number(req.body.userId ?? req.body.user_id ?? req.query.userId ?? req.query.user_id);

  //console.log(userId,listingId);
  if (!Number.isInteger(listingId) || listingId <= 0 || !Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: "Valid userId and listingId values are required." });
  }

  try {
    const [result] = await db.query(
      "DELETE FROM Favorite WHERE user_id = ? AND listing_id = ?",
      [userId, listingId]
    );

    return res.json({
      message: result.affectedRows ? "Listing removed from favorites." : "Listing was not in favorites.",
      listingId
    });
  } catch (error) {
    console.error("Remove favorite error:", error);
    return res.status(500).json({ message: "Could not remove favorite." });
  }
});

module.exports = router;
