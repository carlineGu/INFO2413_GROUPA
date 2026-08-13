document.addEventListener("DOMContentLoaded", loadListings);

const listingDetailCache = new Map();
const openListingDetailIds = new Set();

async function loadListings() {
  try {
    const listings = await CampusMarketplace.request("/listing?status=ALL");

    const tbody = document.getElementById("listings-body");
    tbody.innerHTML = "";

    listings.forEach((listing) => {
      const reportId = String(listing.listingId);
      tbody.innerHTML += `
        <tr data-listing-id="${reportId}">
          <td>
            <button type="button" class="name-toggle" data-toggle-detail="${reportId}">
              ${CampusMarketplace.escapeHtml(listing.title)}
            </button>
          </td>
          <td>${CampusMarketplace.escapeHtml(listing.categoryName || "")}</td>
          <td>$${listing.price}</td>
          <td>
            <a href="profile.html?id=${listing.seller.userId}" class="admin-linked-name">
              ${CampusMarketplace.escapeHtml(listing.seller.fullName || "")}
            </a>
          </td>
          <td>${listing.status}</td>
          <td>
            <button
              class="remove-btn"
              onclick="removeListing(${listing.listingId})">
              Remove
            </button>
          </td>
        </tr>
        <tr class="detail-row" id="listing-detail-row-${reportId}" hidden>
          <td colspan="6">
            <div class="detail-panel" id="listing-detail-panel-${reportId}"></div>
          </td>
        </tr>
      `;
    });

    openListingDetailIds.forEach((listingId) => {
      const row = document.getElementById(`listing-detail-row-${listingId}`);
      const panel = document.getElementById(`listing-detail-panel-${listingId}`);
      if (row && panel) {
        row.hidden = false;
        renderListingDetail(Number(listingId), panel);
      }
    });
  } catch (error) {
    console.error("Error loading listings:", error);
  }
}

function detailFieldHtml(label, value) {
  return `
    <div class="detail-field">
      <span class="detail-label">${CampusMarketplace.escapeHtml(label)}</span>
      ${CampusMarketplace.escapeHtml(value ?? "–")}
    </div>
  `;
}

function renderListingDetailHtml(listing) {
  const photosHtml = listing.photos && listing.photos.length
    ? `<div class="detail-photos">${listing.photos
        .map((photo) => `<img src="${CampusMarketplace.escapeHtml(photo)}" alt="${CampusMarketplace.escapeHtml(listing.title || "Listing photo")}">`)
        .join("")}</div>`
    : '<p class="detail-no-photos">No photos on this listing.</p>';

  return `
    <div class="detail-grid">
      ${detailFieldHtml("Title", listing.title)}
      ${detailFieldHtml("Price", `$${Number(listing.price).toFixed(2)}`)}
      ${detailFieldHtml("Condition", listing.condition)}
      ${detailFieldHtml("Status", listing.status)}
      ${detailFieldHtml("Category", listing.categoryName)}
      ${detailFieldHtml("Department", listing.departmentName)}
      ${detailFieldHtml("Location", listing.locationName)}
      ${detailFieldHtml("Seller", listing.seller?.fullName)}
    </div>
    <p class="detail-description">${CampusMarketplace.escapeHtml(listing.description || "No description provided.")}</p>
    ${photosHtml}
  `;
}

async function renderListingDetail(listingId, panel) {
  if (!panel) {
    return;
  }

  if (listingDetailCache.has(listingId)) {
    panel.innerHTML = listingDetailCache.get(listingId);
    return;
  }

  panel.innerHTML = '<p class="detail-loading">Loading details&hellip;</p>';

  try {
    const listing = await CampusMarketplace.request(`/listing/${listingId}`);
    const html = renderListingDetailHtml(listing);
    listingDetailCache.set(listingId, html);
    panel.innerHTML = html;
  } catch (error) {
    panel.innerHTML = `<p class="detail-error">${CampusMarketplace.escapeHtml(error.message || "Could not load details.")}</p>`;
  }
}

async function removeListing(listingId) {

  if (!confirm("Remove this listing?")) {
    return;
  }

  try {

    await CampusMarketplace.request(
      `/listing/admin/${listingId}`,
      {
        method: "DELETE"
      }
    );

    loadListings();

  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}

document.getElementById("listings-body")?.addEventListener("click", (event) => {
  const toggleButton = event.target.closest("button[data-toggle-detail]");
  if (!toggleButton) {
    return;
  }

  const listingId = toggleButton.getAttribute("data-toggle-detail");
  const row = document.getElementById(`listing-detail-row-${listingId}`);
  const panel = document.getElementById(`listing-detail-panel-${listingId}`);
  if (!row || !panel) {
    return;
  }

  if (row.hidden) {
    row.hidden = false;
    openListingDetailIds.add(listingId);
    renderListingDetail(Number(listingId), panel);
  } else {
    row.hidden = true;
    openListingDetailIds.delete(listingId);
  }
});
