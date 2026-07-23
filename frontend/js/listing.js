console.log("listing.js loaded");

async function loadListing() {

    const params = new URLSearchParams(window.location.search);

    const listingId = params.get("id");

    const response = await fetch(`/api/listing/${listingId}`);

    const listing = await response.json();

    const createdDate = new Date(listing.created_at);
    const today = new Date();
    const daysAgo = Math.floor(
        (today - createdDate) / (1000 * 60 * 60 * 24));

    document.getElementById("listing-title").textContent = listing.listing_title;

    document.getElementById("listing-price").textContent = `$${listing.price}`;

    document.getElementById("listing-description").textContent = listing.listing_description;

    document.getElementById("listing-meta").textContent =
        `${listing.category_name} · ${listing.listing_condition} · ${listing.location_name} · Posted ${daysAgo} day${daysAgo !== 1 ? "s" : ""} ago`;

    document.getElementById("listing-photo").src = listing.photo;

    document.getElementById("seller-name").textContent = listing.seller_name;

    document.getElementById("seller-department").textContent = 
        `${listing.department_name} · Rating ${listing.seller_rating || "0.0"}`;
                if (listing.profile_photo) {
                    document.getElementById("seller-avatar").src =
                    listing.profile_photo;
                }
                
    document.getElementById("view-profile").href = `/html/profile.html?id=${listing.user_id}`;
    
    
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