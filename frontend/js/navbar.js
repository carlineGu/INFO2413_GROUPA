(function () {
  "use strict";

  const NOTIFICATION_STORAGE_KEY = "campus-marketplace-unread-notifications";
  const notifications = [];
  const marketplace = window.CampusMarketplace;
  const chatList = document.getElementById("chatList");
  const currentUser = marketplace.getCurrentUser();

  function getStoredNotificationCount() {
    const rawValue = window.localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    const parsed = Number(rawValue);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  }

  function setStoredNotificationCount(value) {
    const normalized = Number(value) || 0;
    window.localStorage.setItem(NOTIFICATION_STORAGE_KEY, String(normalized));
  }

  function initializeNavbar() {
    const navbarContainer = document.getElementById("navbar");

    if (!navbarContainer || navbarContainer.dataset.navbarReady === "true") {
      return;
    }

    navbarContainer.dataset.navbarReady = "true";
    document.body.classList.add("cmp-nav-page");

    navbarContainer.innerHTML = `
      <header class="cmp-header">
        <nav class="cmp-navbar" aria-label="Primary navigation">
          <div class="cmp-brand-left-wrapper">
            <button
              id="cmp-menu-button"
              class="cmp-icon-button cmp-menu-button"
              type="button"
              aria-label="Open navigation menu"
              aria-controls="cmp-side-menu"
              aria-expanded="false"
            >
              <span aria-hidden="true">&#9776;</span>
            </button>

            <div class="cmp-brand-left">
              <img src="../pictures/icon pic.png" alt="KPU Logo" class="cmp-brand-logo" />
              <div class="cmp-brand-left-text">
                <div class="cmp-university-name">Kwantlen</div>
                <div class="cmp-university-name">Polytechnic</div>
                <div class="cmp-university-name">University</div>
              </div>
            </div>
          </div>

          <a class="cmp-brand" href="index.html" data-nav-link>
            <span class="cmp-brand-full">Campus Marketplace</span>
          </a>

          <div class="cmp-navbar-actions">
            <div class="cmp-notification">
              <button
                id="cmp-notification-button"
                class="cmp-icon-button"
                type="button"
                aria-label="Notifications"
                aria-controls="cmp-notification-dropdown"
                aria-expanded="false"
                aria-haspopup="true"
              >
                <img src="../pictures/bell.png" alt="" aria-hidden="true" />
                <span id="cmp-notification-badge" class="cmp-notification-badge" aria-hidden="true"></span>
              </button>

              <section
                id="cmp-notification-dropdown"
                class="cmp-dropdown cmp-notification-dropdown"
                aria-label="Notifications"
                hidden
              >
                <h2 class="cmp-dropdown-heading">Notifications</h2>
                <div id="cmp-notification-list" aria-live="polite"></div>
              </section>
            </div>

            <div class="cmp-profile">
              <button
                id="cmp-profile-button"
                class="cmp-icon-button"
                type="button"
                aria-label="Open account menu"
                aria-controls="cmp-profile-dropdown"
                aria-expanded="false"
                aria-haspopup="true"
              >
                <img src="../pictures/user.png" alt="" aria-hidden="true" />
              </button>

              <div
                id="cmp-profile-dropdown"
                class="cmp-dropdown cmp-profile-dropdown"
                aria-label="Account menu"
                hidden
              >
                <a href="profile.html" data-nav-link>Account</a>
                <a href="message.html" data-nav-link>Messages</a>
                <button id="cmp-logout-button" type="button">Log Out</button>
              </div>
            </div>
          </div>
        </nav>

        <div class="cmp-search-bar-row">
          <form id="cmp-search-form" class="cmp-search-form" role="search" action="index.html" method="get">
            <input
              id="cmp-search-input"
              class="cmp-search-input"
              type="search"
              name="q"
              placeholder="Search listings…"
              aria-label="Search listings"
              autocomplete="off"
            />
            <select id="cmp-search-category" class="cmp-search-select" name="category" aria-label="Category">
              <option value="">All Categories</option>
              <option value="Books & Textbooks">Books & Textbooks</option>
              <option value="Electronics">Electronics</option>
              <option value="Dorm & Furniture">Dorm & Furniture</option>
              <option value="Clothing & Accessories">Clothing & Accessories</option>
              <option value="School Supplies">School Supplies</option>
              <option value="Services">Services</option>
            </select>
            <select id="cmp-search-department" class="cmp-search-select" name="department" aria-label="Department">
              <option value="">All Departments</option>
              <option value="Business">Business</option>
              <option value="Nursing">Nursing</option>
              <option value="Criminology">Criminology</option>
              <option value="Computing Science">Computing Science</option>
              <option value="Arts">Arts</option>
              <option value="Health Sciences">Health Sciences</option>
              <option value="Trades &amp; Technology">Trades &amp; Technology</option>
              <option value="Design">Design</option>
              <option value="Education">Education</option>
            </select>
            <select id="cmp-search-location" class="cmp-search-select" name="location" aria-label="Location">
              <option value="">All Locations</option>
              <option value="Richmond Campus">Richmond Campus</option>
              <option value="Surrey Campus">Surrey Campus</option>
              <option value="Langley Campus">Langley Campus</option>
            </select>
            <select id="cmp-search-price" class="cmp-search-select" name="price" aria-label="Price">
              <option value="">Any Price</option>
              <option value="under-25">Under $25</option>
              <option value="25-50">$25 - $50</option>
              <option value="50-100">$50 - $100</option>
              <option value="100-200">$100 - $200</option>
              <option value="200-plus">$200+</option>
            </select>
            <select id="cmp-search-condition" class="cmp-search-select" name="condition" aria-label="Condition">
              <option value="">Any Condition</option>
              <option value="NEW">New</option>
              <option value="LIKE NEW">Like New</option>
              <option value="GOOD">Good</option>
              <option value="FAIR">Fair</option>
              <option value="USED">Used</option>
            </select>
            <button type="submit" class="cmp-search-button">Search</button>
          </form>
        </div>

        <div id="cmp-menu-overlay" class="cmp-menu-overlay" hidden></div>

        <aside
          id="cmp-side-menu"
          class="cmp-side-menu"
          aria-label="Site menu"
          aria-hidden="true"
          aria-modal="true"
          role="dialog"
        >
          <div class="cmp-side-menu-heading">
            <strong>Menu</strong>
            <button
              id="cmp-close-menu-button"
              class="cmp-close-menu-button"
              type="button"
              aria-label="Close navigation menu"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>

          <a href="index.html" data-nav-link>Home</a>
          <a href="favorite.html" data-nav-link>Favorites</a>
          <a href="message.html" data-nav-link>Messages</a>
          <a href="create_listing.html" data-nav-link>Create Listing</a>
          <a href="profile.html" data-nav-link>Account / Profile</a>
          <a href="user_support.html" data-nav-link id="cmp-user-support-link">Report an Issue</a>
        </aside>
      </header>
    `;

    // Pre-fill search bar from current page URL params
    const _sp = new URLSearchParams(window.location.search);
    const _si = navbarContainer.querySelector("#cmp-search-input");
    const _sc = navbarContainer.querySelector("#cmp-search-category");
    const _sd = navbarContainer.querySelector("#cmp-search-department");
    const _sl = navbarContainer.querySelector("#cmp-search-location");
    const _sp2 = navbarContainer.querySelector("#cmp-search-price");
    const _sn = navbarContainer.querySelector("#cmp-search-condition");
    if (_si) _si.value = _sp.get("q") || "";
    if (_sc) _sc.value = _sp.get("category") || "";
    if (_sd) _sd.value = _sp.get("department") || "";
    if (_sl) _sl.value = _sp.get("location") || "";
    if (_sp2) _sp2.value = _sp.get("price") || "";
    if (_sn) _sn.value = _sp.get("condition") || "";

    const menuButton = navbarContainer.querySelector("#cmp-menu-button");
    const closeMenuButton = navbarContainer.querySelector("#cmp-close-menu-button");
    const sideMenu = navbarContainer.querySelector("#cmp-side-menu");
    const menuOverlay = navbarContainer.querySelector("#cmp-menu-overlay");
    const notificationButton = navbarContainer.querySelector("#cmp-notification-button");
    const notificationDropdown = navbarContainer.querySelector("#cmp-notification-dropdown");
    const notificationList = navbarContainer.querySelector("#cmp-notification-list");
    const notificationBadge = navbarContainer.querySelector("#cmp-notification-badge");
    const notificationContainer = navbarContainer.querySelector(".cmp-notification");
    const profileButton = navbarContainer.querySelector("#cmp-profile-button");
    const profileDropdown = navbarContainer.querySelector("#cmp-profile-dropdown");
    const profileContainer = navbarContainer.querySelector(".cmp-profile");
    const logoutButton = navbarContainer.querySelector("#cmp-logout-button");
    let focusBeforeMenu = null;

    sideMenu.inert = true;

    function setDropdown(button, dropdown, isOpen) {
      button.setAttribute("aria-expanded", String(isOpen));
      dropdown.hidden = !isOpen;
    }

    function closeNotifications(restoreFocus) {
      if (notificationDropdown.hidden) {
        return;
      }

      setDropdown(notificationButton, notificationDropdown, false);

      if (restoreFocus) {
        notificationButton.focus();
      }
    }

    function closeProfileMenu(restoreFocus) {
      if (profileDropdown.hidden) {
        return;
      }

      setDropdown(profileButton, profileDropdown, false);

      if (restoreFocus) {
        profileButton.focus();
      }
    }

    function openMenu() {
      closeNotifications(false);
      closeProfileMenu(false);
      focusBeforeMenu = document.activeElement;
      menuOverlay.hidden = false;
      sideMenu.classList.add("is-open");
      menuOverlay.classList.add("is-visible");
      sideMenu.setAttribute("aria-hidden", "false");
      sideMenu.inert = false;
      menuButton.setAttribute("aria-expanded", "true");
      document.body.classList.add("cmp-nav-menu-open");
      closeMenuButton.focus();
    }

    function closeMenu(restoreFocus) {
      if (!sideMenu.classList.contains("is-open")) {
        return;
      }

      sideMenu.classList.remove("is-open");
      menuOverlay.classList.remove("is-visible");
      menuOverlay.hidden = true;
      sideMenu.setAttribute("aria-hidden", "true");
      sideMenu.inert = true;
      menuButton.setAttribute("aria-expanded", "false");
      document.body.classList.remove("cmp-nav-menu-open");

      if (restoreFocus && focusBeforeMenu && typeof focusBeforeMenu.focus === "function") {
        focusBeforeMenu.focus();
      }
    }

    async function updateNotifications() {
      if (!currentUser) {
        return;
      }

      try {
        const result = await marketplace.request(
          `message/unread-count?userId=${currentUser.userId}`
        );

        const count = Number(result?.unreadCount || 0);
        setStoredNotificationCount(count);
        notifications.length = 0;

        if (count > 0) {
          notifications.push({
            text: `${count} unread message${count === 1 ? "" : "s"}`,
            href: "message.html"
          });
        }
      } catch (error) {
        console.warn("Could not refresh notifications.", error);
      }
    }

    function renderNotifications() {
      const unreadCount = getStoredNotificationCount();
      notificationList.replaceChildren();

      if (unreadCount === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "cmp-notification-empty";
        emptyMessage.textContent = "No new notifications";
        notificationList.appendChild(emptyMessage);
      } else {
        const link = document.createElement("a");
        link.className = "cmp-notification-item";
        link.href = "message.html";
        link.textContent = `${unreadCount} unread message${unreadCount === 1 ? "" : "s"}`;
        notificationList.appendChild(link);
      }

      notificationBadge.textContent = unreadCount > 99 ? "99+" : String(unreadCount);
      notificationBadge.hidden = unreadCount === 0;
      notificationButton.setAttribute(
        "aria-label",
        unreadCount === 0
          ? "Notifications, none unread"
          : `Notifications, ${unreadCount} unread`
      );
    }

    function markCurrentPage() {
      const currentPage = window.location.pathname.split("/").pop() || "index.html";

      navbarContainer.querySelectorAll("[data-nav-link]").forEach((link) => {
        const targetPage = link.getAttribute("href").split("?")[0];

        if (targetPage === currentPage) {
          link.setAttribute("aria-current", "page");
        }
      });
    }

    menuButton.addEventListener("click", openMenu);
    closeMenuButton.addEventListener("click", () => closeMenu(true));
    menuOverlay.addEventListener("click", () => closeMenu(true));

    notificationButton.addEventListener("click", () => {
      const shouldOpen = notificationDropdown.hidden;
      closeProfileMenu(false);
      setDropdown(notificationButton, notificationDropdown, shouldOpen);
    });

    profileButton.addEventListener("click", () => {
      const shouldOpen = profileDropdown.hidden;
      closeNotifications(false);
      setDropdown(profileButton, profileDropdown, shouldOpen);
    });

    navbarContainer.querySelectorAll(".cmp-side-menu a").forEach((link) => {
      link.addEventListener("click", () => closeMenu(false));
    });

    notificationDropdown.addEventListener("click", () => closeNotifications(false));
    profileDropdown.addEventListener("click", (event) => {
      if (event.target instanceof Element && event.target.closest("a")) {
        closeProfileMenu(false);
      }
    });

    document.addEventListener("click", (event) => {
      if (!notificationContainer.contains(event.target)) {
        closeNotifications(false);
      }

      if (!profileContainer.contains(event.target)) {
        closeProfileMenu(false);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        if (sideMenu.classList.contains("is-open")) {
          closeMenu(true);
        } else if (!notificationDropdown.hidden) {
          closeNotifications(true);
        } else if (!profileDropdown.hidden) {
          closeProfileMenu(true);
        }
        return;
      }

      if (event.key !== "Tab" || !sideMenu.classList.contains("is-open")) {
        return;
      }

      const focusableElements = Array.from(
        sideMenu.querySelectorAll('a[href], button:not([disabled])')
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    });

    logoutButton.addEventListener("click", () => {
      marketplace.clearCurrentUser();
      window.location.assign("landing.html");
    });

    renderNotifications();
    markCurrentPage();

    setInterval(() => {
      updateNotifications();
      renderNotifications();
    }, 5000); // refresh every 5 seconds

  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeNavbar, { once: true });
  } else {
    initializeNavbar();
  }




})();

