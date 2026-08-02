const express = require("express");
const path = require("path");
const db = require("./db");
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/message");
const userRoutes = require("./routes/user");
const listingRoutes = require("./routes/listing");
const favoriteRoutes = require("./routes/favorite");

const app = express();
const PORT = process.env.PORT;
require("dotenv").config();
const nodemailer = require("nodemailer");



// console.log("EMAIL_USER:", process.env.EMAIL_USER);
// console.log("EMAIL_PASSWORD loaded:", Boolean(process.env.EMAIL_PASSWORD));



//this allows backend to receive JSON
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/listing", listingRoutes);
app.use("/api/favorite", favoriteRoutes);

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
  res.redirect("/html/index.html");
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




app.get("/api/test-email", async (req, res) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: "nukhet.tuncbilek@kpu.ca",
      subject: "Campus Marketplace test email",
      text: "The backend successfully sent this email."
    });

    res.json({
      message: "Test email sent successfully."
    });
  } catch (error) {
    console.error("Email error:", error);

    res.status(500).json({
      message: "Email could not be sent.",
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});