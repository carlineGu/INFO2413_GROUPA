const user = JSON.parse(localStorage.getItem("user") || "null");
const chatHeader = document.getElementById("chatHeader");
const messagesContainer = document.getElementById("messagesContainer");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function redirectToLogin() {
  window.location.href = "login.html";
}

function renderMessage(message) {
  const isMine = message.senderId === user.user_id;
  const card = document.createElement("div");
  card.style.padding = "12px";
  card.style.border = "1px solid #222";
  card.style.maxWidth = "70%";
  card.style.background = isMine ? "#000" : "#f8f8f8";
  card.style.color = isMine ? "#fff" : "#111";
  card.style.alignSelf = isMine ? "flex-end" : "flex-start";
  card.style.borderRadius = "8px";
  card.style.display = "flex";
  card.style.flexDirection = "column";
  card.innerHTML = `
    <div style="font-size: 12px; margin-bottom: 6px; color: ${isMine ? "#ccc" : "#555"};">${isMine ? "You" : message.senderName}</div>
    <div>${message.content}</div>
    <div style="font-size: 11px; color: ${isMine ? "#ccc" : "#777"}; margin-top: 8px;">${message.sentAt}</div>
  `;
  return card;
}

function scrollToBottom() {
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function loadThread() {
  if (!user || !user.user_id) {
    redirectToLogin();
    return;
  }

  const conversationId = getQueryParam("conversationId");
  if (!conversationId) {
    chatHeader.textContent = "Invalid conversation.";
    messageForm.style.display = "none";
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/api/message/thread/${conversationId}?userId=${user.user_id}`);
    const data = await response.json();

    if (!response.ok) {
      chatHeader.textContent = data.message || "Could not load chat.";
      messageForm.style.display = "none";
      return;
    }

    const { partnerName, listingTitle, roleLabel, messages } = data;
    chatHeader.innerHTML = `
      <div style="display:flex; justify-content:space-between; gap:10px; align-items:center;">
        <div>
          <div style="font-size: 18px; font-weight: 700;">${partnerName}</div>
          <div style="font-size: 13px; color: #555;">${roleLabel}: ${listingTitle}</div>
        </div>
        <a href="message.html" style="font-size:12px; color:#000; text-decoration:underline;">← Back to inbox</a>
      </div>
    `;

    messagesContainer.innerHTML = "";
    messages.forEach((message) => {
      messagesContainer.appendChild(renderMessage(message));
    });
    scrollToBottom();
  } catch (error) {
    console.error(error);
    chatHeader.textContent = "Could not connect to the backend server.";
    messageForm.style.display = "none";
  }
}

messageForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const content = messageInput.value.trim();
  const conversationId = getQueryParam("conversationId");

  if (!content || !conversationId || !user || !user.user_id) {
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/api/message/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId,
        senderId: user.user_id,
        content
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error(data.message || "Send failed.");
      return;
    }

    messageInput.value = "";
    await loadThread();
  } catch (error) {
    console.error(error);
  }
});

loadThread();
