"use strict";

const express = require("express");
const db = require("../db");

const router = express.Router();

// Keep this in sync with the department values used across the site.
const ALLOWED_DEPARTMENTS = [
  "No Department",
  "Business",
  "Computer Information Systems / IT",
  "Nursing",
  "Criminology",
  "Design",
  "Science",
  "Arts",
  "General",
  "Other"
];

function toPrivateUserDto(user) {
  return {
    userId: Number(user.user_id),
    firstName: user.first_name,
    lastName: user.last_name,
    fullName: `${user.first_name} ${user.last_name}`.trim(),
    email: user.email_addr,
    accountStatus: user.account_status,
    department: user.department
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
      `SELECT user_id, first_name, last_name, email_addr, account_status, department
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

router.get("/admin", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        u.user_id,
        u.first_name,
        u.last_name,
        u.email_addr,
        u.account_status,
        COUNT(l.listing_id) AS listing_count
      FROM User u
      LEFT JOIN Listing l
        ON u.user_id = l.user_id
        AND l.listing_status = 'ACTIVE'
      GROUP BY u.user_id
      ORDER BY u.last_name, u.first_name
    `);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Could not load users."
    });
  }
});

router.patch("/admin/:id/suspend", async (req, res) => {
  try {
    await db.query(
      `UPDATE User
       SET account_status = 'SUSPENDED'
       WHERE user_id = ?`,
      [req.params.id]
    );

    res.json({ message: "User suspended." });
  } catch (error) {
    res.status(500).json({
      message: "Could not suspend user."
    });
  }
});

router.patch("/admin/:id/reinstate", async (req, res) => {
  try {
    await db.query(
      `UPDATE User
       SET account_status = 'ACTIVE'
       WHERE user_id = ?`,
      [req.params.id]
    );

    res.json({ message: "User reinstated." });
  } catch (error) {
    res.status(500).json({
      message: "Could not reinstate user."
    });
  }
});

router.patch("/admin/:id/remove", async (req, res) => {
  try {
    await db.query(
      `UPDATE User
       SET account_status = 'INACTIVE'
       WHERE user_id = ?`,
      [req.params.id]
    );

    res.json({ message: "User removed." });
  } catch (error) {
    res.status(500).json({
      message: "Could not remove user."
    });
  }
});

router.patch("/:id/department", async (req, res) => {
  const userId = Number(req.params.id);
  const department = String(req.body?.department ?? "").trim();

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: "A valid user id is required." });
  }

  if (!ALLOWED_DEPARTMENTS.includes(department)) {
    return res.status(400).json({ message: "Please select a valid department." });
  }

  try {
    const [result] = await db.query(
      `UPDATE User
       SET department = ?
       WHERE user_id = ?`,
      [department, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json({ message: "Department updated.", department });
  } catch (error) {
    console.error("Update department error:", error);
    return res.status(500).json({ message: "Could not update department." });
  }
});

router.get("/:id", async (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ message: "A valid user id is required." });
  }

  try {
    const [rows] = await db.query(
      "SELECT user_id, first_name, last_name, account_status, department, created_at FROM User WHERE user_id = ?",
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
      department: user.department,
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