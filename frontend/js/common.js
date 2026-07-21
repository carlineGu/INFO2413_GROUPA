const navbarContainer = document.getElementById("navbar");

if (navbarContainer) {
  navbarContainer.innerHTML = `
    <nav class="main-navbar">
      <button id="menuButton" class="nav-icon-button" aria-label="Open menu">
        ☰
      </button>

      <a class="navbar-brand" href="../html/index.html">
        Campus Marketplace
      </a>

      <div class="navbar-actions">
        <div class="notification-wrapper">
          <button
            id="notificationButton"
            class="nav-icon-button"
            aria-label="Notifications"
          >
            🔔
            <span id="notificationCount" class="notification-count">0</span>
          </button>

          <div id="notificationDropdown" class="dropdown notification-dropdown">
            <div class="dropdown-heading">Notifications</div>
            <div id="notificationList"></div>
          </div>
        </div>

        <div class="profile-wrapper">
          <button class="nav-icon-button profile-button" aria-label="Profile">
            👤
          </button>

          <div class="dropdown profile-dropdown">
            <a href="profile.html">Account</a>
            <a href="message.html">Messages</a>
            <button id="logoutButton" type="button">Log Out</button>
          </div>
        </div>
      </div>
    </nav>

    <div id="pageOverlay" class="page-overlay"></div>

    <aside id="sideMenu" class="side-menu">
      <div class="side-menu-heading">
        <strong>Menu</strong>
        <button id="closeMenuButton" type="button" aria-label="Close menu">
          ×
        </button>
      </div>

      <a href="index.html">Home</a>
      <a href="index.html">Browse Listings</a>
      <a href="listing.html">My Listings</a>
      <a href="favorite.html">Favorites</a>
      <a href="message.html">Messages</a>
      <a href="create_listing.html">Create Listing</a>
      <a href="profile.html">Account / Profile</a>
      <a href="settings.html">Settings</a>
      <a href="support.html">Help & Support</a>
    </aside>
  `;

  initializeNavbar();
}

function initializeNavbar() {
  const menuButton = document.getElementById("menuButton");
  const closeMenuButton = document.getElementById("closeMenuButton");
  const sideMenu = document.getElementById("sideMenu");
  const pageOverlay = document.getElementById("pageOverlay");

  const notificationButton = document.getElementById("notificationButton");
  const notificationDropdown = document.getElementById(
    "notificationDropdown"
  );

  const logoutButton = document.getElementById("logoutButton");

  function openMenu() {
    sideMenu.classList.add("open");
    pageOverlay.classList.add("show");
  }

  function closeMenu() {
    sideMenu.classList.remove("open");
    pageOverlay.classList.remove("show");
  }

  menuButton.addEventListener("click", openMenu);
  closeMenuButton.addEventListener("click", closeMenu);
  pageOverlay.addEventListener("click", closeMenu);

  notificationButton.addEventListener("click", (event) => {
    event.stopPropagation();
    notificationDropdown.classList.toggle("show");
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".notification-wrapper")) {
      notificationDropdown.classList.remove("show");
    }
  });

  logoutButton.addEventListener("click", () => {
    localStorage.removeItem("user");
    window.location.href = "/html/landing.html";
  });

  loadNotifications();
}