function updateSubcategories() {

    const category =
        document.getElementById("category").value;

    const sub =
        document.getElementById("subcategory");

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

    const defaultOption =
        document.createElement("option");

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

function publishListing() {
    alert("Listing Published!");
}





document.querySelectorAll('.photo-upload input').forEach(input => {

    input.addEventListener('change', function () {

        const file = this.files[0];

        if (!file) return;

        const reader = new FileReader();

        reader.onload = (e) => {
            this.parentElement.innerHTML =
            `${e.target.result}`;
        };

        reader.readAsDataURL(file);

    });

});