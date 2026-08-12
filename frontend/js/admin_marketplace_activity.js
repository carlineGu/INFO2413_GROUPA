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

    const maxCategoryTotal = Math.max(1, ...data.categories.map((category) => Number(category.total || 0)));

    data.categories.forEach((category) => {
      const total = Number(category.total || 0);
      const progressWidth = Math.max(0, (total / maxCategoryTotal) * 100);

      categoryList.innerHTML += `
        <div class="category-row">
          <span>${category.category_name}</span>

          <div class="progress-bar" aria-label="${category.category_name} ${total} listings">
            <div class="progress-track"></div>
            <div class="progress-fill" style="width:${progressWidth}%"></div>
          </div>

          <span>${total}</span>
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