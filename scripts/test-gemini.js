require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const apiKey = process.env.GEMINI_API_KEY || '';

async function testGemini() {
  console.log('Testing Gemini API with @google/genai...');
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Respond with a simple JSON object: {"status": "ok", "message": "UrbanShield online"}',
    });
    console.log('Response text:', response.text);
  } catch (err) {
    console.error('Gemini error:', err.message);
    if (err.status) console.error('Status:', err.status);
    if (err.errorDetails) console.error('Details:', err.errorDetails);
  }
}

testGemini();
