(function () {
  "use strict";

  const notifications = [
    { text: "New message from John", href: "message.html" },
    { text: "Someone favorited your listing", href: "favorite.html" },
  ];

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

          <a class="cmp-brand" href="index.html" data-nav-link>
            <span class="cmp-brand-full">Campus Marketplace</span>
            <span class="cmp-brand-short">Marketplace</span>
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
        </aside>
      </header>
    `;

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

    function renderNotifications() {
      notificationList.replaceChildren();

      if (notifications.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "cmp-notification-empty";
        emptyMessage.textContent = "No new notifications";
        notificationList.appendChild(emptyMessage);
      } else {
        notifications.forEach((notification) => {
          const link = document.createElement("a");
          link.className = "cmp-notification-item";
          link.href = notification.href;
          link.textContent = notification.text;
          notificationList.appendChild(link);
        });
      }

      notificationBadge.textContent = String(notifications.length);
      notificationBadge.hidden = notifications.length === 0;
      notificationButton.setAttribute(
        "aria-label",
        notifications.length === 0
          ? "Notifications, none unread"
          : `Notifications, ${notifications.length} unread`
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
      localStorage.removeItem("user");
      sessionStorage.removeItem("user");
      window.location.assign("landing.html");
    });

    renderNotifications();
    markCurrentPage();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeNavbar, { once: true });
  } else {
    initializeNavbar();
  }
})();
