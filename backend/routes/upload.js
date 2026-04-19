const express = require("express");
const multer = require("multer");
const { PDFParse } = require("pdf-parse");

const splitText = require("../utils/chunk");
const ai = require("../utils/gemini");
const store = require("../store");

const router = express.Router();
const upload = multer();

router.post("/", upload.single("file"), async (req, res) => {
  try {
    const parser = new PDFParse(new Uint8Array(req.file.buffer));
    const data = await parser.getText();

    // Split text
    const chunks = splitText(data.text);

    // Create embeddings in batches to avoid rate limits
    const embeddings = [];
    const batchSize = 100;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const response = await ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: batch,
      });
      embeddings.push(...response.embeddings.map(emb => emb.values));
    }

    store.chunks = chunks;
    store.embeddings = embeddings;

    res.json({ message: "PDF processed successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;