const express = require("express");
const path = require("path");
const db = require("./db");

const app = express();
const PORT = process.env.PORT;

//this allows backend to receive JSON
app.use(express.json());

//this provides frontend folder 'Relative' path
app.use(express.static(path.join(__dirname, "../frontend")));

//when you type http://localhost:3000/api/test you get to see message from backend
app.get("/api/test", (req, res) => {
  res.json({
    message: "Frontend successfully connected to backend!"
  });
});

//this shows homepage
app.get("/", (req, res) => {
  //res.send("Campus Marketplace backend is running!");
  res.sendFile(path.join(__dirname, "../frontend/html/index.html"));
});

// Example listings API
// app.get("/api/listings", (req, res) => {
//   const listings = [
//     {
//       listing_id: 1,
//       listing_title: "Used Java Textbook",
//       listing_description: "Good condition",
//       price: 25
//     },
//     {
//       listing_id: 2,
//       listing_title: "Desk Lamp",
//       listing_description: "Works perfectly",
//       price: 10
//     }
//   ];

//   res.json(listings);
// });

app.get("/api/listing", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        listing_id,
        listing_title,
        listing_description,
        price
      FROM Listing
      ORDER BY listing_id ASC
    `);

    res.json(rows);
  } catch (error) {
    console.error("Database error:", error);

    res.status(500).json({
      message: "Could not retrieve listings."
    });
  }
});


app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
}); 