"use strict";

const marketplace = window.CampusMarketplace;
const chatList = document.getElementById("chatList");
const currentUser = marketplace.getCurrentUser();

function renderChatCard(chat) {
  const wrapper = document.createElement("a");
  wrapper.href = `chat.html?conversationId=${Number(chat.conversationId)}`;
  wrapper.className = "conversation-card";
  wrapper.innerHTML = `
    <div class="conversation-card-heading">
      <div>
        <strong>${marketplace.escapeHtml(chat.partnerName)}</strong>
        <div class="conversation-card-meta">${marketplace.escapeHtml(chat.roleLabel)}: ${marketplace.escapeHtml(chat.listingTitle)}</div>
      </div>
      <time>${marketplace.escapeHtml(chat.lastSentAt || "")}</time>
    </div>
    <p><strong>${marketplace.escapeHtml(chat.lastSenderLabel || "")}</strong>${chat.lastSenderLabel ? " &middot; " : ""}${marketplace.escapeHtml(chat.lastMessage || "No messages yet.")}</p>
  `;
  return wrapper;
}

async function loadChats() {
  if (!currentUser?.userId) {
    window.location.href = "login.html";
    return;
  }

  try {
    const result = await marketplace.request(`message/inbox?userId=${currentUser.userId}`);
    const chats = Array.isArray(result.chats) ? result.chats : [];
    chatList.innerHTML = "";

    if (chats.length === 0) {
      chatList.innerHTML = `<p class="empty-state">No conversations yet.</p>`;
      return;
    }

    chats.forEach((chat) => chatList.appendChild(renderChatCard(chat)));
  } catch (error) {
    chatList.innerHTML = `<p class="error-state">${marketplace.escapeHtml(error.message || "Could not load conversations.")}</p>`;
  }
}

loadChats();
