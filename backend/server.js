require("dotenv").config();
const express = require("express");
const path = require("node:path");
const authRoutes = require("./routes/auth");
const favoriteRoutes = require("./routes/favorite");
const listingRoutes = require("./routes/listing");
const messageRoutes = require("./routes/message");
const reportRoutes = require("./routes/report");
const reviewRoutes = require("./routes/review");
const userRoutes = require("./routes/user");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.disable("x-powered-by");
app.use(express.json({ limit: "24mb" }));
app.use(express.urlencoded({ extended: true, limit: "24mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/listing", listingRoutes);
app.use("/api/favorite", favoriteRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/report", reportRoutes);

app.get("/api/test", (req, res) => {
  res.json({ message: "Frontend successfully connected to backend!" });
});

app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/", (req, res) => {
  res.redirect("/html/index.html");
});

app.use((error, req, res, next) => {
  if (error.type === "entity.too.large") {
    return res.status(413).json({ message: "The request body is too large." });
  }

  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({ message: "The request body contains invalid JSON." });
  }

  console.error("Unhandled server error:", error);
  return res.status(500).json({ message: "An unexpected server error occurred." });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
