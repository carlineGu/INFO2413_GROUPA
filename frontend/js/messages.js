const chatList = document.getElementById("chatList");
const user = JSON.parse(localStorage.getItem("user") || "null");

function redirectToLogin() {
  window.location.href = "login.html";
}

function renderChatCard(chat) {
  const wrapper = document.createElement("a");
  wrapper.href = `chat.html?conversationId=${chat.conversationId}`;
  wrapper.style.display = "block";
  wrapper.style.padding = "16px";
  wrapper.style.border = "1px solid #222";
  wrapper.style.borderRadius = "8px";
  wrapper.style.marginBottom = "12px";
  wrapper.style.textDecoration = "none";
  wrapper.style.color = "inherit";
  wrapper.style.background = "#fff";

  wrapper.innerHTML = `
    <div style="display: flex; justify-content: space-between; gap: 12px; align-items: flex-start;">
      <div>
        <div style="font-weight: 700;">${chat.partnerName}</div>
        <div style="font-size: 12px; color: #555; margin-top: 4px;">${chat.roleLabel}: ${chat.listingTitle}</div>
      </div>
      <div style="font-size: 11px; color: #777; white-space: nowrap;">${chat.lastSentAt || ""}</div>
    </div>
    <div style="margin-top: 10px; font-size: 13px; color: #333;">
      <span style="font-weight: 600;">${chat.lastSenderLabel}</span> • ${chat.lastMessage || "No messages yet."}
    </div>
  `;

  return wrapper;
}

async function loadChats() {
  if (!user || !user.user_id) {
    redirectToLogin();
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/api/message/inbox?userId=${user.user_id}`);
    const data = await response.json();

    if (!response.ok) {
      chatList.textContent = data.message || "Unable to load conversations.";
      return;
    }

    if (!data.chats || data.chats.length === 0) {
      chatList.innerHTML = "<div style='padding:16px; border:1px solid #222; border-radius:8px; color:#555;'>No conversations yet.</div>";
      return;
    }

    chatList.innerHTML = "";
    data.chats.forEach((chat) => {
      chatList.appendChild(renderChatCard(chat));
    });
  } catch (error) {
    console.error(error);
    chatList.textContent = "Could not connect to the backend server.";
  }
}

loadChats();
