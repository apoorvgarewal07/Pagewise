const pdfParse = require("pdf-parse");
const splitText = require("../utils/chunk");
const getEmbedding = require("../utils/embedding");
const store = require("../store");

exports.uploadPDF = async (req, res) => {
  try {
    const data = await pdfParse(req.file.buffer);
    const chunks = splitText(data.text);

    const embeddings = [];
    for (let chunk of chunks) {
      const emb = await getEmbedding(chunk);
      embeddings.push(emb);
    }

    store.chunks = chunks;
    store.embeddings = embeddings;

    res.json({ message: "PDF processed successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};