const navbarContainer = document.getElementById("navbar");

if (navbarContainer) {
  navbarContainer.innerHTML = `
    <header class="header">
        <div class="top-bar">
            <div class="full-menu-container">
                <button class="full-menu-btn" onclick="toggleMenu()">☰</button>

                <div id="full-menu-Dropdown" class="full-menu-dropdown">

                    <div class="full-menu-header">
                        <span><strong>Menu</strong></span>
                        <button class="close-btn" onclick="closeMenu()">✕</button>
                    </div>

                    <a href="/html/home.html">Home</a>
                    <a href="/html/index.html">Browse Listings</a>
                    <a href="my_listings.html">My Listings</a>
                    <a href="/html/profile.html">Favorites</a>
                    <a href="messages.html">Messages</a>
                    <a href="/html/create_listing.html">Create Listing</a>
                    <a href="profile.html"> Account / Profile</a>
                    <a href="settings.html">Settings</a>
                    <a href="help_support.html">Help & Support</a>
                </div>
            </div>


            <a href="index.html" class="marketplace-btn"> Campus Marketplace </a>

           
            <div class="right-icons">
                 <!-- Notification Bell -->
                <div class="notification-btn">
                        <img src="../pictures/bell.png" alt="Bell" class="bell-img">

                        <div class="notification-dropdown" id="notification-dropdown">
                        </div>
                        <span id="badge"></span>
                </div>
                 
                 <!-- Profile Dropdown Menu -->
                 <div class="profile-menu-btn">
                    <img src="../pictures/user.png" alt="User" class="user-img">

                    <div class="user-dropdown">
                        <a href="profile.html">Account</a>
                        <a href="messages.html">Messages</a>
                        <a href="logout.html">Logout</a>
                    </div>
                 </div>
            </div>
            
        </div> 

    </header>
        `;

}


function toggleMenu() {
    document.getElementById("full-menu-Dropdown")
        .classList.toggle("show");

    document.getElementById("menu-overlay")
        .classList.toggle("show");
}

function closeMenu() {
    document.getElementById("full-menu-Dropdown")
        .classList.remove("show");

    document.getElementById("menu-overlay")
        .classList.remove("show");
}

document.getElementById("menu-overlay")
    .addEventListener("click", closeMenu);



const notifications = [
    {
        text: "New message from John",
        link: "messages.html"
    },
    {
        text: "Someone favorited your listing",
        link: "favorites.html"
    },
    {
        text: "You received an offer",
        link: "offers.html"
    }
];



function renderNotifications() {

    const dropdown =
        document.getElementById("notification-dropdown");

    const badge =
        document.getElementById("badge");

    dropdown.innerHTML = `
          <div class="notification-header">
             Notifications
          </div>
    `;

    notifications.forEach(notification => {

        dropdown.innerHTML += `
          <a href="${notification.link}">
            ${notification.text}
          </a>
        `;
    });

    badge.textContent = notifications.length;

    if (notifications.length === 0) {
        badge.style.display = "none";
    } else {
        badge.style.display = "flex";
    }
}

renderNotifications();