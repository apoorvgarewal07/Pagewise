const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./utils/firebase");
const uploadRoute = require("./routes/upload");
const chatRoute = require("./routes/chat");

const app = express();

// CORS — allow frontend origin
app.use(cors({
  origin: [
    "https://chat-with-pdf-ai-frontend.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001"
  ],
  methods: ["GET", "POST"],
  credentials: true
}));
app.use(express.json());

// Routes
app.use("/api/upload", uploadRoute);
app.use("/api/chat", chatRoute);

// Health check
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

app.get("/api", (req, res) => {
  res.send("Server is running 🚀");
});

// Test Firebase connection
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

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;