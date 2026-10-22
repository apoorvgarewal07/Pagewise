const express = require("express");

const ai = require("../utils/gemini");
const cosineSimilarity = require("../utils/similarity");
const store = require("../store");
const db = require("../utils/firebase");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { question } = req.body;

    // Embed question
    const qRes = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: question,
    });

    const queryEmbedding = qRes.embeddings[0].values;

    // Find best chunks
    let scores = store.embeddings.map((emb, i) => ({
      score: cosineSimilarity(queryEmbedding, emb),
      text: store.chunks[i],
    }));

    scores.sort((a, b) => b.score - a.score);

    const context = scores.slice(0, 3).map(s => s.text).join("\n");

    // Ask AI
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Context:\n${context}\n\nQ: ${question}`,
      config: {
        systemInstruction: "Answer only from context",
      }
    });

    const answer = response.text;

    // Store in Firestore (if Firebase is configured)
    if (db) {
      await db.collection("chats").add({
        question,
        answer,
        timestamp: new Date()
      });
    }

    res.json({ answer });

  } catch (err) {
    console.error("Chat API Error:", err);
    if (err.status === 429) {
      res.status(429).json({ error: "Rate limit exceeded. Please wait a minute before sending another message." });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

module.exports = router;