 const userId =
    new URLSearchParams(window.location.search)
        .get("id");




async function loadProfile() {

    const userId =
        new URLSearchParams(window.location.search)
            .get("id");

    const response =
        await fetch(`/api/user/${userId}`);

    const user =
        await response.json();

    document.getElementById("profile-name").textContent =
        `${user.first_name} ${user.last_name}`;

}

loadProfile();