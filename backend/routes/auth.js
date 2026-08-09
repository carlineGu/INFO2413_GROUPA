const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../db");

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const [users] = await db.query(
      `SELECT user_id, first_name, last_name, email_addr, password_hash, account_status
       FROM User
       WHERE email_addr = ?`,
      [normalizedEmail]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    return res.json({
      message: "Login successful.",
      user: {
        user_id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        fullName: `${user.first_name} ${user.last_name}`.trim(),
        email: user.email_addr,
        email_addr: user.email_addr,
        account_status: user.account_status
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error while logging in." });
  }
});

router.post("/register", async (req, res) => {
  try {
    const {
      fullName,
      email,
      password
    } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        message: "All fields are required."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail.endsWith("@student.kpu.ca")) {
      return res.status(400).json({
        message: "A valid @student.kpu.ca email is required."
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must contain at least 8 characters."
      });
    }

    const [existingUsers] = await db.query(
      `
        SELECT user_id
        FROM User
        WHERE email_addr = ?
      `,
      [normalizedEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        message: "An account with this email already exists."
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const names = fullName.trim().split(/\s+/);

    const firstName = names[0];
    const lastName = names.slice(1).join(" ");
    const [result] = await db.query(
      `
        INSERT INTO User (
          first_name,
          last_name,
          email_addr,
          password_hash
        )
        VALUES (?, ?, ?, ?)
      `,
      [
        firstName,
        lastName,
        normalizedEmail,
        passwordHash
      ]
    );

    return res.status(201).json({
      message: "Account created successfully.",
      userId: result.insertId
    });
  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      message: "Server error while creating the account."
    });
  }
});

module.exports = router;