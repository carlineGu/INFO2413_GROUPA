(function initializeAdminSideMenu() {
  "use strict";
  const marketplace = window.CampusMarketplace;
  const user = marketplace.getCurrentUser();
  const menuButton = document.getElementById("adminMenuButton");
  const signOutButton = document.getElementById("signOutButton");

  if (!user || !user.userId || user.user_role !== "ADMIN") {
    console.warn("Unauthorized access to admin side menu. Redirecting to login page.");
    window.location.href = "login.html";
    return;
  }
  if (!menuButton) return;

  const menuItems = [
    { href: "admin_dashboard.html", label: "Dashboard" },
    { href: "user_listing_reports.html", label: "Reports", badgeId: "menuReportsBadge" },
    { href: "admin_marketplace_activity.html", label: "Marketplace Activity" },
    { href: "admin_listings.html", label: "Listings" },
    { href: "admin_users.html", label: "Users" },
    { href: "admin_support_messages.html", label: "Support Messages", badgeId: "menuMessagesBadge" }
  ];

  const currentPage = window.location.pathname.split("/").pop();
  const activeMenuPage = currentPage === "admin_support_chat.html"
    ? "admin_support_messages.html"
    : currentPage;

  const overlay = document.createElement("div");
  overlay.className = "admin-menu-overlay";
  overlay.hidden = true;

  const sideMenu = document.createElement("aside");
  sideMenu.id = "adminSideMenu";
  sideMenu.className = "admin-side-menu";
  sideMenu.setAttribute("aria-hidden", "true");
  sideMenu.setAttribute("aria-label", "Admin navigation");

  sideMenu.innerHTML = `
    <div class="admin-side-menu-heading">
      <strong>Menu</strong>
      <button type="button" class="admin-menu-close" aria-label="Close navigation menu">&times;</button>
    </div>
    ${menuItems
      .map(
        (item) => `
      <a href="${item.href}" class="admin-side-menu-link${item.href === activeMenuPage ? " is-active" : ""}">
        <span>${item.label}</span>
        ${item.badgeId ? `<span class="nav-tile-badge" id="${item.badgeId}" hidden></span>` : ""}
      </a>`
      )
      .join("")}
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(sideMenu);

  function openMenu() {
    overlay.hidden = false;
    requestAnimationFrame(() => {
      sideMenu.classList.add("is-open");
      overlay.classList.add("is-visible");
    });
    sideMenu.setAttribute("aria-hidden", "false");
    menuButton.setAttribute("aria-expanded", "true");
  }

  function closeMenu() {
    sideMenu.classList.remove("is-open");
    overlay.classList.remove("is-visible");
    sideMenu.setAttribute("aria-hidden", "true");
    menuButton.setAttribute("aria-expanded", "false");
    window.setTimeout(() => {
      if (!sideMenu.classList.contains("is-open")) {
        overlay.hidden = true;
      }
    }, 200);
  }

  menuButton.addEventListener("click", () => {
    if (sideMenu.classList.contains("is-open")) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  sideMenu.querySelector(".admin-menu-close").addEventListener("click", closeMenu);
  overlay.addEventListener("click", closeMenu);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  function setBadge(id, count, label) {
    const el = document.getElementById(id);
    if (!el) return;
    if (count > 0) {
      el.textContent = `${count} ${label}`;
      el.hidden = false;
    } else {
      el.hidden = true;
    }
  }

  async function loadReportsBadge() {
    try {
      const { reports } = await CampusMarketplace.request("report");
      const pendingReports = (reports || []).filter(
        (r) => r.status === "PENDING" || r.status === "UNDER_REVIEW"
      ).length;
      setBadge("menuReportsBadge", pendingReports, "pending");
    } catch (error) {
      console.error("Failed to load reports badge count:", error);
    }
  }

  async function loadSupportBadge() {
    try {
      const { unreadCount } = await CampusMarketplace.request("support/unread-count");
      setBadge("menuMessagesBadge", Number(unreadCount) || 0, "unread");
    } catch (error) {
      console.error("Failed to load support unread count:", error);
    }
  }

  if (signOutButton) {
    signOutButton.addEventListener("click", () => {
      CampusMarketplace.clearCurrentUser();
      window.location.href = "login.html";
    });
  }

  loadReportsBadge();
  loadSupportBadge();

  window.setInterval(() => {
    if (!document.hidden) {
      loadSupportBadge();
    }
  }, 5000);
})();
