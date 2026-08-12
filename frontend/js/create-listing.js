"use strict";

const marketplace = window.CampusMarketplace;
const createListingForm = document.getElementById("create-listing-form");
const publishButton = document.getElementById("publish-listing-button");
const feedback = document.getElementById("create-listing-feedback");
const currentUser = marketplace.getCurrentUser();
const photoSlots = new Array(4).fill(null);
const editListingId = Number(new URLSearchParams(window.location.search).get("editListingId"));

const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function setFormModeToEdit() {
  const pageTitle = document.querySelector(".create-listing-heading h1");
  const pageSubtitle = document.querySelector(".create-listing-heading p");

  if (pageTitle) pageTitle.textContent = "Edit Listing";
  if (pageSubtitle) pageSubtitle.textContent = "Update the details for this listing.";
  publishButton.textContent = "Save Changes";
}

async function loadListingForEdit() {
  if (!Number.isFinite(editListingId) || editListingId <= 0) {
    return;
  }

  if (!currentUser?.userId) {
    showFeedback("Please log in to edit this listing.", true);
    window.setTimeout(() => {
      window.location.href = "login.html";
    }, 900);
    return;
  }

  setFormModeToEdit();

  try {
    const listing = await marketplace.request(`listing/${editListingId}?viewerId=${currentUser.userId}`);
    const titleInput = document.getElementById("listing-title");
    const priceInput = document.getElementById("listing-price");
    const departmentInput = document.getElementById("listing-department");
    const categoryInput = document.getElementById("listing-category");
    const conditionInput = document.getElementById("listing-condition");
    const locationInput = document.getElementById("listing-location");
    const descriptionInput = document.getElementById("listing-description");

    if (titleInput) titleInput.value = listing.title || "";
    if (priceInput) priceInput.value = Number(listing.price || 0).toFixed(2);
    if (departmentInput && listing.departmentName) departmentInput.value = listing.departmentName;
    if (categoryInput && listing.categoryName) categoryInput.value = listing.categoryName;
    if (conditionInput && listing.condition) conditionInput.value = listing.condition;
    if (locationInput && listing.locationName) locationInput.value = listing.locationName;
    if (descriptionInput) descriptionInput.value = listing.description || "";

    if (Array.isArray(listing.photos) && listing.photos.length > 0) {
      listing.photos.forEach((photo, index) => {
        if (index >= photoSlots.length) return;
        const input = document.querySelector(`[data-photo-slot="${index}"]`);
        const preview = input?.closest(".photo-upload")?.querySelector(".photo-preview");
        if (!input || !preview) return;
        photoSlots[index] = photo;
        preview.src = photo;
        input.closest(".photo-upload").classList.add("has-photo");
      });
    }
  } catch (error) {
    showFeedback(error.message || "Could not load this listing for editing.", true);
  }
}

function showFeedback(message, isError = false) {
  feedback.textContent = message;
  feedback.classList.toggle("is-error", isError);
}

function readPhoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(new Error("The selected photo could not be read.")));
    reader.readAsDataURL(file);
  });
}

function clearPhotoSlot(input, slot, preview) {
  photoSlots[slot] = null;
  preview.removeAttribute("src");
  input.closest(".photo-upload").classList.remove("has-photo");
}

document.querySelectorAll("[data-photo-slot]").forEach((input) => {
  input.addEventListener("change", async () => {
    const slot = Number(input.dataset.photoSlot);
    const file = input.files?.[0];
    const preview = input.closest(".photo-upload").querySelector(".photo-preview");

    if (!file) {
      clearPhotoSlot(input, slot, preview);
      return;
    }

    if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
      input.value = "";
      clearPhotoSlot(input, slot, preview);
      showFeedback("Photos must be PNG, JPEG, or WebP files.", true);
      return;
    }

    if (file.size > MAX_PHOTO_BYTES) {
      input.value = "";
      clearPhotoSlot(input, slot, preview);
      showFeedback("Each photo must be 4 MB or smaller.", true);
      return;
    }

    try {
      const dataUrl = await readPhoto(file);
      photoSlots[slot] = dataUrl;
      preview.src = dataUrl;
      input.closest(".photo-upload").classList.add("has-photo");
      showFeedback("");
    } catch (error) {
      input.value = "";
      clearPhotoSlot(input, slot, preview);
      showFeedback(error.message, true);
    }
  });
});

createListingForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showFeedback("");

  if (!currentUser?.userId) {
    showFeedback("Please log in before creating a listing.", true);
    window.setTimeout(() => {
      window.location.href = "login.html";
    }, 900);
    return;
  }

  if (!createListingForm.reportValidity()) {
    showFeedback("Please complete all required fields.", true);
    return;
  }

  const formData = new FormData(createListingForm);
  const payload = {
    userId: currentUser.userId,
    title: String(formData.get("title") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    price: Number(formData.get("price")),
    department: String(formData.get("department") || "").trim(),
    category: String(formData.get("category") || "").trim(),
    condition: String(formData.get("condition") || "").trim(),
    location: String(formData.get("location") || "").trim(),
    photos: photoSlots.filter(Boolean)
  };

  const isEditing = Number.isFinite(editListingId) && editListingId > 0;
  publishButton.disabled = true;
  publishButton.textContent = isEditing ? "Saving..." : "Publishing...";

  try {
    const endpoint = isEditing ? `listing/${editListingId}` : "listing";
    const method = isEditing ? "PATCH" : "POST";
    const listing = await marketplace.request(endpoint, {
      method,
      body: payload
    });
    const listingId = Number(listing.listingId ?? listing.listing_id ?? editListingId);
    showFeedback(isEditing ? "Listing updated successfully." : "Listing published successfully.");
    window.setTimeout(() => {
      window.location.href = listingId ? `listing.html?id=${listingId}` : "index.html";
    }, 600);
  } catch (error) {
    const fallbackMessage = isEditing ? "Could not update this listing." : "Could not publish this listing.";
    showFeedback(error.message || fallbackMessage, true);
    publishButton.disabled = false;
    publishButton.textContent = isEditing ? "Save Changes" : "Publish Listing";
  }
});

if (Number.isFinite(editListingId) && editListingId > 0) {
  loadListingForEdit();
}
