"use strict";

const marketplace = window.CampusMarketplace;
const currentUser = marketplace.getCurrentUser();
const chatHeader = document.getElementById("chatHeader");
const messagesContainer = document.getElementById("messagesContainer");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const supportFeedback = document.getElementById("supportFeedback");
const submitButton = messageForm.querySelector("button[type='submit']");
const POLL_INTERVAL_MS = 5000;
const conversationId = Number(new URLSearchParams(window.location.search).get("conversationId"));

let isLoading = false;
let lastMessageSignature = null;
let conversationIsOpen = false;

function hasValidConversationId() {
  return Number.isInteger(conversationId) && conversationId > 0;
}

function setFeedback(message, isError = false) {
  supportFeedback.textContent = message;
  supportFeedback.className = `support-feedback${isError ? " is-error" : ""}`;
}

function setComposerEnabled(enabled) {
  messageInput.disabled = !enabled;
  submitButton.disabled = !enabled;
}

function formatTimestamp(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

function renderMessage(message) {
  const isMine = Number(message.senderId) === Number(currentUser.userId);
  const card = document.createElement("article");
  card.className = `chat-message${isMine ? " is-mine" : ""}`;
  card.innerHTML = `
    <strong>${isMine ? "You" : marketplace.escapeHtml(message.senderName || "Marketplace user")}</strong>
    <p>${marketplace.escapeHtml(message.content)}</p>
    <time>${marketplace.escapeHtml(formatTimestamp(message.sentAt))}</time>
  `;
  return card;
}

function renderHeader(thread) {
  const status = String(thread.status || "OPEN").toUpperCase();
  const statusClass = status.toLowerCase().replace(/[^a-z0-9_-]/g, "-");

  chatHeader.innerHTML = `
    <div>
      <h2 id="adminSupportHeading">${marketplace.escapeHtml(thread.userName || "Marketplace user")}</h2>
      <p>${marketplace.escapeHtml(thread.userEmail || "")}</p>
    </div>
    <div class="support-header-actions">
      <span class="support-status support-status-${statusClass}">${marketplace.escapeHtml(status.replace(/_/g, " "))}</span>
      <button type="button" id="supportStatusButton" class="support-status-button">
        ${status === "OPEN" ? "Close conversation" : "Reopen conversation"}
      </button>
      <a href="admin_support_messages.html">&larr; Back to Support Messages</a>
    </div>
  `;

  document.getElementById("supportStatusButton").addEventListener("click", () => {
    updateConversationStatus(status === "OPEN" ? "CLOSED" : "OPEN");
  });
}

function renderMessages(messages, forceScroll = false) {
  const normalizedMessages = Array.isArray(messages) ? messages : [];
  const signature = normalizedMessages
    .map((message) => `${message.messageId}:${message.sentAt}:${message.content}`)
    .join("|");

  if (signature === lastMessageSignature) {
    return;
  }

  const isNearBottom =
    messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight < 80;

  messagesContainer.replaceChildren();

  if (normalizedMessages.length === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "empty-chat-state";
    emptyState.textContent = "This user has not sent a message yet.";
    messagesContainer.appendChild(emptyState);
  } else {
    normalizedMessages.forEach((message) => messagesContainer.appendChild(renderMessage(message)));
  }

  lastMessageSignature = signature;
  if (forceScroll || isNearBottom) {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}

async function markConversationRead(messages) {
  const throughMessageId = Math.max(
    0,
    ...(Array.isArray(messages) ? messages : []).map(
      (message) => Number(message.messageId) || 0
    )
  );

  if (!throughMessageId) {
    return;
  }

  try {
    await marketplace.request(`support/conversations/${conversationId}/read`, {
      method: "PATCH",
      body: { throughMessageId }
    });
  } catch (error) {
    console.warn("Could not mark the support conversation as read.", error);
  }
}

async function loadThread({ forceScroll = false, showLoading = false } = {}) {
  if (isLoading || !hasValidConversationId()) {
    return;
  }

  isLoading = true;
  if (showLoading) {
    setFeedback("Loading support conversation...");
  }

  try {
    const thread = await marketplace.request(
      `support/conversations/${conversationId}`
    );
    conversationIsOpen = String(thread.status || "OPEN").toUpperCase() === "OPEN";
    renderHeader(thread);
    renderMessages(thread.messages, forceScroll);
    setComposerEnabled(conversationIsOpen);
    setFeedback(conversationIsOpen ? "" : "This support conversation is closed.");
    void markConversationRead(thread.messages);
  } catch (error) {
    setComposerEnabled(false);
    setFeedback(error.message || "Could not load this support conversation.", true);
  } finally {
    isLoading = false;
  }
}

async function updateConversationStatus(status) {
  const statusButton = document.getElementById("supportStatusButton");
  if (statusButton) statusButton.disabled = true;
  setFeedback(status === "OPEN" ? "Reopening conversation..." : "Closing conversation...");

  try {
    await marketplace.request(`support/conversations/${conversationId}/status`, {
      method: "PATCH",
      body: { status }
    });
    lastMessageSignature = null;
    await loadThread();
  } catch (error) {
    setFeedback(error.message || "Could not update the conversation status.", true);
    if (statusButton) statusButton.disabled = false;
  }
}

messageForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const content = messageInput.value.trim();

  if (!content || !hasValidConversationId() || !currentUser?.userId) {
    return;
  }

  setComposerEnabled(false);
  setFeedback("Sending...");

  try {
    await marketplace.request(`support/conversations/${conversationId}/messages`, {
      method: "POST",
      body: { content }
    });
    messageInput.value = "";
    lastMessageSignature = null;
    await loadThread({ forceScroll: true });
  } catch (error) {
    setFeedback(error.message || "Could not send your reply.", true);
  } finally {
    setComposerEnabled(conversationIsOpen);
    if (conversationIsOpen) {
      messageInput.focus();
    }
  }
});

if (
  !currentUser?.userId ||
  currentUser.user_role !== "ADMIN" ||
  !marketplace.getAccessToken()
) {
  marketplace.clearCurrentUser();
  window.location.href = "login.html";
} else if (!hasValidConversationId()) {
  chatHeader.textContent = "Invalid support conversation.";
  setFeedback("Return to Support Messages and choose a conversation.", true);
  setComposerEnabled(false);
} else {
  loadThread({ forceScroll: true, showLoading: true });

  window.setInterval(() => {
    if (!document.hidden) {
      loadThread();
    }
  }, POLL_INTERVAL_MS);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      loadThread();
    }
  });
}
