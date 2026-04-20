const { GoogleGenAI } = require("@google/genai");

let ai = null;

try {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "missing",
  });
} catch (error) {
  console.error("Failed to initialize Gemini API. Make sure GEMINI_API_KEY is set.", error.message);
}

module.exports = ai;
