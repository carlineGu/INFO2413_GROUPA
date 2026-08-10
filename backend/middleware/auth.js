"use strict";

const jwt = require("jsonwebtoken");

const TOKEN_ISSUER = "campus-marketplace";
const TOKEN_AUDIENCE = "campus-marketplace-api";

function getTokenSecret() {
  const secret = process.env.AUTH_TOKEN_SECRET || process.env.EMAIL_VERIFICATION_SECRET;

  if (!secret) {
    throw new Error("AUTH_TOKEN_SECRET or EMAIL_VERIFICATION_SECRET must be configured.");
  }

  return secret;
}

function signAccessToken(userId) {
  return jwt.sign(
    {},
    getTokenSecret(),
    {
      subject: String(userId),
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
      expiresIn: "12h"
    }
  );
}

function requireAuth(req, res, next) {
  const authorization = req.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return res.status(401).json({ message: "Please log in to continue." });
  }

  try {
    const payload = jwt.verify(match[1], getTokenSecret(), {
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE
    });
    const userId = Number(payload.sub);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return res.status(401).json({ message: "The login session is invalid." });
    }

    req.auth = { userId };
    return next();
  } catch (error) {
    if (error.message?.includes("must be configured")) {
      console.error("Authentication configuration error:", error.message);
      return res.status(500).json({ message: "Authentication is not configured." });
    }

    const message = error.name === "TokenExpiredError"
      ? "Your login session has expired. Please log in again."
      : "The login session is invalid.";
    return res.status(401).json({ message });
  }
}

module.exports = { requireAuth, signAccessToken };
