(function initializeAdminDashboardPage() {
  "use strict";

  const statListings = document.getElementById("statListings");
  const statPendingReports = document.getElementById("statPendingReports");
  const statOpenMessages = document.getElementById("statOpenMessages");
  const statTotalReports = document.getElementById("statTotalReports");
  const signOutButton = document.getElementById("signOutButton");

  async function loadListingsAndReports() {
    try {
      const [listings, reportData] = await Promise.all([
        CampusMarketplace.request("listing"),
        CampusMarketplace.request("report")
      ]);

      const reports = reportData.reports || [];
      const pendingReports = reports.filter(
        (r) => r.status === "PENDING" || r.status === "UNDER_REVIEW"
      ).length;

      statListings.textContent = String(listings.length);
      statPendingReports.textContent = String(pendingReports);
      statTotalReports.textContent = String(reports.length);
    } catch (error) {
      console.error("Failed to load listings/reports stats:", error);
    }
  }

  if (signOutButton) {
    signOutButton.addEventListener("click", () => {
      CampusMarketplace.clearCurrentUser();
      window.location.href = "login.html";
    });
  }

  loadListingsAndReports();
})();