"use strict";

const marketplace = window.CampusMarketplace;

function normalizeListingSummary(rawListing) {
  return {
    listingId: Number(rawListing.listingId ?? rawListing.listing_id),
    userId: Number(rawListing.userId ?? rawListing.user_id),
    title: rawListing.title ?? rawListing.listing_title ?? "Untitled listing",
    description: rawListing.description ?? rawListing.listing_description ?? "",
    price: Number(rawListing.price),
    status: rawListing.status ?? rawListing.listing_status ?? "ACTIVE",
    photo: rawListing.photo ?? rawListing.image_url ?? null,
    isFavorited: Boolean(rawListing.isFavorited ?? rawListing.favorited)
  };
}

function setConnectionMessage(message, isError = false) {
  const element = document.getElementById("connectionMessage");
  if (!element) return;
  element.textContent = message;
  element.classList.toggle("text-danger", isError);
}

async function testConnection() {
  try {
    const result = await marketplace.request("test");
    setConnectionMessage(result.message || "Connected to the backend.");
  } catch (error) {
    setConnectionMessage("Could not connect to the backend.", true);
  }
}

async function toggleFavorite(listingId, button) {
  const user = marketplace.getCurrentUser();
  if (!user?.userId) {
    window.location.href = "login.html";
    return;
  }

  const isFavorited = button.getAttribute("aria-pressed") === "true";
  button.disabled = true;

  try {
    if (isFavorited) {
      await marketplace.request(`favorite/${listingId}?userId=${user.userId}`, { method: "DELETE" });
    } else {
      await marketplace.request("favorite", {
        method: "POST",
        body: { userId: user.userId, listingId }
      });
    }

    const nextState = !isFavorited;
    button.setAttribute("aria-pressed", String(nextState));
    button.setAttribute("aria-label", nextState ? "Remove from favorites" : "Add to favorites");
    button.classList.toggle("favorited", nextState);
    button.innerHTML = nextState ? "&#9829;" : "&#9825;";
  } catch (error) {
    setConnectionMessage(error.message || "Could not update favorites.", true);
  } finally {
    button.disabled = false;
  }
}

function renderListingCard(listing, currentUser) {
  const column = document.createElement("div");
  column.className = "col-md-4 mb-4";
  const isOwnListing = currentUser?.userId === listing.userId;
  const price = Number.isFinite(listing.price) ? listing.price.toFixed(2) : "0.00";

  column.innerHTML = `
    <article class="card h-100 position-relative">
      ${isOwnListing ? "" : `
        <button
          type="button"
          class="favorite-heart ${listing.isFavorited ? "favorited" : ""}"
          aria-label="${listing.isFavorited ? "Remove from favorites" : "Add to favorites"}"
          aria-pressed="${listing.isFavorited}"
        >${listing.isFavorited ? "&#9829;" : "&#9825;"}</button>
      `}
      <a href="listing.html?id=${listing.listingId}" class="text-decoration-none text-reset">
        ${listing.photo ? `
          <img src="${marketplace.escapeHtml(listing.photo)}" class="card-img-top" alt="${marketplace.escapeHtml(listing.title)}" style="height:200px;object-fit:cover;">
        ` : `<div class="d-flex align-items-center justify-content-center bg-light text-muted" style="height:200px;">No photo</div>`}
        <div class="card-body">
          <h2 class="card-title h5">${marketplace.escapeHtml(listing.title)}</h2>
          <p class="card-text">${marketplace.escapeHtml(listing.description)}</p>
          <p class="fw-bold mb-0">$${price}</p>
        </div>
      </a>
    </article>
  `;

  column.querySelector(".favorite-heart")?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleFavorite(listing.listingId, event.currentTarget);
  });

  return column;
}

async function loadListings() {
  const container = document.getElementById("listingContainer");
  if (!container) return;

  const currentUser = marketplace.getCurrentUser();
  const query = currentUser?.userId ? `?viewerId=${currentUser.userId}` : "";

  try {
    const result = await marketplace.request(`listing${query}`);
    const listings = Array.isArray(result) ? result.map(normalizeListingSummary) : [];
    container.innerHTML = "";

    if (listings.length === 0) {
      container.innerHTML = `<p class="text-muted">No active listings are available yet.</p>`;
      return;
    }

    listings.forEach((listing) => container.appendChild(renderListingCard(listing, currentUser)));
  } catch (error) {
    container.innerHTML = `<p class="text-danger">${marketplace.escapeHtml(error.message || "Listings could not be loaded.")}</p>`;
  }
}

testConnection();
loadListings();
