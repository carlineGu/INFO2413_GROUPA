async function testConnection() {
  const messageElement = document.getElementById("connectionMessage");

  try {
    const response = await fetch("/api/test");

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();

    messageElement.textContent = data.message;
  } catch (error) {
    console.error("Connection error:", error);
    messageElement.textContent = "Could not connect to backend.";
  }
}

async function loadListings() {
  const container = document.getElementById("listingContainer");

  try {
    const response = await fetch("/api/listing");

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const listings = await response.json();

    container.innerHTML = "";

    listings.forEach((listing) => {
      const column = document.createElement("div");
      column.className = "col-md-4 mb-4";

      column.innerHTML = `
        <div class="card h-100">
          <div class="card-body">
            <h5 class="card-title">${listing.listing_title}</h5>

            <p class="card-text">
              ${listing.listing_description}
            </p>

            <p class="fw-bold">
              $${Number(listing.price).toFixed(2)}
            </p>
          </div>
        </div>
      `;

      container.appendChild(column);
    });
  } catch (error) {
    console.error("Could not load listings:", error);

    container.innerHTML = `
      <p class="text-danger">
        Listings could not be loaded.
      </p>
    `;
  }
}

testConnection();
loadListings();