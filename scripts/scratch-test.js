require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  try {
    const res = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: 'hello world'
    });
    console.log('Success');
  } catch (err) {
    console.error('Error:', err.message);
  }
}
test();
