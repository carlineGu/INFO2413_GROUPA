function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch (error) {
    return null;
  }
}

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

const root = document.getElementById("listingRoot");
const user = getCurrentUser();
let currentIndex = 0;
let photos = [];

function renderGallery(listing) {
  photos = listing.photos && listing.photos.length > 0 ? listing.photos : [];

  const mainImage = photos.length > 0
    ? `<img id="mainImage" src="${photos[0]}" alt="${escapeHtml(listing.listing_title)}" />`
    : `<div class="listing-gallery-placeholder">No photos for this listing yet</div>`;

  const arrows = photos.length > 1
    ? `
      <button type="button" class="gallery-arrow prev" id="prevPhoto" aria-label="Previous photo">‹</button>
      <button type="button" class="gallery-arrow next" id="nextPhoto" aria-label="Next photo">›</button>
    `
    : "";

  const thumbs = photos.length > 1
    ? `<div class="listing-thumb-strip" id="thumbStrip">
        ${photos.map((url, index) => `
          <img src="${url}" class="listing-thumb ${index === 0 ? "active" : ""}" data-index="${index}" alt="Photo ${index + 1}" />
        `).join("")}
      </div>`
    : "";

  return `
    <div class="listing-gallery">
      <div class="listing-gallery-main">
        ${mainImage}
        ${arrows}
      </div>
      ${thumbs}
    </div>
  `;
}

function setActivePhoto(index) {
  if (photos.length === 0) return;
  currentIndex = (index + photos.length) % photos.length;

  const mainImage = document.getElementById("mainImage");
  if (mainImage) {
    mainImage.src = photos[currentIndex];
  }

  document.querySelectorAll(".listing-thumb").forEach((thumb) => {
    thumb.classList.toggle("active", Number(thumb.dataset.index) === currentIndex);
  });
}

function wireGalleryEvents() {
  const prevButton = document.getElementById("prevPhoto");
  const nextButton = document.getElementById("nextPhoto");

  if (prevButton) prevButton.addEventListener("click", () => setActivePhoto(currentIndex - 1));
  if (nextButton) nextButton.addEventListener("click", () => setActivePhoto(currentIndex + 1));

  document.querySelectorAll(".listing-thumb").forEach((thumb) => {
    thumb.addEventListener("click", () => setActivePhoto(Number(thumb.dataset.index)));
  });
}

async function toggleFavorite(listing, button) {
  if (!user || !user.user_id) {
    window.location.href = "login.html";
    return;
  }

  const isFavorited = button.dataset.favorited === "true";

  try {
    if (isFavorited) {
      await fetch(`/api/favorite/${listing.listing_id}?userId=${user.user_id}`, {
        method: "DELETE"
      });
      button.dataset.favorited = "false";
      button.textContent = "♡";
      button.classList.remove("favorited");
    } else {
      await fetch("/api/favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.user_id, listingId: listing.listing_id })
      });
      button.dataset.favorited = "true";
      button.textContent = "♥";
      button.classList.add("favorited");
    }
  } catch (error) {
    console.error("Could not update favorite:", error);
  }
}

async function startConversation(listing) {
  if (!user || !user.user_id) {
    window.location.href = "login.html";
    return;
  }

  try {
    const response = await fetch("/api/message/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: listing.listing_id, buyerId: user.user_id })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(data.message || "Could not start conversation.");
      return;
    }

    window.location.href = `chat.html?conversationId=${data.conversationId}`;
  } catch (error) {
    console.error("Could not start conversation:", error);
  }
}

function renderSellerCard(listing) {
  const isOwnListing = user && user.user_id === listing.user_id;
  const seller = listing.seller;
  const ratingText = seller.avgRating
    ? `${seller.avgRating} \u2605 (${seller.reviewCount} review${seller.reviewCount === 1 ? "" : "s"})`
    : "No ratings yet";

  return `
    <div class="seller-card">
      <div>
        <a class="seller-name" href="profile.html?id=${seller.user_id}">${escapeHtml(seller.name)}</a>
        <div class="seller-meta">${ratingText}</div>
      </div>
      <div class="seller-actions">
        <a class="btn btn-outline-dark btn-sm" href="profile.html?id=${seller.user_id}">View Profile</a>
        ${isOwnListing
          ? `<span class="btn btn-outline-secondary btn-sm disabled">This is your listing</span>`
          : `<button type="button" class="btn btn-dark btn-sm" id="messageSellerBtn">Message Seller</button>`}
      </div>
    </div>
  `;
}

function renderListing(listing) {
  const isOwnListing = user && user.user_id === listing.user_id;
  const statusBadge = listing.listing_status !== "ACTIVE"
    ? `<span class="badge bg-secondary ms-2">${listing.listing_status}</span>`
    : "";

  root.innerHTML = `
    <div class="row">
      <div class="col-lg-7">
        ${renderGallery(listing)}
      </div>
      <div class="col-lg-5">
        <div class="d-flex justify-content-between align-items-start">
          <h2 class="mb-1">${escapeHtml(listing.listing_title)}${statusBadge}</h2>
          ${!isOwnListing ? `
          <button type="button" id="favoriteBtn" class="listing-favorite-btn" data-favorited="${listing.favorited}" aria-label="Favorite this listing">
            ${listing.favorited ? "♥" : "♡"}
          </button>
          ` : ""}
        </div>
        <p class="fs-4 fw-bold">$${Number(listing.price).toFixed(2)}</p>
        <p class="text-muted mb-1">Condition: ${escapeHtml(listing.listing_condition)}</p>
        <p class="text-muted mb-1">${listing.category_name ? `Category: ${escapeHtml(listing.category_name)}` : ""}</p>
        <p class="text-muted mb-3">${listing.location_name ? `Location: ${escapeHtml(listing.location_name)}` : ""}</p>

        <h5>Description</h5>
        <p style="white-space: pre-wrap;">${escapeHtml(listing.listing_description)}</p>

        ${renderSellerCard(listing)}
      </div>
    </div>
  `;

  if (listing.favorited) {
    root.querySelector("#favoriteBtn")?.classList.add("favorited");
  }

  wireGalleryEvents();

  const favoriteBtn = document.getElementById("favoriteBtn");
  if (favoriteBtn) {
    favoriteBtn.addEventListener("click", () => toggleFavorite(listing, favoriteBtn));
  }

  const messageBtn = document.getElementById("messageSellerBtn");
  if (messageBtn) {
    messageBtn.addEventListener("click", () => startConversation(listing));
  }
}

async function loadListing() {
  const listingId = getQueryParam("id");

  if (!listingId) {
    root.innerHTML = `<p class="text-danger">No listing was specified.</p>`;
    return;
  }

  try {
    const params = new URLSearchParams();
    if (user && user.user_id) params.set("userId", user.user_id);

    const response = await fetch(`/api/listing/${listingId}?${params.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      root.innerHTML = `<p class="text-danger">${escapeHtml(data.message || "Listing could not be loaded.")}</p>`;
      return;
    }

    renderListing(data);
  } catch (error) {
    console.error("Could not load listing:", error);
    root.innerHTML = `<p class="text-danger">Could not connect to the backend server.</p>`;
  }
}

loadListing();
