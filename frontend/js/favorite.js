"use strict";

const marketplace = window.CampusMarketplace;

function normalizeFavorite(rawListing) {
  return {
    listingId: Number(rawListing.listingId ?? rawListing.listing_id),
    title: rawListing.title ?? rawListing.listing_title ?? "Untitled listing",
    price: Number(rawListing.price),
    status: rawListing.status ?? rawListing.listing_status ?? "ACTIVE",
    photo: rawListing.photo ?? rawListing.image_url ?? null,
    sellerName: rawListing.sellerName ?? rawListing.seller_name ?? "Unknown seller"
  };
}

async function loadFavorites() {
  const container = document.getElementById("favoriteContainer");
  const user = marketplace.getCurrentUser();
  if (!container) return;

  if (!user?.userId) {
    window.location.href = "login.html";
    return;
  }

  try {
    const result = await marketplace.request(`favorite?userId=${user.userId}`);
    const favorites = Array.isArray(result) ? result.map(normalizeFavorite) : [];
    container.innerHTML = "";

    if (favorites.length === 0) {
      container.innerHTML = `<p class="text-muted">You haven't saved any listings yet.</p>`;
      return;
    }

    favorites.forEach((listing) => {
      // console.log("Listing = ", listing.listingId);
      const column = document.createElement("div");
      const price = Number.isFinite(listing.price) ? listing.price.toFixed(2) : "0.00";
      column.className = "col-md-4 mb-4";
      column.innerHTML = `
        <article class="card h-100 position-relative">
          <button type="button" class="favorite-heart favorited" aria-label="Remove from favorites">&#9829;</button>
          <a href="listing.html?id=${listing.listingId}" class="text-decoration-none text-reset">
            ${listing.photo ? `
              <img src="${marketplace.escapeHtml(listing.photo)}" class="card-img-top" alt="${marketplace.escapeHtml(listing.title)}" style="height:200px;object-fit:cover;">
            ` : `<div class="d-flex align-items-center justify-content-center bg-light text-muted" style="height:200px;">No photo</div>`}
            <div class="card-body">
              <h2 class="card-title h5">${marketplace.escapeHtml(listing.title)}</h2>
              <p class="card-text text-muted small">Seller: ${marketplace.escapeHtml(listing.sellerName)}</p>
              <p class="fw-bold mb-0">$${price}</p>
              ${listing.status === "ACTIVE" ? "" : `<span class="badge bg-secondary">${marketplace.escapeHtml(listing.status)}</span>`}
            </div>
          </a>
        </article>
      `;

      column.querySelector(".favorite-heart").addEventListener("click", async (event) => {
        event.currentTarget.disabled = true;
        try {
          await marketplace.request(`favorite/${listing.listingId}`, {
            method: "DELETE",
            body: { userId: user.userId, listingId: listing.listingId }
          });
          
          column.remove();
          if (!container.querySelector(".col-md-4")) {
            container.innerHTML = `<p class="text-muted">You haven't saved any listings yet.</p>`;
          }
        } catch (error) {
          console.error(error);
          event.currentTarget.disabled = false;
          container.insertAdjacentHTML("afterbegin", `<p class="text-danger">${marketplace.escapeHtml(error.message)}</p>`);
        }
      });

      container.appendChild(column);
    });
  } catch (error) {
    container.innerHTML = `<p class="text-danger">${marketplace.escapeHtml(error.message || "Could not load your saved listings.")}</p>`;
  }
}

loadFavorites();
