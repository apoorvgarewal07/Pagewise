const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./utils/firebase");
const uploadRoute = require("./routes/upload");
const chatRoute = require("./routes/chat");

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/upload", uploadRoute);
app.use("/api/chat", chatRoute);

// Health check (important for deployment)
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


app.get("/test", async (req, res) => {
  try {
    await db.collection("test").add({
      message: "Firebase working ✅",
      time: new Date()
    });

    res.send("Data added successfully");
  } catch (err) {
    res.status(500).send(err.message);
  }
});