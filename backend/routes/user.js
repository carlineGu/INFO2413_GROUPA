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

module.exports = router;
