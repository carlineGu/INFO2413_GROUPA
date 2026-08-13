"use strict";

const marketplace = window.CampusMarketplace;
const root = document.getElementById("root");
const currentUser = marketplace.getCurrentUser();
const viewedUserId = new URLSearchParams(window.location.search).get("id");
const isViewingOtherUser =
  viewedUserId
  && currentUser?.userId
  && String(viewedUserId) !== String(currentUser.userId);

const state = {
  loading: true,
  view: isViewingOtherUser ? "public" : "self",
  tab: "listings",
  user: currentUser,
  profilePic: null,
  department: "No Department",
  departmentStatus: "idle",
  myListings: [],
  savedListings: [],
  publicProfile: null,
  publicListings: [],
  publicNotFound: false,
  message: "",
  messageIsError: false
};

function getDisplayName(user) {
  if (!user) return "Guest";
  if (user.fullName) return user.fullName;
  if (user.name) return user.name;
  if (user.firstName || user.lastName) {
    return `${user.firstName || ""} ${user.lastName || ""}`.trim();
  }
  return "User";
}

function getProfilePicStorageKey(user) {
  if (!user?.userId) return null;
  return `profilePic:${user.userId}`;
}

function loadProfilePic(user) {
  const storageKey = getProfilePicStorageKey(user);
  if (!storageKey) return null;
  return localStorage.getItem(storageKey) || null;
}

function normalizeListing(rawListing) {
  if (!rawListing) return null;

  return {
    listingId: Number(rawListing.listingId ?? rawListing.listing_id),
    userId: Number(rawListing.userId ?? rawListing.user_id),
    title: rawListing.title ?? rawListing.listing_title ?? "Untitled listing",
    description: rawListing.description ?? rawListing.listing_description ?? "",
    price: Number(rawListing.price),
    status: rawListing.status ?? rawListing.listing_status ?? "ACTIVE",
    categoryName: rawListing.categoryName ?? rawListing.category_name ?? "",
    departmentName: rawListing.departmentName ?? rawListing.department_name ?? "",
    locationName: rawListing.locationName ?? rawListing.location_name ?? "",
    condition: rawListing.condition ?? rawListing.listing_condition ?? "",
    photo: rawListing.photo ?? rawListing.image_url ?? null,
    isFavorited: Boolean(rawListing.isFavorited ?? rawListing.favorited)
  };
}

function normalizePublicProfile(rawProfile) {
  if (!rawProfile) return null;
  return {
    userId: Number(rawProfile.userId ?? rawProfile.user_id),
    fullName: rawProfile.fullName ?? rawProfile.name ?? getDisplayName(rawProfile),
    department: rawProfile.department ?? "No Department",
    listingCount: Number(rawProfile.listingCount ?? rawProfile.listing_count ?? 0),
    averageRating: Number(rawProfile.averageRating ?? rawProfile.avg_rating ?? 0),
    reviewCount: Number(rawProfile.reviewCount ?? rawProfile.review_count ?? 0)
  };
}

function escape(value) {
  return marketplace.escapeHtml(value == null ? "" : String(value));
}

function setStatus(message, isError = false) {
  state.message = message;
  state.messageIsError = isError;
}

function soldCount() {
  return state.myListings.filter((item) => String(item.status || "").toUpperCase() === "SOLD").length;
}

function renderImgBox() {
  return `
    <div class="w-full h-full border border-[#D8D0BF] relative bg-white overflow-hidden">
      <svg width="100%" height="100%" class="absolute inset-0">
        <line x1="0" y1="0" x2="100%" y2="100%" stroke="black" stroke-width="1" />
        <line x1="100%" y1="0" x2="0" y2="100%" stroke="black" stroke-width="1" />
      </svg>
    </div>
  `;
}

function renderAvatar(photo, altText) {
  if (photo) {
    return `<img src="${escape(photo)}" alt="${escape(altText)}" class="w-full h-full object-cover border border-[#D8D0BF]">`;
  }

  return renderImgBox();
}

