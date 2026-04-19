const getEmbedding = require("../utils/embedding");
const cosineSimilarity = require("../utils/similarity");
const openai = require("../utils/openai");
const store = require("../store");

exports.chatWithPDF = async (req, res) => {
  try {
    const { question } = req.body;

    const queryEmbedding = await getEmbedding(question);

    let scores = store.embeddings.map((emb, i) => ({
      score: cosineSimilarity(queryEmbedding, emb),
      text: store.chunks[i],
    }));

    scores.sort((a, b) => b.score - a.score);

    const context = scores.slice(0, 3).map(s => s.text).join("\n");

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Answer only from context" },
        { role: "user", content: `Context:\n${context}\n\nQ: ${question}` }
      ],
    });

    res.json({ answer: response.choices[0].message.content });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};