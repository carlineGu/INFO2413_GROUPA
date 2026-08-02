const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../db");
const crypto = require("node:crypto");
const jwt = require("jsonwebtoken");

const {sendVerificationEmail} = require("../services/emailService");
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

    if (!normalizedEmail.endsWith("@student.kpu.ca") && !normalizedEmail.endsWith("@kpu.ca")) {
      return res.status(400).json({
        message: "A valid @student.kpu.ca or @kpu.ca email is required."
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

    const verificationToken = jwt.sign(
      {
        user_id: result.insertId,
        email_addr: normalizedEmail
      },
      process.env.EMAIL_VERIFICATION_SECRET,
      {
        expiresIn:"30d"
      }
    );

    const verificationLink =
      `${process.env.APP_URL}/api/auth/verify-email?token=` +
      encodeURIComponent(verificationToken);

    await sendVerificationEmail(
      normalizedEmail,
      `${firstName} ${lastName}`,
      verificationLink
    );


    return res.status(201).json({
      message: "Account created successfully. Please check your email to activate your account.",
      userId: result.insertId
    });
  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      message: "Server error while creating the account."
    });
  }
});

router.get("/verify-email", async (req, res) => {
  try {
    const token = req.query.token;

    if (!token) {
      return res.status(400).send("Verification link is invalid.");
    }

    const payload = jwt.verify(
      token,
      process.env.EMAIL_VERIFICATION_SECRET
    );

    const [users] = await db.query(
      `
      SELECT user_id, email_addr, account_status
      FROM User
      WHERE user_id = ?
        AND email_addr = ?
      LIMIT 1
      `,
      [
        payload.user_id,
        payload.email_addr
      ]
    );

    if (users.length === 0) {
      return res.status(404).send("Account not found.");
    }

    const user = users[0];

    if (user.account_status === "ACTIVE") {
      return res.send(`
        <h1>Account already activated</h1>
        <p>Your email has already been verified.</p>
        <a href="/html/login.html">Go to login</a>
      `);
    }

    await db.query(
      `
      UPDATE User
      SET account_status = 'ACTIVE'
      WHERE user_id = ?
        AND email_addr = ?
      `,
      [
        payload.user_id,
        payload.email_addr
      ]
    );

    return res.send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Account activated</title>
        </head>

        <body>
          <h1>Your account has been activated!</h1>
          <p>You can now log in to Campus Marketplace.</p>
          <a href="/html/login.html">Go to login</a>
        </body>
      </html>
    `);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(400).send(`
        <h1>Verification link expired</h1>
        <p>Please request another verification email.</p>
      `);
    }

    console.error("Verification error:", error);

    return res.status(400).send(`
      <h1>Invalid verification link</h1>
      <p>The verification link is not valid.</p>
    `);
  }
});


module.exports = router;