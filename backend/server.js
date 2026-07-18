const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

//this allows backend to receive JSON
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Campus Marketplace backend is running!");
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
}); 