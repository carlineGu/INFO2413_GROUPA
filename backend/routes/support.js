"use strict";

const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
const MAX_MESSAGE_LENGTH = 2000;

router.use(requireAuth);

function parsePositiveInteger(value) {
  if (typeof value === "boolean" || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function formatTimestamp(value) {
  return value ? new Date(value).toISOString() : "";
}

async function findUser(userId) {
  const [rows] = await db.query(
    `SELECT user_id, user_role, account_status
       FROM User
      WHERE user_id = ?
      LIMIT 1`,
    [userId]
  );

  return rows[0] || null;
}

async function findConversation(conversationId) {
  const [rows] = await db.query(
    `SELECT sc.support_conversation_id,
            sc.user_id,
            sc.support_status,
            sc.created_at,
            sc.updated_at,
            CONCAT(u.first_name, ' ', u.last_name) AS user_name,
            u.email_addr AS user_email
       FROM Support_conversation sc
       JOIN User u ON u.user_id = sc.user_id
      WHERE sc.support_conversation_id = ?
      LIMIT 1`,
    [conversationId]
  );

  return rows[0] || null;
}

function ensureActiveUser(res, user) {
  if (!user) {
    res.status(404).json({ message: "User not found." });
    return false;
  }

  if (user.account_status !== "ACTIVE") {
    res.status(403).json({ message: "An active account is required." });
    return false;
  }

  return true;
}

function ensureConversationAccess(res, requester, conversation) {
  if (!conversation) {
    res.status(404).json({ message: "Support conversation not found." });
    return false;
  }

  if (
    requester.user_role !== "ADMIN" &&
    Number(requester.user_id) !== Number(conversation.user_id)
  ) {
    res.status(403).json({ message: "You cannot access this support conversation." });
    return false;
  }

  return true;
}

function sendDatabaseError(res, operation, error) {
  console.error(`${operation} error:`, error);

  if (error.code === "ER_NO_SUCH_TABLE") {
    return res.status(503).json({
      message: "Support messaging is not configured in the database yet."
    });
  }

  return res.status(500).json({ message: `Could not ${operation.toLowerCase()}.` });
}

router.post("/conversations", async (req, res) => {
  const userId = req.auth.userId;

  try {
    const user = await findUser(userId);
    if (!ensureActiveUser(res, user)) return;

    if (user.user_role === "ADMIN") {
      return res.status(400).json({
        message: "Admin accounts cannot open a user support conversation."
      });
    }

    const [existing] = await db.query(
      `SELECT support_conversation_id, support_status
         FROM Support_conversation
        WHERE user_id = ?
        LIMIT 1`,
      [userId]
    );

    if (existing.length > 0) {
      if (existing[0].support_status === "CLOSED") {
        await db.query(
          `UPDATE Support_conversation
              SET support_status = 'OPEN'
            WHERE support_conversation_id = ?`,
          [existing[0].support_conversation_id]
        );
      }

      return res.json({
        conversationId: Number(existing[0].support_conversation_id),
        status: "OPEN"
      });
    }

    try {
      const [result] = await db.query(
        `INSERT INTO Support_conversation (user_id)
         VALUES (?)`,
        [userId]
      );

      return res.status(201).json({
        conversationId: Number(result.insertId),
        status: "OPEN"
      });
    } catch (error) {
      if (error.code !== "ER_DUP_ENTRY") throw error;

      const [createdByAnotherRequest] = await db.query(
        `SELECT support_conversation_id, support_status
           FROM Support_conversation
          WHERE user_id = ?
          LIMIT 1`,
        [userId]
      );

      return res.json({
        conversationId: Number(createdByAnotherRequest[0].support_conversation_id),
        status: createdByAnotherRequest[0].support_status
      });
    }
  } catch (error) {
    return sendDatabaseError(res, "Start support conversation", error);
  }
});

router.get("/conversations", async (req, res) => {
  const adminId = req.auth.userId;

  try {
    const admin = await findUser(adminId);
    if (!ensureActiveUser(res, admin)) return;

    if (admin.user_role !== "ADMIN") {
      return res.status(403).json({ message: "Admin access is required." });
    }

    const [rows] = await db.query(
      `SELECT sc.support_conversation_id,
              sc.support_status,
              sc.created_at,
              sc.updated_at,
              CONCAT(u.first_name, ' ', u.last_name) AS user_name,
              u.email_addr AS user_email,
              latest.content AS last_message,
              latest.sent_at AS last_sent_at,
              latest.sender_id AS last_sender_id,
              latest_sender.user_role AS last_sender_role,
              COALESCE(unread.unread_count, 0) AS unread_count
         FROM Support_conversation sc
         JOIN User u ON u.user_id = sc.user_id
         LEFT JOIN Support_message latest
           ON latest.support_message_id = (
             SELECT sm.support_message_id
               FROM Support_message sm
              WHERE sm.support_conversation_id = sc.support_conversation_id
              ORDER BY sm.sent_at DESC, sm.support_message_id DESC
              LIMIT 1
           )
         LEFT JOIN User latest_sender ON latest_sender.user_id = latest.sender_id
         LEFT JOIN (
           SELECT sm.support_conversation_id, COUNT(*) AS unread_count
             FROM Support_message sm
             JOIN Support_conversation unread_conversation
               ON unread_conversation.support_conversation_id = sm.support_conversation_id
            WHERE sm.read_at IS NULL
              AND sm.sender_id = unread_conversation.user_id
            GROUP BY sm.support_conversation_id
         ) unread ON unread.support_conversation_id = sc.support_conversation_id
        ORDER BY COALESCE(latest.sent_at, sc.updated_at) DESC,
                 sc.support_conversation_id DESC`
    );

    const conversations = rows.map((row) => {
      let lastSenderLabel = "";
      if (row.last_sender_id) {
        if (Number(row.last_sender_id) === adminId) {
          lastSenderLabel = "You";
        } else if (row.last_sender_role === "ADMIN") {
          lastSenderLabel = "Admin";
        } else {
          lastSenderLabel = row.user_name;
        }
      }

      return {
        conversationId: Number(row.support_conversation_id),
        userName: row.user_name,
        userEmail: row.user_email,
        status: row.support_status,
        lastMessage: row.last_message || "",
        lastSentAt: formatTimestamp(row.last_sent_at),
        lastSenderLabel,
        unreadCount: Number(row.unread_count)
      };
    });

    return res.json({
      conversations,
      total: conversations.length,
      openCount: conversations.filter((conversation) => conversation.status === "OPEN").length,
      unreadCount: conversations.reduce(
        (total, conversation) => total + conversation.unreadCount,
        0
      )
    });
  } catch (error) {
    return sendDatabaseError(res, "Load support conversations", error);
  }
});

router.get("/conversations/:conversationId", async (req, res) => {
  const conversationId = parsePositiveInteger(req.params.conversationId);
  const requesterId = req.auth.userId;

  if (!conversationId) {
    return res.status(400).json({ message: "A valid conversationId is required." });
  }

  try {
    const requester = await findUser(requesterId);
    if (!ensureActiveUser(res, requester)) return;

    const conversation = await findConversation(conversationId);
    if (!ensureConversationAccess(res, requester, conversation)) return;

    const [messages] = await db.query(
      `SELECT sm.support_message_id,
              sm.sender_id,
              sm.content,
              sm.sent_at,
              CONCAT(sender.first_name, ' ', sender.last_name) AS sender_name
         FROM Support_message sm
         JOIN User sender ON sender.user_id = sm.sender_id
        WHERE sm.support_conversation_id = ?
        ORDER BY sm.sent_at ASC, sm.support_message_id ASC`,
      [conversationId]
    );

    return res.json({
      conversationId: Number(conversation.support_conversation_id),
      userName: conversation.user_name,
      userEmail: conversation.user_email,
      status: conversation.support_status,
      messages: messages.map((message) => ({
        messageId: Number(message.support_message_id),
        senderId: Number(message.sender_id),
        senderName: message.sender_name,
        content: message.content,
        sentAt: formatTimestamp(message.sent_at)
      }))
    });
  } catch (error) {
    return sendDatabaseError(res, "Load support conversation", error);
  }
});

router.post("/conversations/:conversationId/messages", async (req, res) => {
  const conversationId = parsePositiveInteger(req.params.conversationId);
  const senderId = req.auth.userId;
  const rawContent = req.body?.content;

  if (!conversationId) {
    return res.status(400).json({ message: "A valid conversationId is required." });
  }

  if (typeof rawContent !== "string" || !rawContent.trim()) {
    return res.status(400).json({ message: "Message content is required." });
  }

  const content = rawContent.trim();
  if (content.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({
      message: `Message content cannot exceed ${MAX_MESSAGE_LENGTH} characters.`
    });
  }

  try {
    const sender = await findUser(senderId);
    if (!ensureActiveUser(res, sender)) return;

    const conversation = await findConversation(conversationId);
    if (!ensureConversationAccess(res, sender, conversation)) return;

    if (conversation.support_status !== "OPEN") {
      return res.status(409).json({
        message: "This support conversation is closed."
      });
    }

    const [result] = await db.query(
      `INSERT INTO Support_message (support_conversation_id, sender_id, content)
       SELECT support_conversation_id, ?, ?
         FROM Support_conversation
        WHERE support_conversation_id = ?
          AND support_status = 'OPEN'`,
      [senderId, content, conversationId]
    );

    if (result.affectedRows === 0) {
      return res.status(409).json({
        message: "This support conversation is closed."
      });
    }

    return res.status(201).json({
      message: "Support message sent.",
      messageId: Number(result.insertId)
    });
  } catch (error) {
    return sendDatabaseError(res, "Send support message", error);
  }
});

router.patch("/conversations/:conversationId/read", async (req, res) => {
  const conversationId = parsePositiveInteger(req.params.conversationId);
  const readerId = req.auth.userId;
  const throughMessageId = parsePositiveInteger(req.body?.throughMessageId);

  if (!conversationId || !throughMessageId) {
    return res.status(400).json({
      message: "Valid conversationId and throughMessageId values are required."
    });
  }

  try {
    const reader = await findUser(readerId);
    if (!ensureActiveUser(res, reader)) return;

    const conversation = await findConversation(conversationId);
    if (!ensureConversationAccess(res, reader, conversation)) return;

    let updateSql;
    let parameters;

    if (reader.user_role === "ADMIN") {
      updateSql = `UPDATE Support_message
                      SET read_at = CURRENT_TIMESTAMP
                    WHERE support_conversation_id = ?
                      AND sender_id = ?
                      AND support_message_id <= ?
                      AND read_at IS NULL`;
      parameters = [conversationId, conversation.user_id, throughMessageId];
    } else {
      updateSql = `UPDATE Support_message
                      SET read_at = CURRENT_TIMESTAMP
                    WHERE support_conversation_id = ?
                      AND sender_id <> ?
                      AND support_message_id <= ?
                      AND read_at IS NULL`;
      parameters = [conversationId, readerId, throughMessageId];
    }

    const [result] = await db.query(updateSql, parameters);
    return res.json({
      message: "Support messages marked as read.",
      updatedCount: Number(result.affectedRows)
    });
  } catch (error) {
    return sendDatabaseError(res, "Mark support messages as read", error);
  }
});

router.patch("/conversations/:conversationId/status", async (req, res) => {
  const conversationId = parsePositiveInteger(req.params.conversationId);
  const status = typeof req.body?.status === "string"
    ? req.body.status.trim().toUpperCase()
    : "";

  if (!conversationId || !["OPEN", "CLOSED"].includes(status)) {
    return res.status(400).json({
      message: "A valid conversationId and an OPEN or CLOSED status are required."
    });
  }

  try {
    const admin = await findUser(req.auth.userId);
    if (!ensureActiveUser(res, admin)) return;

    if (admin.user_role !== "ADMIN") {
      return res.status(403).json({ message: "Admin access is required." });
    }

    const conversation = await findConversation(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Support conversation not found." });
    }

    await db.query(
      `UPDATE Support_conversation
          SET support_status = ?
        WHERE support_conversation_id = ?`,
      [status, conversationId]
    );

    return res.json({
      message: `Support conversation ${status === "OPEN" ? "reopened" : "closed"}.`,
      status
    });
  } catch (error) {
    return sendDatabaseError(res, "Update support conversation status", error);
  }
});

router.get("/unread-count", async (req, res) => {
  const userId = req.auth.userId;

  try {
    const user = await findUser(userId);
    if (!ensureActiveUser(res, user)) return;

    let sql;
    let parameters = [];

    if (user.user_role === "ADMIN") {
      sql = `SELECT COUNT(*) AS unread_count
               FROM Support_message sm
               JOIN Support_conversation sc
                 ON sc.support_conversation_id = sm.support_conversation_id
              WHERE sm.read_at IS NULL
                AND sm.sender_id = sc.user_id`;
    } else {
      sql = `SELECT COUNT(*) AS unread_count
               FROM Support_message sm
               JOIN Support_conversation sc
                 ON sc.support_conversation_id = sm.support_conversation_id
              WHERE sc.user_id = ?
                AND sm.sender_id <> ?
                AND sm.read_at IS NULL`;
      parameters = [userId, userId];
    }

    const [rows] = await db.query(sql, parameters);
    return res.json({ unreadCount: Number(rows[0].unread_count) });
  } catch (error) {
    return sendDatabaseError(res, "Load unread support count", error);
  }
});

module.exports = router;
