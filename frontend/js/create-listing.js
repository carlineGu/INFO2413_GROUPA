"use strict";

const marketplace = window.CampusMarketplace;
const createListingForm = document.getElementById("create-listing-form");
const publishButton = document.getElementById("publish-listing-button");
const feedback = document.getElementById("create-listing-feedback");
const currentUser = marketplace.getCurrentUser();
const photoSlots = new Array(4).fill(null);

const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

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

  publishButton.disabled = true;
  publishButton.textContent = "Publishing...";

  try {
    const listing = await marketplace.request("listing", {
      method: "POST",
      body: payload
    });
    const listingId = Number(listing.listingId ?? listing.listing_id);
    showFeedback("Listing published successfully.");
    window.setTimeout(() => {
      window.location.href = listingId ? `listing.html?id=${listingId}` : "index.html";
    }, 600);
  } catch (error) {
    showFeedback(error.message || "Could not publish this listing.", true);
    publishButton.disabled = false;
    publishButton.textContent = "Publish Listing";
  }
});
