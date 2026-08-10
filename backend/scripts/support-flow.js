"use strict";

const assert = require("node:assert/strict");
const bcrypt = require("bcrypt");
const app = require("../server");
const db = require("../db");
const { signAccessToken } = require("../middleware/auth");

async function request(baseUrl, path, options = {}, expectedStatuses = [200]) {
  const { accessToken, body, ...fetchOptions } = options;
  const response = await fetch(`${baseUrl}${path}`, {
    ...fetchOptions,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await response.json();

  assert.ok(
    expectedStatuses.includes(response.status),
    `${options.method || "GET"} ${path} returned ${response.status}: ${data.message || ""}`
  );

  return data;
}

async function main() {
  let server;
  const testUsers = [];
  const uniqueSuffix = `${Date.now()}-${process.pid}`;
  const testPassword = "SupportTest123!";

  try {
    const [admins] = await db.query(
      `SELECT user_id
         FROM User
        WHERE user_role = 'ADMIN'
          AND account_status = 'ACTIVE'
        ORDER BY user_id
        LIMIT 1`
    );
    assert.ok(admins.length > 0, "An active admin account is required for this test.");
    const adminId = Number(admins[0].user_id);
    const adminToken = signAccessToken(adminId);
    const passwordHash = await bcrypt.hash(testPassword, 4);

    for (const label of ["owner", "other"]) {
      const email = `codex-support-test-${label}-${uniqueSuffix}@example.invalid`;
      const [result] = await db.query(
        `INSERT INTO User
           (first_name, last_name, user_role, email_addr, password_hash, account_status)
         VALUES (?, ?, 'USER', ?, ?, 'ACTIVE')`,
        ["Support", label === "owner" ? "Owner" : "Other", email, passwordHash]
      );
      testUsers.push({ userId: Number(result.insertId), email });
    }

    const ownerId = testUsers[0].userId;
    const otherUserId = testUsers[1].userId;
    const otherUserToken = signAccessToken(otherUserId);

    server = app.listen(0, "127.0.0.1");
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });

    const baseUrl = `http://127.0.0.1:${server.address().port}`;
    const loginResult = await request(
      baseUrl,
      "/api/auth/login",
      {
        method: "POST",
        body: { email: testUsers[0].email, password: testPassword }
      }
    );
    assert.equal(Number(loginResult.user.userId), ownerId);
    assert.ok(loginResult.accessToken, "Login did not return an access token.");
    const ownerToken = loginResult.accessToken;

    const started = await request(
      baseUrl,
      "/api/support/conversations",
      { method: "POST", accessToken: ownerToken },
      [200, 201]
    );
    const conversationId = Number(started.conversationId);
    assert.ok(conversationId > 0);

    const unauthenticatedResponse = await fetch(
      `${baseUrl}/api/support/conversations/${conversationId}`
    );
    assert.equal(unauthenticatedResponse.status, 401);

    const restarted = await request(
      baseUrl,
      "/api/support/conversations",
      { method: "POST", accessToken: ownerToken },
      [200, 201]
    );
    assert.equal(Number(restarted.conversationId), conversationId);

    const oversizedResponse = await fetch(
      `${baseUrl}/api/support/conversations/${conversationId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ownerToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ content: "x".repeat(2001) })
      }
    );
    assert.equal(oversizedResponse.status, 400);

    const userMessage = await request(
      baseUrl,
      `/api/support/conversations/${conversationId}/messages`,
      { method: "POST", accessToken: ownerToken, body: { content: "I need help." } },
      [201]
    );

    const forbiddenResponse = await fetch(
      `${baseUrl}/api/support/conversations/${conversationId}`,
      { headers: { Authorization: `Bearer ${otherUserToken}` } }
    );
    assert.equal(forbiddenResponse.status, 403);

    const userInboxResponse = await fetch(`${baseUrl}/api/support/conversations`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    assert.equal(userInboxResponse.status, 403);

    const adminInbox = await request(
      baseUrl,
      "/api/support/conversations",
      { accessToken: adminToken }
    );
    const inboxConversation = adminInbox.conversations.find(
      (conversation) => Number(conversation.conversationId) === conversationId
    );
    assert.ok(inboxConversation, "The new conversation was missing from the admin inbox.");
    assert.equal(inboxConversation.lastMessage, "I need help.");
    assert.equal(Number(inboxConversation.unreadCount), 1);

    await request(
      baseUrl,
      `/api/support/conversations/${conversationId}/read`,
      {
        method: "PATCH",
        accessToken: adminToken,
        body: { throughMessageId: userMessage.messageId }
      }
    );

    const adminMessage = await request(
      baseUrl,
      `/api/support/conversations/${conversationId}/messages`,
      { method: "POST", accessToken: adminToken, body: { content: "How can I help?" } },
      [201]
    );

    const userThread = await request(
      baseUrl,
      `/api/support/conversations/${conversationId}`,
      { accessToken: ownerToken }
    );
    assert.deepEqual(
      userThread.messages.map((message) => message.content),
      ["I need help.", "How can I help?"]
    );

    const unreadBeforeRead = await request(
      baseUrl,
      "/api/support/unread-count",
      { accessToken: ownerToken }
    );
    assert.equal(Number(unreadBeforeRead.unreadCount), 1);

    await request(
      baseUrl,
      `/api/support/conversations/${conversationId}/read`,
      {
        method: "PATCH",
        accessToken: ownerToken,
        body: { throughMessageId: adminMessage.messageId }
      }
    );

    const unreadAfterRead = await request(
      baseUrl,
      "/api/support/unread-count",
      { accessToken: ownerToken }
    );
    assert.equal(Number(unreadAfterRead.unreadCount), 0);

    const closed = await request(
      baseUrl,
      `/api/support/conversations/${conversationId}/status`,
      { method: "PATCH", accessToken: adminToken, body: { status: "CLOSED" } }
    );
    assert.equal(closed.status, "CLOSED");

    const sendWhileClosed = await fetch(
      `${baseUrl}/api/support/conversations/${conversationId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ownerToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ content: "Should not be sent." })
      }
    );
    assert.equal(sendWhileClosed.status, 409);

    const reopened = await request(
      baseUrl,
      "/api/support/conversations",
      { method: "POST", accessToken: ownerToken },
      [200, 201]
    );
    assert.equal(reopened.status, "OPEN");

    console.log("Validated the user-to-admin-to-user support flow.");
  } finally {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }

    for (const user of testUsers) {
      await db.query(`DELETE FROM Support_conversation WHERE user_id = ?`, [user.userId]);
      await db.query(`DELETE FROM User WHERE user_id = ? AND email_addr = ?`, [
        user.userId,
        user.email
      ]);
    }

    await db.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
