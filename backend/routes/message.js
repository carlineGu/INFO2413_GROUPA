const express = require("express");
const db = require("../db");
const router = express.Router();

router.get("/inbox", async (req, res) => {
  const userId = req.query.userId;

  if (!userId) {
    return res.status(401).json({ message: "User ID is required." });
  }

  try {
    const [rows] = await db.query(
      `SELECT
         c.conversation_id,
         l.listing_title,
         c.buyer_id,
         c.seller_id,
         CONCAT(CASE WHEN c.buyer_id = ? THEN s.first_name ELSE b.first_name END, ' ', CASE WHEN c.buyer_id = ? THEN s.last_name ELSE b.last_name END) AS partner_name,
         CASE WHEN c.seller_id = ? THEN 'Your listing' ELSE 'Their listing' END AS role_label,
         lm.content AS last_message,
         lm.sent_at AS last_sent_at,
         CASE WHEN lm.sender_id = ? THEN 'You' ELSE 'Them' END AS last_sender_label
       FROM Conversation c
       JOIN Listing l ON l.listing_id = c.listing_id
       JOIN User b ON b.user_id = c.buyer_id
       JOIN User s ON s.user_id = c.seller_id
       LEFT JOIN (
         SELECT m1.conversation_id, m1.content, m1.sent_at, m1.sender_id
         FROM Message m1
         INNER JOIN (
           SELECT conversation_id, MAX(sent_at) AS latest
           FROM Message
           GROUP BY conversation_id
         ) m2 ON m1.conversation_id = m2.conversation_id AND m1.sent_at = m2.latest
       ) lm ON lm.conversation_id = c.conversation_id
       WHERE c.buyer_id = ? OR c.seller_id = ?
       ORDER BY lm.sent_at DESC`,
      [userId, userId, userId, userId, userId, userId]
    );

    const chats = rows.map((row) => ({
      conversationId: row.conversation_id,
      partnerName: row.partner_name,
      listingTitle: row.listing_title,
      roleLabel: row.role_label,
      lastMessage: row.last_message,
      lastSentAt: row.last_sent_at ? new Date(row.last_sent_at).toLocaleString() : "",
      lastSenderLabel: row.last_sender_label
    }));

    res.json({ chats });
  } catch (error) {
    console.error("Inbox error:", error);
    res.status(500).json({ message: "Could not load inbox." });
  }
});

router.get("/thread/:conversationId", async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.query.userId;

  if (!userId) {
    return res.status(401).json({ message: "User ID is required." });
  }

  try {
    const [conversations] = await db.query(
      `SELECT c.conversation_id,
              c.buyer_id,
              c.seller_id,
              l.listing_title,
              CONCAT(b.first_name, ' ', b.last_name) AS buyer_name,
              CONCAT(s.first_name, ' ', s.last_name) AS seller_name
         FROM Conversation c
         JOIN Listing l ON l.listing_id = c.listing_id
         JOIN User b ON b.user_id = c.buyer_id
         JOIN User s ON s.user_id = c.seller_id
        WHERE c.conversation_id = ?
          AND (? IN (c.buyer_id, c.seller_id))`,
      [conversationId, userId]
    );

    if (conversations.length === 0) {
      return res.status(404).json({ message: "Conversation not found." });
    }

    const conv = conversations[0];
    const partnerName = conv.buyer_id.toString() === userId.toString() ? conv.seller_name : conv.buyer_name;
    const roleLabel = conv.seller_id.toString() === userId.toString() ? "Your listing" : "Their listing";

    const [messages] = await db.query(
      `SELECT m.message_id, m.sender_id, m.content, m.sent_at, CONCAT(u.first_name, ' ', u.last_name) AS sender_name
         FROM Message m
         JOIN User u ON u.user_id = m.sender_id
        WHERE m.conversation_id = ?
        ORDER BY m.sent_at ASC`,
      [conversationId]
    );

    res.json({
      partnerName,
      listingTitle: conv.listing_title,
      roleLabel,
      messages: messages.map((msg) => ({
        messageId: msg.message_id,
        senderId: msg.sender_id,
        senderName: msg.sender_name,
        content: msg.content,
        sentAt: new Date(msg.sent_at).toLocaleString()
      }))
    });
  } catch (error) {
    console.error("Thread error:", error);
    res.status(500).json({ message: "Could not load chat thread." });
  }
});

router.post("/send", async (req, res) => {
  const { conversationId, senderId, content } = req.body;

  if (!conversationId || !senderId || !content) {
    return res.status(400).json({ message: "conversationId, senderId, and content are required." });
  }

  try {
    const [conversations] = await db.query(
      `SELECT conversation_id FROM Conversation WHERE conversation_id = ? AND (? IN (buyer_id, seller_id))`,
      [conversationId, senderId]
    );

    if (conversations.length === 0) {
      return res.status(403).json({ message: "User is not part of this conversation." });
    }

    const [result] = await db.query(
      `INSERT INTO Message (conversation_id, sender_id, content) VALUES (?, ?, ?)`,
      [conversationId, senderId, content]
    );

    res.status(201).json({ message: "Message sent.", messageId: result.insertId });
  } catch (error) {
    console.error("Send error:", error);
    res.status(500).json({ message: "Could not send message." });
  }
});

module.exports = router;
