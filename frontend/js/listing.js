"use strict";

const marketplace = window.CampusMarketplace;
const listingRoot = document.getElementById("listing-root");
const currentUser = marketplace.getCurrentUser();

let activePhotoIndex = 0;
let listingPhotos = [];

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function normalizeListing(rawListing) {
  const rawSeller = rawListing.seller || {};
  const primaryPhoto = rawListing.photo || rawListing.image_url || null;
  const photos = Array.isArray(rawListing.photos)
    ? rawListing.photos.filter(Boolean)
    : primaryPhoto
      ? [primaryPhoto]
      : [];

  return {
    listingId: Number(rawListing.listingId ?? rawListing.listing_id),
    userId: Number(rawListing.userId ?? rawListing.user_id),
    title: rawListing.title ?? rawListing.listing_title ?? "Untitled listing",
    description: rawListing.description ?? rawListing.listing_description ?? "",
    price: Number(rawListing.price),
    condition: rawListing.condition ?? rawListing.listing_condition ?? "",
    status: rawListing.status ?? rawListing.listing_status ?? "ACTIVE",
    categoryName: rawListing.categoryName ?? rawListing.category_name ?? "",
    departmentName: rawListing.departmentName ?? rawListing.department_name ?? "",
    locationName: rawListing.locationName ?? rawListing.location_name ?? "",
    photos,
    isFavorited: Boolean(rawListing.isFavorited ?? rawListing.favorited),
    seller: {
      userId: Number(rawSeller.userId ?? rawSeller.user_id ?? rawListing.userId ?? rawListing.user_id),
      fullName: rawSeller.fullName ?? rawSeller.name ?? rawListing.seller_name ?? "Unknown seller",
      averageRating: Number(rawSeller.averageRating ?? rawSeller.avgRating ?? 0),
      reviewCount: Number(rawSeller.reviewCount ?? 0)
    }
  };
}

function renderGallery(listing) {
  listingPhotos = listing.photos;
  activePhotoIndex = 0;

  if (listingPhotos.length === 0) {
    return `
      <section class="listing-gallery" aria-label="Listing photos">
        <div class="listing-gallery-placeholder">No photos for this listing yet.</div>
      </section>
    `;
  }

  const escapedTitle = marketplace.escapeHtml(listing.title);
  const thumbnails = listingPhotos.length > 1
    ? `
      <div class="listing-thumbnail-strip" aria-label="Choose a listing photo">
        ${listingPhotos.map((photo, index) => `
          <button
            type="button"
            class="listing-thumbnail ${index === 0 ? "is-active" : ""}"
            data-photo-index="${index}"
            aria-label="Show photo ${index + 1}"
            aria-pressed="${index === 0}"
          >
            <img src="${marketplace.escapeHtml(photo)}" alt="${escapedTitle}, photo ${index + 1}">
          </button>
        `).join("")}
      </div>
    `
    : "";

  return `
    <section class="listing-gallery" aria-label="Listing photos">
      <div class="listing-gallery-main">
        <img id="listing-main-photo" src="${marketplace.escapeHtml(listingPhotos[0])}" alt="${escapedTitle}">
        ${listingPhotos.length > 1 ? `
          <button type="button" class="listing-gallery-arrow is-previous" id="previous-photo" aria-label="Previous photo">&lsaquo;</button>
          <button type="button" class="listing-gallery-arrow is-next" id="next-photo" aria-label="Next photo">&rsaquo;</button>
        ` : ""}
      </div>
      ${thumbnails}
    </section>
  `;
}

