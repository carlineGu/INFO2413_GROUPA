document.addEventListener("DOMContentLoaded", loadUsers);

const userDetailCache = new Map();
const openUserDetailIds = new Set();
let currentUsers = [];

async function loadUsers() {
  try {
    const users =
      await CampusMarketplace.request("/user/admin");
    currentUsers = Array.isArray(users) ? users : [];
      console.log("Users:", users);
    

    const tbody =
      document.getElementById("users-body");

    tbody.innerHTML = "";

    users.forEach((user) => {
      const userId = String(user.user_id);

      const actionButton =
        user.account_status === "SUSPENDED"
          ? `<button class="remove-btn" onclick="reinstateUser(${user.user_id})">Reinstate</button>`
          : `<button  class="suspend-btn" onclick="suspendUser(${user.user_id})">Suspend</button>`;

      tbody.innerHTML += `
        <tr data-user-id="${userId}">
          <td>
          <button type="button" class="name-toggle" data-toggle-detail="${userId}">
            ${CampusMarketplace.escapeHtml(
              user.first_name + " " + user.last_name
            )}
          </button><br>
          ${CampusMarketplace.escapeHtml(user.email_addr)}
        </td>

          <td>${user.listing_count}</td>

          <td>${CampusMarketplace.escapeHtml(
            user.account_status
          )}</td>

          <td>
            ${actionButton}

            <button
              class="remove-btn"
              onclick="removeUser(${user.user_id})">
              Remove
            </button>
          </td>
        </tr>
        <tr class="detail-row" id="user-detail-row-${userId}" hidden>
          <td colspan="4">
            <div class="detail-panel" id="user-detail-panel-${userId}"></div>
          </td>
        </tr>
      `;
    });

    openUserDetailIds.forEach((userId) => {
      const row = document.getElementById(`user-detail-row-${userId}`);
      const panel = document.getElementById(`user-detail-panel-${userId}`);
      if (row && panel) {
        row.hidden = false;
        renderUserDetail(Number(userId), panel);
      }
    });



  } catch (error) {
    console.error(error);
  }
}

function detailFieldHtml(label, value) {
  return `
    <div class="detail-field">
      <span class="detail-label">${CampusMarketplace.escapeHtml(label)}</span>
      ${CampusMarketplace.escapeHtml(value ?? "–")}
    </div>
  `;
}

function renderUserDetailHtml(user) {
  return `
    <div class="detail-grid">
      ${detailFieldHtml("Full Name", user.fullName)}
      ${detailFieldHtml("Email", user.email)}
      ${detailFieldHtml("Account Status", user.accountStatus)}
      ${detailFieldHtml("Department", user.department)}
      ${detailFieldHtml("Member Since", user.memberSince ? new Date(user.memberSince).toISOString().slice(0, 10) : "–")}
      ${detailFieldHtml("Active Listings", user.listingCount)}
      ${detailFieldHtml("Average Rating", user.reviewCount ? user.averageRating : "No ratings yet")}
      ${detailFieldHtml("Review Count", user.reviewCount)}
    </div>
  `;
}

async function renderUserDetail(userId, panel) {
  if (!panel) {
    return;
  }

  if (userDetailCache.has(userId)) {
    panel.innerHTML = userDetailCache.get(userId);
    return;
  }

  panel.innerHTML = '<p class="detail-loading">Loading details&hellip;</p>';

  try {
    const [userDetail] = await Promise.all([
      CampusMarketplace.request(`/user/${userId}`)
    ]);

    const sourceUser = currentUsers.find((u) => Number(u.user_id) === Number(userId)) || {};
    const merged = {
      fullName: userDetail.fullName || `${sourceUser.first_name || ""} ${sourceUser.last_name || ""}`.trim(),
      email: sourceUser.email_addr || "",
      accountStatus: userDetail.accountStatus,
      department: userDetail.department,
      memberSince: userDetail.memberSince,
      listingCount: userDetail.listingCount,
      averageRating: userDetail.averageRating,
      reviewCount: userDetail.reviewCount
    };

    const html = renderUserDetailHtml(merged);
    userDetailCache.set(userId, html);
    panel.innerHTML = html;
  } catch (error) {
    panel.innerHTML = `<p class="detail-error">${CampusMarketplace.escapeHtml(error.message || "Could not load details.")}</p>`;
  }
}

document.getElementById("users-body")?.addEventListener("click", (event) => {
  const toggleButton = event.target.closest("button[data-toggle-detail]");
  if (!toggleButton) {
    return;
  }

  const userId = toggleButton.getAttribute("data-toggle-detail");
  const row = document.getElementById(`user-detail-row-${userId}`);
  const panel = document.getElementById(`user-detail-panel-${userId}`);
  if (!row || !panel) {
    return;
  }

  if (row.hidden) {
    row.hidden = false;
    openUserDetailIds.add(userId);
    renderUserDetail(Number(userId), panel);
  } else {
    row.hidden = true;
    openUserDetailIds.delete(userId);
  }
});
