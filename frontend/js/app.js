function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch (error) {
    return null;
  }
}

async function testConnection() {
  const messageElement = document.getElementById("connectionMessage");

  try {
    const response = await fetch("/api/test");

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();

    messageElement.textContent = data.message;
  } catch (error) {
    console.error("Connection error:", error);
    messageElement.textContent = "Could not connect to backend.";
  }
}

async function toggleFavorite(event, listingId, button) {
  event.preventDefault();
  event.stopPropagation();

  const user = getCurrentUser();
  if (!user || !user.user_id) {
    window.location.href = "login.html";
    return;
  }

  const isFavorited = button.dataset.favorited === "true";

  try {
    if (isFavorited) {
      await fetch(`/api/favorite/${listingId}?userId=${user.user_id}`, {
        method: "DELETE"
      });
      button.dataset.favorited = "false";
      button.textContent = "♡";
      button.classList.remove("favorited");
    } else {
      await fetch("/api/favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.user_id, listingId })
      });
      button.dataset.favorited = "true";
      button.textContent = "♥";
      button.classList.add("favorited");
    }
  } catch (error) {
    console.error("Could not update favorite:", error);
  }
}

async function loadListings() {
  const container = document.getElementById("listingContainer");
  const user = getCurrentUser();

  try {
    const response = await fetch("/api/listing");

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const listings = await response.json();

    container.innerHTML = "";

    listings.forEach((listing) => {
      const column = document.createElement("div");
      column.className = "col-md-4 mb-4";

      const isOwnListing = user && user.user_id === listing.user_id;

      column.innerHTML = `
        <a href="listing.html?id=${listing.listing_id}" class="text-decoration-none text-reset">
          <div class="card h-100 position-relative">
            ${!isOwnListing ? `
            <button type="button" class="favorite-heart" data-favorited="false" aria-label="Favorite this listing">♡</button>
            ` : ""}
            ${listing.photo ? `
            <img src="${listing.photo}" class="card-img-top" alt="${listing.listing_title}" style="height: 200px; object-fit: cover;" />
            ` : ""}
            <div class="card-body">
              <h5 class="card-title">${listing.listing_title}</h5>

              <p class="card-text">
                ${listing.listing_description}
              </p>

              <p class="fw-bold">
                $${Number(listing.price).toFixed(2)}
              </p>
            </div>
          </div>
        </a>
      `;

      const heartButton = column.querySelector(".favorite-heart");
      if (heartButton) {
        heartButton.addEventListener("click", (event) =>
          toggleFavorite(event, listing.listing_id, heartButton)
        );
      }

      container.appendChild(column);
    });
  } catch (error) {
    console.error("Could not load listings:", error);

    container.innerHTML = `
      <p class="text-danger">
        Listings could not be loaded.
      </p>
    `;
  }
}

testConnection();
loadListings();
