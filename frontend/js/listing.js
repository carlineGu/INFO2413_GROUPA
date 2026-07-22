function updateSubcategories() {

    const category = document.getElementById("category").value;

    const sub = document.getElementById("subcategory");

    sub.innerHTML = "";
        const data = {
          Books: [
            "Used Textbooks",
            "Lab Manuals",
            "Class Notes",
            "Study Guides"
         ],

          Electronics: [
            "Laptops",
            "Monitors",
            "Calculators",
            "Headphones"
          ],

          Furniture: [
            "Desks",
            "Chairs",
            "Lamps",
            "Mini Fridges"
          ],

          Clothing: [
            "Jackets",
            "Shoes",
            "Backpacks"
          ]
    };

    const defaultOption = document.createElement("option");

    defaultOption.text = "Select...";
    sub.add(defaultOption);

    if (data[category]) {
        data[category].forEach(item => {

            const option =
                document.createElement("option");

            option.text = item;

            sub.add(option);
        });
    }
}



async function publishListing() {
    const title = document.getElementById("title").value.trim();
    const price = document.getElementById("price").value.trim();
    const department = document.getElementById("department").value;
    const category = document.getElementById("category").value;
    const description = document.getElementById("description").value.trim();
    const condition = document.getElementById("condition").value;
    const location = document.getElementById("meetup_location").value;

    if (!title) {
        alert("Title is required");
        return;
    }

    if (!price || Number(price) <= 0) {
        alert("Enter a valid price");
        return;
    }
    
    if (!department) {
        alert("Choose a department");
        return;
    }

    if (!category) {
        alert("Choose a category");
        return;
    }

    if (!description) {
        alert("Description is required");
        return;
    }

    try {
        const currentUser = JSON.parse(localStorage.getItem("user") || "null");
            if (!currentUser || !currentUser.user_id) {
             alert("You must be logged in.");
             return;
            }
        const response = await fetch("/api/listing", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userId: currentUser.user_id,
                title,
                price: NUmber(price),
                department,
                category,
                condition,
                meetup_location,
                description
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert("Listing Published!");
        document.getElementById("title").value = "";
        document.getElementById("price").value = "";
        document.getElementById("description").value = "";
        document.getElementById("category").selectedIndex = 0;
        document.getElementById("condition").selectedIndex = 0;
        document.getElementById("location").selectedIndex = 0;
        document.getElementById("subcategory").innerHTML =
        "<option>Select...</option>";
        }
        
        else {
            alert(data.message || "Could not publish listing.");
        }
    } catch (error) {
        console.error(error);
        alert("Unable to connect to the server.");
    }
}



document.querySelectorAll('.photo-upload input').forEach(input => {

    input.addEventListener('change', function () {

        const file = this.files[0];

        if (!file) return;

        const reader = new FileReader();

        reader.onload = (e) => {
            this.parentElement.innerHTML =
                `<img src="${e.target.result}" alt="Preview">`;
        };

        reader.readAsDataURL(file);

    });

});

