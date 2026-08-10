"use strict";

const marketplace = window.CampusMarketplace;
const chatList = document.getElementById("chatList");
const currentUser = marketplace.getCurrentUser();
const POLL_INTERVAL_MS = 5000;
let isLoading = false;

function formatTimestamp(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

function renderConversationCard(conversation) {
  const conversationId = Number(conversation.conversationId);
  const wrapper = document.createElement("a");
  const unreadCount = Math.max(0, Number(conversation.unreadCount) || 0);
  const status = String(conversation.status || "OPEN").toUpperCase();
  const statusClass = status.toLowerCase().replace(/[^a-z0-9_-]/g, "-");

  wrapper.href = `admin_support_chat.html?conversationId=${conversationId}`;
  wrapper.className = `conversation-card support-conversation-card${unreadCount > 0 ? " has-unread" : ""}`;
  wrapper.innerHTML = `
    <div class="conversation-card-heading">
      <div>
        <strong>${marketplace.escapeHtml(conversation.userName || "Marketplace user")}</strong>
        <div class="conversation-card-meta">${marketplace.escapeHtml(conversation.userEmail || "")}</div>
      </div>
      <div class="support-card-status">
        ${unreadCount > 0 ? `<span class="support-unread-badge">${unreadCount} unread</span>` : ""}
        <span class="support-status support-status-${statusClass}">${marketplace.escapeHtml(status.replace(/_/g, " "))}</span>
        <time>${marketplace.escapeHtml(formatTimestamp(conversation.lastSentAt))}</time>
      </div>
    </div>
    <p><strong>${marketplace.escapeHtml(conversation.lastSenderLabel || "")}</strong>${conversation.lastSenderLabel ? " &middot; " : ""}${marketplace.escapeHtml(conversation.lastMessage || "No messages yet.")}</p>
  `;
  return wrapper;
}

async function loadConversations() {
  if (isLoading) {
    return;
  }

  if (
    !currentUser?.userId ||
    currentUser.user_role !== "ADMIN" ||
    !marketplace.getAccessToken()
  ) {
    marketplace.clearCurrentUser();
    window.location.href = "login.html";
    return;
  }

  isLoading = true;

  try {
    const result = await marketplace.request("support/conversations");
    const conversations = Array.isArray(result.conversations) ? result.conversations : [];
    const validConversations = conversations.filter(
      (conversation) =>
        Number.isInteger(Number(conversation.conversationId)) &&
        Number(conversation.conversationId) > 0
    );
    chatList.replaceChildren();

    if (validConversations.length === 0) {
      chatList.innerHTML = `<p class="empty-state">No support conversations yet.</p>`;
      return;
    }

    validConversations.forEach((conversation) =>
      chatList.appendChild(renderConversationCard(conversation))
    );
  } catch (error) {
    chatList.innerHTML = `<p class="error-state">${marketplace.escapeHtml(error.message || "Could not load support conversations.")}</p>`;
  } finally {
    isLoading = false;
  }
}

chatList.innerHTML = `<p class="loading-state">Loading support conversations...</p>`;
loadConversations();

window.setInterval(() => {
  if (!document.hidden) {
    loadConversations();
  }
}, POLL_INTERVAL_MS);

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    loadConversations();
  }
});
