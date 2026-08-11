const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../db");
const crypto = require("node:crypto");
const jwt = require("jsonwebtoken");

const { sendPasswordResetEmail, sendVerificationEmail } = require("../services/emailService");
const { signAccessToken } = require("../middleware/auth");
const router = express.Router();
const PASSWORD_RESET_SECRET = process.env.PASSWORD_RESET_SECRET || process.env.EMAIL_VERIFICATION_SECRET;

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const [users] = await db.query(
      `SELECT user_id, first_name, last_name, email_addr, password_hash, account_status, user_role
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

    if (user.account_status !== "ACTIVE") {
      return res.status(403).json({
        message: "Please verify your email before logging in."
      });
    }

    return res.json({
      message: "Login successful.",
      accessToken: signAccessToken(user.user_id),
      user: {
        userId: Number(user.user_id),
        firstName: user.first_name,
        lastName: user.last_name,
        fullName: `${user.first_name} ${user.last_name}`.trim(),
        email: user.email_addr,
        accountStatus: user.account_status,
        user_role: user.user_role

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

router.post("/request-password-reset", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const [users] = await db.query(
      `SELECT user_id, first_name, last_name, email_addr
       FROM User
       WHERE email_addr = ?
       LIMIT 1`,
      [email]
    );

    if (users.length === 0) {
      return res.status(200).json({
        message: "If an account exists for that email, a password reset link has been sent."
      });
    }

    const user = users[0];
    const resetToken = jwt.sign(
      {
        user_id: user.user_id,
        email_addr: user.email_addr
      },
      PASSWORD_RESET_SECRET,
      { expiresIn: "1h" }
    );

    const resetLink = `${process.env.APP_URL}/html/reset-password.html?token=${encodeURIComponent(resetToken)}`;

    await sendPasswordResetEmail(
      user.email_addr,
      `${user.first_name} ${user.last_name}`.trim(),
      resetLink
    );

    return res.status(200).json({
      message: "If an account exists for that email, a password reset link has been sent."
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    return res.status(500).json({ message: "Could not send the password reset email." });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body || {};

    if (!token) {
      return res.status(400).json({ message: "Reset token is missing." });
    }

    if (!password || String(password).length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long." });
    }

    const payload = jwt.verify(token, PASSWORD_RESET_SECRET);
    const email = String(payload.email_addr || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ message: "Invalid reset token." });
    }

    const [users] = await db.query(
      `SELECT user_id, email_addr
       FROM User
       WHERE user_id = ?
         AND email_addr = ?
       LIMIT 1`,
      [payload.user_id, email]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found for this reset token." });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await db.query(
      `UPDATE User
       SET password_hash = ?
       WHERE user_id = ?
         AND email_addr = ?`,
      [passwordHash, payload.user_id, email]
    );

    return res.status(200).json({
      message: "Password reset successful. Please sign in with your new password."
    });
  } catch (error) {
    if (error && error.name === "TokenExpiredError") {
      return res.status(400).json({ message: "This reset link has expired. Please request a new one." });
    }

    console.error("Password reset error:", error);
    return res.status(400).json({ message: "Invalid or expired reset token." });
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
