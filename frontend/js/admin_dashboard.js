(function initializeAdminDashboardPage() {
  "use strict";

  const statListings = document.getElementById("statListings");
  const statRegisteredUsers = document.getElementById("statRegisteredUsers");
  const statPendingReports = document.getElementById("statPendingReports");
  const statOpenMessages = document.getElementById("statOpenMessages");
  const statTotalReports = document.getElementById("statTotalReports");
  // const signOutButton = document.getElementById("signOutButton");

  async function loadListingsAndReports() {


    try {
      const [listings, reportData, userData, messageData] = await Promise.all([
        CampusMarketplace.request("listing"),
        CampusMarketplace.request("report"),
        CampusMarketplace.request("user"),
        CampusMarketplace.request("message").catch(() => ({ messages: [] }))
      ]);

      const reports = reportData.reports || [];
      const pendingReports = reports.filter(
        (r) => r.status === "PENDING" || r.status === "UNDER_REVIEW"
      ).length;

      const users = userData.users || [];
      const registeredUsers = users.length || Number(userData.total || 0);

      const messages = messageData.messages || [];
      const openMessages = messages.filter((m) =>
        m.status === "SENT" || m.status === "DELIVERED"
      ).length;

      statListings.textContent = String(listings.length);
      statRegisteredUsers.textContent = String(registeredUsers);
      statPendingReports.textContent = String(pendingReports);
      statTotalReports.textContent = String(reports.length);

      if (statOpenMessages) {
        statOpenMessages.textContent = String(openMessages);
      }
    } catch (error) {
      console.error("Failed to load dashboard stats:", error);
    }
  }

  // if (signOutButton) {
  //   signOutButton.addEventListener("click", () => {
  //     CampusMarketplace.clearCurrentUser();
  //     window.location.href = "login.html";
  //   });
  // }

  loadListingsAndReports();
})();