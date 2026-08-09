document.addEventListener("DOMContentLoaded", loadListings);

async function loadListings() {
  try {
    const listings = await CampusMarketplace.request("/listing");

    const tbody = document.getElementById("listingsBody");
    tbody.innerHTML = "";

    listings.forEach((listing) => {
      tbody.innerHTML += `
        <tr>
          <td>${CampusMarketplace.escapeHtml(listing.title)}</td>
          <td>${CampusMarketplace.escapeHtml(listing.categoryName || "")}</td>
          <td>$${listing.price}</td>
          <td>${CampusMarketplace.escapeHtml(listing.seller.fullName || "")}</td>
          <td>${listing.status}</td>
          <td>
            <button
              class="remove-btn"
              onclick="removeListing(${listing.listingId})">
              Remove
            </button>
          </td>
        </tr>
      `;
    });
  } catch (error) {
    console.error("Error loading listings:", error);
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