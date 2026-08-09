"use strict";

const express = require("express");
const db = require("../db");

const router = express.Router();

function toPrivateUserDto(user) {
  return {
    userId: Number(user.user_id),
    firstName: user.first_name,
    lastName: user.last_name,
    fullName: `${user.first_name} ${user.last_name}`.trim(),
    email: user.email_addr,
    accountStatus: user.account_status
  };
}

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT user_id, first_name, last_name, email_addr, account_status, created_at
         FROM User
        ORDER BY created_at DESC`
    );

    return res.json({
      users: rows.map((user) => ({
        userId: Number(user.user_id),
        firstName: user.first_name,
        lastName: user.last_name,
        fullName: `${user.first_name} ${user.last_name}`.trim(),
        email: user.email_addr,
        accountStatus: user.account_status,
        createdAt: user.created_at
      })),
      total: rows.length
    });
  } catch (error) {
    console.error("List users error:", error);
    return res.status(500).json({ message: "Could not list users." });
  }
});

router.get("/me", async (req, res) => {
  const userId = Number(req.query.userId ?? req.query.user_id);
  const email = String(req.query.email ?? req.query.email_addr ?? "").trim().toLowerCase();

  if ((!Number.isInteger(userId) || userId <= 0) && !email) {
    return res.status(401).json({ message: "User is not authenticated." });
  }

  try {
    const useId = Number.isInteger(userId) && userId > 0;
    const [rows] = await db.query(
      `SELECT user_id, first_name, last_name, email_addr, account_status
         FROM User
        WHERE ${useId ? "user_id" : "email_addr"} = ?
        LIMIT 1`,
      [useId ? userId : email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json(toPrivateUserDto(rows[0]));
  } catch (error) {
    console.error("User profile error:", error);
    return res.status(500).json({ message: "Could not load user profile." });
  }
});

router.get("/:id", async (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: "A valid user id is required." });
  }

  try {
    const [rows] = await db.query(
      "SELECT user_id, first_name, last_name, account_status, created_at FROM User WHERE user_id = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const [listingCountRows] = await db.query(
      "SELECT COUNT(*) AS listing_count FROM Listing WHERE user_id = ? AND listing_status = 'ACTIVE'",
      [userId]
    );
    const [ratingRows] = await db.query(
      "SELECT ROUND(AVG(rating), 1) AS avg_rating, COUNT(*) AS review_count FROM Review WHERE reviewed_user_id = ?",
      [userId]
    );

    const user = rows[0];
    return res.json({
      userId: Number(user.user_id),
      firstName: user.first_name,
      lastName: user.last_name,
      fullName: `${user.first_name} ${user.last_name}`.trim(),
      accountStatus: user.account_status,
      memberSince: user.created_at,
      listingCount: Number(listingCountRows[0].listing_count),
      averageRating: Number(ratingRows[0].avg_rating || 0),
      reviewCount: Number(ratingRows[0].review_count)
    });
  } catch (error) {
    console.error("Public profile error:", error);
    return res.status(500).json({ message: "Could not load user profile." });
  }
});

module.exports = router;