function renderListingMedia(photo, altText) {
  if (photo) {
    return `<img src="${escape(photo)}" alt="${escape(altText)}" class="w-full h-full object-cover">`;
  }

  return renderImgBox();
}

function renderCard(listing, options) {
  const href = options.href;
  const showDelete = Boolean(options.showDelete);
  const showToggleStatus = Boolean(options.showToggleStatus);
  const showRemove = Boolean(options.showRemove);
  const status = String(listing.status || "").toUpperCase();
  const statusLabel = status === "SOLD" ? "Relist" : "Sold";

  return `
    <div class="border border-[#D8D0BF] bg-white cursor-pointer" role="link" tabindex="0" data-listing-url="${escape(href)}">
      <div class="h-24 overflow-hidden bg-gray-50">
        ${renderListingMedia(listing.photo, listing.title)}
      </div>
      <div class="p-1.5">
        <div class="flex items-start justify-between gap-2 mb-1">
          <div class="text-xs">${escape(listing.title)}</div>
          ${showDelete ? `<button type="button" class="border border-[#D8D0BF] bg-[#fff] px-2 py-1 text-[10px] text-[#4A0E1A]" data-action="delete-listing" data-listing-id="${listing.listingId}">Delete</button>` : ""}
        </div>
        <div class="flex items-center justify-between gap-2">
          <div class="text-xs font-bold">$${Number(listing.price || 0).toFixed(2)}</div>
          <div class="flex items-center gap-2">
            ${showToggleStatus ? `<button type="button" class="border border-[#D8D0BF] bg-[#fff] px-2 py-1 text-[10px] text-[#4A0E1A]" data-action="toggle-status" data-listing-id="${listing.listingId}" data-status="${escape(status)}">${statusLabel}</button>` : ""}
            ${showRemove ? `<button type="button" class="border border-[#D8D0BF] bg-[#fff] px-2 py-1 text-[10px] text-[#4A0E1A]" data-action="remove-favorite" data-listing-id="${listing.listingId}">Remove</button>` : ""}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderTabs() {
  return `
    <div class="flex border border-[#D8D0BF] mb-4 bg-white" role="tablist" aria-label="Profile sections">
      ${["listings", "saved", "settings"].map((tab) => `
        <button
          type="button"
          class="flex-1 py-1.5 text-xs capitalize ${state.tab === tab ? "bg-[#4A0E1A] text-[#FDFBF6]" : "bg-white text-[#4A0E1A]"}"
          data-tab="${tab}"
          role="tab"
          aria-selected="${state.tab === tab}"
        >${tab}</button>
      `).join("")}
    </div>
  `;
}

function renderSelfView() {
  const user = state.user || currentUser;
  const displayName = getDisplayName(user);
  const email = user?.email || "";
  const rating = user?.reviewCount > 0
    ? `${Number(user.averageRating || 0).toFixed(1)} ★ (${user.reviewCount})`
    : "No ratings yet";

  const listingsHtml = state.myListings.length === 0
    ? `<div class="border border-[#D8D0BF] p-8 text-center text-xs text-gray-400 bg-white">No listings yet</div>`
    : `<div class="grid grid-cols-3 gap-2">${state.myListings.map((item) => renderCard(item, {
        href: `listing.html?id=${item.listingId}&returnTo=profile`,
        showDelete: true,
        showToggleStatus: true
      })).join("")}</div>`;

  const savedHtml = state.savedListings.length === 0
    ? `<div class="border border-[#D8D0BF] p-8 text-center text-xs text-gray-400 bg-white">No saved items</div>`
    : `<div class="grid grid-cols-3 gap-2">${state.savedListings.map((item) => renderCard(item, {
        href: `listing.html?id=${item.listingId}&returnTo=profile`,
        showRemove: true
      })).join("")}</div>`;

  const settingsHtml = `
    <div class="border border-[#D8D0BF] p-4 bg-white">
      <div class="mb-5">
        <div class="text-xs mb-2">Profile Picture</div>
        <div class="flex items-center gap-4">
          <div class="w-20 h-20 shrink-0">
          ${renderAvatar(state.profilePic, "Profile")}
          </div>
          <div class="flex flex-col gap-2">
          <label class="border border-[#D8D0BF] px-3 py-1.5 text-xs bg-white text-center cursor-pointer transition-colors duration-200 hover:bg-[#4A0E1A] hover:text-[#FDFBF6]">
            Upload Photo
            <input type="file" accept="image/*" class="hidden" data-action="upload-photo">
          </label>
          ${state.profilePic ? `<button type="button" data-action="remove-photo" class="border border-[#D8D0BF] px-3 py-1.5 text-xs bg-white transition-colors duration-200 hover:bg-[#4A0E1A] hover:text-[#FDFBF6]">Remove Photo</button>` : ""}
          </div>
        </div>
      </div>

      <div class="border-t border-[#D8D0BF] pt-4">
        <div class="text-xs font-semibold mb-2">Account details</div>
        <dl class="text-xs space-y-2">
          <div>
          <dt class="text-gray-500">Name</dt>
          <dd>${escape(displayName)}</dd>
          </div>
          <div>
          <dt class="text-gray-500">Email</dt>
          <dd>${escape(email || "No email on file")}</dd>
          </div>
        </dl>
        <p class="text-xs text-gray-500 mt-3">Name and email are read-only in this class-project build.</p>
      </div>

      <div class="border-t border-[#D8D0BF] pt-4 mt-4">
        <div class="text-xs font-semibold mb-2">Security</div>
        <a href="forgot-password.html" class="inline-block border border-[#D8D0BF] px-3 py-1.5 text-xs bg-white transition-colors duration-200 hover:bg-[#4A0E1A] hover:text-[#FDFBF6]">Forgot your password?</a>
      </div>

      <div class="border-t border-[#D8D0BF] pt-4 mt-4">
        <div class="text-xs font-semibold mb-2">Department</div>
        <select class="border border-[#D8D0BF] px-2 py-1.5 text-xs bg-white w-full" data-action="department-select">
        ${[
          "No Department",
          "Business",
          "Nursing",
          "Criminology",
          "Computer Science",
          "Arts",
          "Health Sciences",
          "Trades & Technology",
          "Design",
          "Education"
        ].map((department) => `<option value="${escape(department)}" ${state.department === department ? "selected" : ""}>${escape(department)}</option>`).join("")}
      </select>
      <p class="text-xs mt-2 ${state.departmentStatus === "error" ? "text-red-600" : "text-gray-500"}">
        ${state.departmentStatus === "saving" ? "Saving..." : ""}
        ${state.departmentStatus === "saved" ? "Department updated." : ""}
        ${state.departmentStatus === "error" ? "Could not update department. Please try again." : ""}
      </p>
      </div>
    </div>
  `;

  const content = state.tab === "listings"
    ? `
      <a class="block w-full border border-[#D8D0BF] bg-[#4A0E1A] px-2 py-2 text-center text-xs text-[#FDFBF6] mb-3 hover:bg-[#fdfbf6] hover:text-[#4A0E1A]" href="create_listing.html">+ Create Listing</a>
      ${state.myListings.length === 0
        ? `<div class="border border-[#D8D0BF] p-8 text-center text-xs text-gray-400 bg-white">No listings yet</div>`
        : `<div class="grid grid-cols-3 gap-2">${state.myListings.map((item) => renderCard(item, {
            href: `listing.html?id=${item.listingId}&returnTo=profile`,
            showDelete: true,
            showToggleStatus: true
          })).join("")}</div>`
      }
    `
    : state.tab === "saved"
      ? savedHtml
      : settingsHtml;

  return `
    <div>
      <div class="border border-[#D8D0BF] p-4 flex gap-4 mb-4 bg-white">
        <div class="w-20 h-20 shrink-0">
          ${renderAvatar(state.profilePic, displayName)}
        </div>
        <div class="flex-1">
          <h1 class="font-semibold text-sm">${escape(displayName)}</h1>
          <div class="text-xs text-gray-500">${escape(state.department || "No Department")}</div>
          <div class="text-xs text-gray-500">${escape(email || "No email on file")}</div>
          <div class="flex gap-6 text-xs mt-2">
            <div>Listings: <b>${state.myListings.length}</b></div>
            <div>Sold: <b>${soldCount()}</b></div>
            <div>Rating: <b>${escape(rating)}</b></div>
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <a href="login.html" data-action="logout" class="border border-[#D8D0BF] px-2 py-1 text-xs h-fit text-center bg-white text-[#4A0E1A] hover:bg-[#4A0E1A] hover:text-[#FDFBF6]">Log out</a>
        </div>
      </div>

      ${renderTabs()}
      ${content}
      ${state.message ? `<p class="text-xs mt-2 ${state.messageIsError ? "text-red-600" : "text-gray-500"}">${escape(state.message)}</p>` : ""}
    </div>
  `;
}

function renderPublicView() {
  if (state.publicNotFound) {
    return `<p class="profile-status-message">This user could not be found.</p>`;
  }

  if (!state.publicProfile) {
    return `<p class="profile-status-message">Loading profile...</p>`;
  }

  const profile = state.publicProfile;
  const ratingLabel = profile.reviewCount > 0
    ? `${profile.averageRating.toFixed(1)} ★ (${profile.reviewCount})`
    : "No ratings yet";

  const listingsHtml = state.publicListings.length === 0
    ? `<div class="border border-[#D8D0BF] p-8 text-center text-xs text-gray-400 bg-white">No active listings</div>`
    : `<div class="grid grid-cols-3 gap-2">${state.publicListings.map((item) => renderCard(item, {
        href: `listing.html?id=${item.listingId}`
      })).join("")}</div>`;

  return `
    <div>
      <div class="border border-[#D8D0BF] p-4 flex gap-4 mb-4 bg-white">
        <div class="w-20 h-20 shrink-0">
          ${renderAvatar(null, profile.fullName)}
        </div>
        <div class="flex-1">
          <h1 class="font-semibold text-sm">${escape(profile.fullName)}</h1>
          <div class="text-xs text-gray-500">${escape(profile.department || "No Department")}</div>
          <div class="flex gap-6 text-xs mt-2">
            <div>Listings: <b>${profile.listingCount}</b></div>
            <div>Rating: <b>${escape(ratingLabel)}</b></div>
          </div>
        </div>
        ${currentUser && Number(currentUser.userId) !== Number(profile.userId) ? `
          <div class="flex flex-col justify-start">
            <a href="reporting.html?targetUserId=${profile.userId}" class="border border-[#D8D0BF] px-2 py-1 text-xs h-fit text-center bg-white text-[#4A0E1A] hover:bg-[#4A0E1A] hover:text-[#FDFBF6]">Report User</a>
          </div>
        ` : ""}
      </div>

      <div class="text-xs font-semibold mb-2">Active Listings</div>
        ${listingsHtml}
    </div>
  `;
}

function render() {
  if (!root) return;

  if (state.loading) {
    root.innerHTML = `<p class="profile-status-message">Loading profile...</p>`;
    return;
  }

  root.innerHTML = state.view === "public" ? renderPublicView() : renderSelfView();
}

async function loadSelfProfile() {
  const storedUser = marketplace.getCurrentUser();
  if (!storedUser?.userId) {
    window.location.replace("login.html");
    return;
  }

  state.loading = true;
  state.view = "self";
  render();

  try {
    const params = new URLSearchParams();
    params.set("userId", storedUser.userId);

    const [freshUser, listingData, favoriteData, publicProfile] = await Promise.all([
      marketplace.request(`user/me?${params.toString()}`),
      marketplace.request(`listing?ownerId=${storedUser.userId}&status=ALL`),
      marketplace.request(`favorite?userId=${storedUser.userId}`),
      marketplace.request(`user/${storedUser.userId}`)
    ]);

    const savedPic = loadProfilePic(freshUser);
    const updatedUser = { ...(marketplace.getCurrentUser() || {}), ...freshUser };
    marketplace.setCurrentUser(updatedUser, marketplace.getAccessToken());

    state.user = { ...updatedUser, ...publicProfile };
    state.profilePic = savedPic;
    state.department = freshUser.department || "No Department";
    state.myListings = Array.isArray(listingData) ? listingData.map(normalizeListing).filter(Boolean) : [];
    state.savedListings = Array.isArray(favoriteData) ? favoriteData.map(normalizeListing).filter(Boolean) : [];
    state.publicProfile = normalizePublicProfile(publicProfile);
    state.publicListings = [];
    state.publicNotFound = false;
    state.loading = false;
    render();
  } catch (error) {
    console.error("Profile fetch failed:", error);
    state.loading = false;
    setStatus(error.message || "Could not load your profile.", true);
    render();
  }
}

async function loadPublicProfile(userId) {
  state.loading = true;
  state.view = "public";
  render();

  try {
    const [profileData, listingData] = await Promise.all([
      marketplace.request(`user/${userId}`),
      marketplace.request(`listing?ownerId=${userId}`)
    ]);

    state.publicProfile = normalizePublicProfile(profileData);
    state.publicListings = Array.isArray(listingData) ? listingData.map(normalizeListing).filter(Boolean) : [];
    state.publicNotFound = false;
  } catch (error) {
    console.error("Public profile fetch failed:", error);
    state.publicProfile = null;
    state.publicListings = [];
    state.publicNotFound = true;
  } finally {
    state.loading = false;
    render();
  }
}

async function handleDepartmentChange(nextDepartment) {
  const user = state.user || marketplace.getCurrentUser();
  if (!user?.userId) return;

  const previousDepartment = state.department;
  state.department = nextDepartment;
  state.departmentStatus = "saving";
  render();

  try {
    await marketplace.request(`user/${user.userId}/department`, {
      method: "PATCH",
      body: { department: nextDepartment }
    });
    const updatedUser = { ...(marketplace.getCurrentUser() || user), department: nextDepartment };
    marketplace.setCurrentUser(updatedUser, marketplace.getAccessToken());
    state.user = { ...updatedUser };
    state.departmentStatus = "saved";
    setTimeout(() => {
      if (state.departmentStatus === "saved") {
        state.departmentStatus = "idle";
        render();
      }
    }, 1800);
  } catch (error) {
    console.error("Update department error:", error);
    state.department = previousDepartment;
    state.departmentStatus = "error";
  }

  render();
}

function handleProfilePhotoChange(file) {
  const user = state.user || marketplace.getCurrentUser();
  const storageKey = getProfilePicStorageKey(user);
  if (!file || !storageKey) return;

  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result;
    state.profilePic = dataUrl;
    localStorage.setItem(storageKey, dataUrl);
    render();
  };
  reader.readAsDataURL(file);
}

function handleRemoveProfilePhoto() {
  const user = state.user || marketplace.getCurrentUser();
  const storageKey = getProfilePicStorageKey(user);
  state.profilePic = null;
  if (storageKey) {
    localStorage.removeItem(storageKey);
  }
  render();
}

async function handleDeleteListing(listingId) {
  const user = state.user || marketplace.getCurrentUser();
  if (!user?.userId) return;

  try {
    await marketplace.request(`listing/${listingId}`, {
      method: "DELETE",
      body: { userId: user.userId }
    });
    state.myListings = state.myListings.filter((item) => item.listingId !== listingId);
    state.savedListings = state.savedListings.filter((item) => item.listingId !== listingId);
    setStatus("Listing removed.");
    render();
  } catch (error) {
    console.error("Delete listing error:", error);
    setStatus(error.message || "Could not delete listing.", true);
    render();
  }
}

async function handleToggleListingStatus(listingId, currentStatus) {
  const user = state.user || marketplace.getCurrentUser();
  if (!user?.userId) return;

  const nextStatus = String(currentStatus || "").toUpperCase() === "SOLD" ? "ACTIVE" : "SOLD";

  try {
    const updated = await marketplace.request(`listing/${listingId}/status`, {
      method: "PATCH",
      body: { userId: user.userId, status: nextStatus }
    });

    state.myListings = state.myListings.map((item) => (
      item.listingId === listingId
        ? { ...item, status: updated?.status || nextStatus }
        : item
    ));
    setStatus(nextStatus === "SOLD" ? "Listing marked sold." : "Listing relisted.");
    render();
  } catch (error) {
    console.error("Update listing status error:", error);
    setStatus(error.message || "Could not update listing status.", true);
    render();
  }
}

async function handleUnfavorite(listingId) {
  const user = state.user || marketplace.getCurrentUser();
  if (!user?.userId) return;

  try {
    await marketplace.request(`favorite/${listingId}?userId=${user.userId}`, { method: "DELETE" });
    state.savedListings = state.savedListings.filter((item) => item.listingId !== listingId);
    setStatus("Removed from saved items.");
    render();
  } catch (error) {
    console.error("Unfavorite error:", error);
    setStatus(error.message || "Could not remove saved item.", true);
    render();
  }
}

function handleRootClick(event) {
  const tabButton = event.target.closest("[data-tab]");
  if (tabButton) {
    state.tab = tabButton.dataset.tab;
    setStatus("");
    render();
    return;
  }

  const logoutButton = event.target.closest('[data-action="logout"]');
  if (logoutButton) {
    marketplace.clearCurrentUser();
    return;
  }

  const deleteButton = event.target.closest('[data-action="delete-listing"]');
  if (deleteButton) {
    event.preventDefault();
    event.stopPropagation();
    handleDeleteListing(Number(deleteButton.dataset.listingId));
    return;
  }

  const removePhotoButton = event.target.closest('[data-action="remove-photo"]');
  if (removePhotoButton) {
    event.preventDefault();
    event.stopPropagation();
    handleRemoveProfilePhoto();
    return;
  }

  const toggleStatusButton = event.target.closest('[data-action="toggle-status"]');
  if (toggleStatusButton) {
    event.preventDefault();
    event.stopPropagation();
    handleToggleListingStatus(
      Number(toggleStatusButton.dataset.listingId),
      toggleStatusButton.dataset.status
    );
    return;
  }

  const removeFavoriteButton = event.target.closest('[data-action="remove-favorite"]');
  if (removeFavoriteButton) {
    event.preventDefault();
    event.stopPropagation();
    handleUnfavorite(Number(removeFavoriteButton.dataset.listingId));
    return;
  }

  const listingCard = event.target.closest("[data-listing-url]");
  if (listingCard && !event.target.closest("button, input, select, label, a")) {
    window.location.href = listingCard.dataset.listingUrl;
  }
}

function handleRootChange(event) {
  const departmentSelect = event.target.closest('[data-action="department-select"]');
  if (departmentSelect) {
    handleDepartmentChange(departmentSelect.value);
    return;
  }

  const photoInput = event.target.closest('[data-action="upload-photo"]');
  if (photoInput) {
    const file = photoInput.files && photoInput.files[0];
    handleProfilePhotoChange(file);
    photoInput.value = "";
  }
}

function handleRootKeyDown(event) {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  const listingCard = event.target.closest("[data-listing-url]");
  if (!listingCard || event.target.closest("button, input, select, label, a")) {
    return;
  }

  event.preventDefault();
  window.location.href = listingCard.dataset.listingUrl;
}

function syncCurrentUser() {
  const refreshedUser = marketplace.getCurrentUser();
  if (!refreshedUser?.userId) {
    window.location.replace("login.html");
    return;
  }

  if (!isViewingOtherUser || String(viewedUserId) === String(refreshedUser.userId)) {
    state.user = refreshedUser;
  }
}

root.addEventListener("click", handleRootClick);
root.addEventListener("change", handleRootChange);
root.addEventListener("keydown", handleRootKeyDown);
window.addEventListener("storage", syncCurrentUser);

if (!currentUser?.userId) {
  window.location.replace("login.html");
} else if (isViewingOtherUser) {
  loadPublicProfile(viewedUserId);
} else {
  loadSelfProfile();
}
