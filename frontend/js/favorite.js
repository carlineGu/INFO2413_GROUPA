function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch (error) {
    return null;
  }
}

async function removeFavorite(listingId, user) {
  await fetch(`/api/favorite/${listingId}?userId=${user.user_id}`, {
    method: "DELETE"
  });
}

async function loadFavorites() {
  const container = document.getElementById("favoriteContainer");
  const user = getCurrentUser();

  if (!user || !user.user_id) {
    window.location.href = "login.html";
    return;
  }

  try {
    const response = await fetch(`/api/favorite?userId=${user.user_id}`);

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const favorites = await response.json();

    container.innerHTML = "";

    if (favorites.length === 0) {
      container.innerHTML = `<p class="text-muted">You haven't saved any listings yet.</p>`;
      return;
    }

    favorites.forEach((listing) => {
      const column = document.createElement("div");
      column.className = "col-md-4 mb-4";

      column.innerHTML = `
        <div class="card h-100 position-relative">
          <button type="button" class="favorite-heart favorited" aria-label="Remove from favorites">♥</button>
          <a href="listing.html?id=${listing.listing_id}" class="text-decoration-none text-reset">
            ${listing.photo ? `
            <img src="${listing.photo}" class="card-img-top" alt="${listing.listing_title}" style="height: 200px; object-fit: cover;" />
            ` : ""}
            <div class="card-body">
              <h5 class="card-title">${listing.listing_title}</h5>
              <p class="card-text text-muted" style="font-size: 13px;">Seller: ${listing.seller_name}</p>
              <p class="fw-bold">$${Number(listing.price).toFixed(2)}</p>
              ${listing.listing_status !== "ACTIVE" ? `<span class="badge bg-secondary">${listing.listing_status}</span>` : ""}
            </div>
          </a>
        </div>
      `;

      const removeButton = column.querySelector(".favorite-heart");
      removeButton.addEventListener("click", async (event) => {
        event.preventDefault();
        await removeFavorite(listing.listing_id, user);
        column.remove();
        if (!container.querySelector(".col-md-4")) {
          container.innerHTML = `<p class="text-muted">You haven't saved any listings yet.</p>`;
        }
      });

      container.appendChild(column);
    });
  } catch (error) {
    console.error("Could not load favorites:", error);
    container.innerHTML = `<p class="text-danger">Could not load your saved listings.</p>`;
  }
}

loadFavorites();
