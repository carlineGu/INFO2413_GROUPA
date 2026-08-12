document.addEventListener("DOMContentLoaded", loadUsers);

async function loadUsers() {
  try {
    const users =
      await CampusMarketplace.request("/user/admin");
      console.log("Users:", users);
    

    const tbody =
      document.getElementById("users-body");

    tbody.innerHTML = "";

    users.forEach((user) => {

      const actionButton =
        user.account_status === "SUSPENDED"
          ? `<button class="remove-btn" onclick="reinstateUser(${user.user_id})">Reinstate</button>`
          : `<button  class="suspend-btn" onclick="suspendUser(${user.user_id})">Suspend</button>`;

      tbody.innerHTML += `
        <tr>
          <td>
            ${CampusMarketplace.escapeHtml(
              user.first_name + " " + user.last_name
            )}<br>
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
      `;
    });



  } catch (error) {
    console.error(error);
  }
}
