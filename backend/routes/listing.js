const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all listings
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM Listing");
    res.json(rows);
  } catch (error) {
    console.error("Error loading listings:", error);
    res.status(500).json({
      message: "Could not load listings."
    });
  }
});

module.exports = router;