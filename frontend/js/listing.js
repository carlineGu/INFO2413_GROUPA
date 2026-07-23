console.log("listing.js loaded");

async function loadListing() {

    const params = new URLSearchParams(window.location.search);

    const listingId = params.get("id");

    const response = await fetch(`/api/listing/${listingId}`);

    const listing = await response.json();

    document.getElementById("listing-title").textContent =
        listing.listing_title;

    document.getElementById("listing-price").textContent =
        `$${listing.price}`;

    document.getElementById("listing-description").textContent =
        listing.listing_description;

    document.getElementById("listing-meta").textContent =
        `${listing.category_name} · ${listing.listing_condition} · ${listing.location_name}`;

    document.getElementById("listing-photo").src =
        listing.photo;

    document.getElementById("seller-name").textContent =
        listing.seller_name;

    document.getElementById("seller-department").textContent =
        listing.department_name;

    const currentUser =
        JSON.parse(localStorage.getItem("user") || "null");

    if (currentUser) {

        const favoriteResponse = await fetch(
            `/api/favorite/${listingId}/${currentUser.user_id}`
        );

        const favoriteData =
            await favoriteResponse.json();

        if (favoriteData.favorited) {

            const heart =
                document.getElementById("heart-img");

            heart.classList.add("favorited");

            heart.src =
                "../pictures/heart-filled.png";
        }
    }
}

loadListing();


async function toggleFavorite() {
 console.log("clicked");
    const heart =
        document.getElementById("heart-img");
    console.log(heart);

    const currentUser =
        JSON.parse(localStorage.getItem("user") || "null");


    const listingId =
        new URLSearchParams(window.location.search)
            .get("id");

    if (heart.classList.contains("favorited")) {

        const response = await fetch("/api/favorite", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userId: currentUser.user_id,
                listingId
            })
        });

        if (response.ok) {

            heart.classList.remove("favorited");

            heart.src =
                "../pictures/heart-outline.png";
        }

    } else {

        const response = await fetch("/api/favorite", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userId: currentUser.user_id,
                listingId
            })
        });

        if (response.ok) {

            heart.classList.add("favorited");

            heart.src =
                "../pictures/heart-filled.png";
        }
    }
}