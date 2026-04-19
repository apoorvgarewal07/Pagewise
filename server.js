const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const db = require("./utils/firebase");
const uploadRoute = require("./routes/upload");
const chatRoute = require("./routes/chat");

const app = express();

app.use(cors());
app.use(express.json());

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'pdf-chat-ai/client/build')));

// Routes
app.use("/api/upload", uploadRoute);
app.use("/api/chat", chatRoute);


// Health check (important for deployment)
app.get("/api", (req, res) => {
  res.send("Server is running 🚀");
});

// Catch all handler: send back React's index.html file for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'pdf-chat-ai/client/build/index.html'));
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;


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