function setActivePhoto(index) {
  if (listingPhotos.length === 0) return;

  activePhotoIndex = (index + listingPhotos.length) % listingPhotos.length;
  const mainPhoto = document.getElementById("listing-main-photo");
  if (mainPhoto) {
    mainPhoto.src = listingPhotos[activePhotoIndex];
  }

  document.querySelectorAll("[data-photo-index]").forEach((button) => {
    const isActive = Number(button.dataset.photoIndex) === activePhotoIndex;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function wireGalleryEvents() {
  document.getElementById("previous-photo")?.addEventListener("click", () => {
    setActivePhoto(activePhotoIndex - 1);
  });
  document.getElementById("next-photo")?.addEventListener("click", () => {
    setActivePhoto(activePhotoIndex + 1);
  });
  document.querySelectorAll("[data-photo-index]").forEach((button) => {
    button.addEventListener("click", () => setActivePhoto(Number(button.dataset.photoIndex)));
  });
}

function renderSellerCard(listing) {
  const seller = listing.seller;
  const isOwnListing = currentUser?.userId === listing.userId;
  const rating = seller.reviewCount > 0
    ? `${seller.averageRating.toFixed(1)} star rating (${seller.reviewCount} review${seller.reviewCount === 1 ? "" : "s"})`
    : "No ratings yet";

  return `
    <section class="listing-seller-card" aria-labelledby="seller-heading">
      <div>
        <p class="listing-section-label" id="seller-heading">Seller</p>
        <a class="listing-seller-name" href="profile.html?id=${seller.userId}">
          ${marketplace.escapeHtml(seller.fullName)}
        </a>
        <p class="listing-seller-meta">${marketplace.escapeHtml(listing.departmentName || "Department not provided")}</p>
        <p class="listing-seller-meta">${marketplace.escapeHtml(rating)}</p>
      </div>
      <div class="listing-seller-actions">
        <a class="secondary-button" href="profile.html?id=${seller.userId}">View Profile</a>
        ${isOwnListing
          ? `<span class="secondary-button is-disabled">Your listing</span>`
          : `<button type="button" class="primary-button" id="message-seller-button">Message Seller</button>`}
      </div>
    </section>
  `;
}

function renderListing(listing) {
  const isOwnListing = currentUser?.userId === listing.userId;
  const price = Number.isFinite(listing.price) ? listing.price.toFixed(2) : "0.00";

  listingRoot.innerHTML = `
    <div class="listing-layout">
      ${renderGallery(listing)}
      <article class="listing-details-card">
        <div class="listing-title-row">
          <div>
            <p class="listing-status">${marketplace.escapeHtml(listing.status)}</p>
            <h1>${marketplace.escapeHtml(listing.title)}</h1>
          </div>
          ${isOwnListing ? "" : `
            <button
              type="button"
              class="listing-favorite-button ${listing.isFavorited ? "is-favorited" : ""}"
              id="listing-favorite-button"
              aria-label="${listing.isFavorited ? "Remove from favorites" : "Add to favorites"}"
              aria-pressed="${listing.isFavorited}"
            >${listing.isFavorited ? "&#9829;" : "&#9825;"}</button>
          `}
        </div>

        <p class="listing-price">$${price}</p>
        <dl class="listing-metadata">
          <div><dt>Condition</dt><dd>${marketplace.escapeHtml(listing.condition || "Not specified")}</dd></div>
          <div><dt>Category</dt><dd>${marketplace.escapeHtml(listing.categoryName || "Not specified")}</dd></div>
          <div><dt>Meetup</dt><dd>${marketplace.escapeHtml(listing.locationName || "Not specified")}</dd></div>
        </dl>

        <section class="listing-description">
          <h2>Description</h2>
          <p>${marketplace.escapeHtml(listing.description)}</p>
        </section>

        <div class="listing-action-links">
          ${isOwnListing ? "" : `
            <a class="listing-report-link" href="reporting.html?listingId=${listing.listingId}">Report this listing</a>
            <a class="listing-review-link" href="review.html?listingId=${listing.listingId}&reviewedUserId=${listing.seller.userId}">Review this seller</a>
          `}
        </div>
        ${renderSellerCard(listing)}
      </article>
    </div>
    <p class="listing-feedback" id="listing-feedback" role="status"></p>
  `;

  wireGalleryEvents();
  wireListingEvents(listing);
}

function setFeedback(message, isError = false) {
  const feedback = document.getElementById("listing-feedback");
  if (!feedback) return;
  feedback.textContent = message;
  feedback.classList.toggle("is-error", isError);
}

async function toggleFavorite(listing, button) {
  if (!currentUser?.userId) {
    window.location.href = "login.html";
    return;
  }

  const isFavorited = button.getAttribute("aria-pressed") === "true";
  button.disabled = true;

  try {
    if (isFavorited) {
      await marketplace.request(`favorite/${listing.listingId}?userId=${currentUser.userId}`, {
        method: "DELETE"
      });
    } else {
      await marketplace.request("favorite", {
        method: "POST",
        body: { userId: currentUser.userId, listingId: listing.listingId }
      });
    }

    const nextState = !isFavorited;
    button.setAttribute("aria-pressed", String(nextState));
    button.setAttribute("aria-label", nextState ? "Remove from favorites" : "Add to favorites");
    button.classList.toggle("is-favorited", nextState);
    button.innerHTML = nextState ? "&#9829;" : "&#9825;";
    setFeedback(nextState ? "Added to favorites." : "Removed from favorites.");
  } catch (error) {
    setFeedback(error.message || "Could not update favorites.", true);
  } finally {
    button.disabled = false;
  }
}

async function startConversation(listing) {
  if (!currentUser?.userId) {
    window.location.href = "login.html";
    return;
  }

  const button = document.getElementById("message-seller-button");
  if (button) button.disabled = true;

  try {
    const result = await marketplace.request("message/start", {
      method: "POST",
      body: { listingId: listing.listingId, buyerId: currentUser.userId }
    });
    window.location.href = `chat.html?conversationId=${result.conversationId}`;
  } catch (error) {
    setFeedback(error.message || "Could not start a conversation.", true);
    if (button) button.disabled = false;
  }
}

function wireListingEvents(listing) {
  const favoriteButton = document.getElementById("listing-favorite-button");
  favoriteButton?.addEventListener("click", () => toggleFavorite(listing, favoriteButton));
  document.getElementById("message-seller-button")?.addEventListener("click", () => {
    startConversation(listing);
  });
}

async function loadListing() {
  const listingId = Number(getQueryParam("id"));
  if (!Number.isFinite(listingId) || listingId <= 0) {
    listingRoot.innerHTML = `<p class="listing-status-message is-error">No valid listing was specified.</p>`;
    return;
  }

  const query = currentUser?.userId ? `?viewerId=${currentUser.userId}` : "";

  try {
    const result = await marketplace.request(`listing/${listingId}${query}`);
    renderListing(normalizeListing(result));
  } catch (error) {
    listingRoot.innerHTML = `
      <p class="listing-status-message is-error">
        ${marketplace.escapeHtml(error.message || "Could not load this listing.")}
      </p>
    `;
  }
}

loadListing();
