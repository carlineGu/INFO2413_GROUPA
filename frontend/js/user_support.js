"use strict";

const marketplace = window.CampusMarketplace;
const currentUser = marketplace.getCurrentUser();
const chatHeader = document.getElementById("chatHeader");
const messagesContainer = document.getElementById("messagesContainer");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");



function getConversationId() {
  return Number(new URLSearchParams(window.location.search).get("conversationId"));
}

function renderMessage(message) {
  const isMine = Number(message.senderId) === currentUser.userId;
  const card = document.createElement("article");
  card.className = `chat-message ${isMine ? "is-mine" : ""}`;
  card.innerHTML = `
    <strong>${isMine ? "You" : marketplace.escapeHtml(message.senderName)}</strong>
    <p>${marketplace.escapeHtml(message.content)}</p>
    <time>${marketplace.escapeHtml(message.sentAt)}</time>
  `;
  return card;
}

function scrollToBottom() {
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function loadThread() {
  if (!currentUser?.userId) {
    window.location.href = "login.html";
    return;
  }

  const conversationId = getConversationId();
  if (!conversationId) {
    chatHeader.textContent = "Invalid conversation.";
    messageForm.hidden = true;
    return;
  }

  try {
    const result = await marketplace.request(`message/thread/${conversationId}?userId=${currentUser.userId}`);
    await marketplace.request(`message/mark-read/${conversationId}?userId=${currentUser.userId}`);
    chatHeader.innerHTML = `
      <div>
        <h1>${marketplace.escapeHtml(result.partnerName)}</h1>
        <p>${marketplace.escapeHtml(result.roleLabel)}: ${marketplace.escapeHtml(result.listingTitle)}</p>
      </div>
      <a href="message.html">&larr; Back to inbox</a>
    `;
    messagesContainer.innerHTML = "";
    result.messages.forEach((message) => messagesContainer.appendChild(renderMessage(message)));
    scrollToBottom();
  } catch (error) {
    chatHeader.textContent = error.message || "Could not load this conversation.";
    messageForm.hidden = true;
  }
}

messageForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const content = messageInput.value.trim();
  const conversationId = getConversationId();
  if (!content || !conversationId || !currentUser?.userId) return;

  const submitButton = messageForm.querySelector("button[type='submit']");
  submitButton.disabled = true;

  try {
    await marketplace.request("message/send", {
      method: "POST",
      body: { conversationId, senderId: currentUser.userId, content }
    });
    messageInput.value = "";
    await loadThread();
  } catch (error) {
    chatHeader.insertAdjacentHTML("beforeend", `<p class="error-state">${marketplace.escapeHtml(error.message)}</p>`);
  } finally {
    submitButton.disabled = false;
  }
});


loadThread();
