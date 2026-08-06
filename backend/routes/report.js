const express = require("express");
const db = require("../db");

const router = express.Router();
const MIN_REASON_LENGTH = 10;
const MAX_REASON_LENGTH = 2000;

function parsePositiveInteger(value) {
  if (typeof value !== "number" && typeof value !== "string") {
    return null;
  }

  if (typeof value === "string" && !/^[1-9]\d*$/.test(value.trim())) {
    return null;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 && parsed <= 4294967295
    ? parsed
    : null;
}

function optionalPositiveInteger(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return parsePositiveInteger(value);
}

router.post("/", async (req, res) => {
  const body = req.body || {};
  const reporterId = parsePositiveInteger(body.reporterId);
  const targetUserId = optionalPositiveInteger(body.targetUserId);
  const listingId = optionalPositiveInteger(body.listingId);
  const targetUserWasProvided = body.targetUserId !== undefined
    && body.targetUserId !== null
    && body.targetUserId !== "";
  const listingWasProvided = body.listingId !== undefined
    && body.listingId !== null
    && body.listingId !== "";

  if (!reporterId) {
    return res.status(400).json({ message: "reporterId must be a valid positive integer." });
  }

  if ((targetUserWasProvided && !targetUserId) || (listingWasProvided && !listingId)) {
    return res.status(400).json({ message: "Report target IDs must be valid positive integers." });
  }

  if (!targetUserId && !listingId) {
    return res.status(400).json({ message: "targetUserId or listingId is required." });
  }

  if (targetUserId === reporterId) {
    return res.status(400).json({ message: "You cannot report yourself." });
  }

  if (typeof body.reason !== "string") {
    return res.status(400).json({ message: "Reason must be text." });
  }

  const reason = body.reason.trim();

  if (reason.length < MIN_REASON_LENGTH || reason.length > MAX_REASON_LENGTH) {
    return res.status(400).json({
      message: `Reason must be between ${MIN_REASON_LENGTH} and ${MAX_REASON_LENGTH} characters.`
    });
  }

  try {
    const checks = [
      db.query("SELECT user_id FROM User WHERE user_id = ?", [reporterId])
    ];

    if (targetUserId) {
      checks.push(db.query("SELECT user_id FROM User WHERE user_id = ?", [targetUserId]));
    }

    if (listingId) {
      checks.push(db.query("SELECT listing_id, user_id FROM Listing WHERE listing_id = ?", [listingId]));
    }

    const results = await Promise.all(checks);
    let resultIndex = 0;
    const reporterRows = results[resultIndex++][0];
    const targetRows = targetUserId ? results[resultIndex++][0] : null;
    const listingRows = listingId ? results[resultIndex][0] : null;

    if (reporterRows.length === 0) {
      return res.status(401).json({ message: "The signed-in user could not be found." });
    }

    if (targetRows && targetRows.length === 0) {
      return res.status(404).json({ message: "The reported user could not be found." });
    }

    if (listingRows && listingRows.length === 0) {
      return res.status(404).json({ message: "The reported listing could not be found." });
    }

    if (listingRows && Number(listingRows[0].user_id) === reporterId) {
      return res.status(400).json({ message: "You cannot report your own listing." });
    }

    if (listingRows && targetUserId && Number(listingRows[0].user_id) !== targetUserId) {
      return res.status(400).json({
        message: "targetUserId must identify the seller of the reported listing."
      });
    }

    const [result] = await db.query(
      `INSERT INTO Report (reason, reporter_id, target_user_id, listing_id)
       VALUES (?, ?, ?, ?)`,
      [reason, reporterId, targetUserId, listingId]
    );

    return res.status(201).json({
      message: "Report submitted. Thank you for helping keep the marketplace safe.",
      report: {
        reportId: result.insertId,
        reporterId,
        targetUserId,
        listingId,
        reason,
        reportStatus: "PENDING"
      }
    });
  } catch (error) {
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(404).json({ message: "A referenced user or listing was not found." });
    }

    console.error("Create report error:", error);
    return res.status(500).json({ message: "Could not submit the report." });
  }
});

module.exports = router;
