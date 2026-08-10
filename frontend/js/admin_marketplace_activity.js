document.addEventListener(
  "DOMContentLoaded",
  loadMarketplaceActivity
);

async function loadMarketplaceActivity() {
  try {
    const data =
      await CampusMarketplace.request(
        "/report/activity"
      );

    document.getElementById("total-users")
      .textContent = data.totalUsers;

    document.getElementById("total-listings")
      .textContent = data.totalListings;

    document.getElementById("avg-listings")
      .textContent = data.avgListings;

    const categoryList =
      document.getElementById("category-list");

    categoryList.innerHTML = "";

    data.categories.forEach(category => {

      categoryList.innerHTML += `
        <div class="category-row">
          <span>${category.category_name}</span>

          <div class="progress-bar">
            <div
              class="progress-fill"
              style="width:${category.total * 20}%">
            </div>
          </div>

          <span>${category.total}</span>
        </div>
      `;
    });

    const sellerBody =
      document.getElementById("seller-body");

    sellerBody.innerHTML = "";

    data.sellers.forEach(seller => {

      sellerBody.innerHTML += `
        <tr>
          <td>
            <strong>
              ${seller.first_name}
              ${seller.last_name}
            </strong>
            <br>
            ${seller.email_addr}
          </td>

          <td>${seller.listings}</td>
        </tr>
      `;
    });

  } catch (error) {
    console.error(error);
  }
}