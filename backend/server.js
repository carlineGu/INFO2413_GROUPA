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
  //res.send("Campus Marketplace backend is running!");
  res.sendFile(path.join(__dirname, "../frontend/html/index.html"));
});


app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});


