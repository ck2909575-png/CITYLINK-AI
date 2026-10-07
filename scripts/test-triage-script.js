require('dotenv').config();
const { GoogleGenAI, Type } = require('@google/genai');

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

async function testTriage() {
  console.log('Testing generateContent with JSON mode...');
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: 'Triage this incident: Chemical spill and smoke on 5th street. Two cars collided.',
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            severity: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
            primary_agency: { type: Type.STRING, enum: ['POLICE', 'FIRE_DEPARTMENT', 'HEALTH_EMS', 'TRAFFIC_AUTHORITY', 'DISASTER_MANAGEMENT'] }
          },
          required: ['title', 'severity', 'primary_agency']
        }
      }
    });

    console.log('Response text:', response.text);
    const parsed = JSON.parse(response.text);
    console.log('Parsed successfully:', parsed);
  } catch (err) {
    console.error('Error during test:', err);
  }
}

testTriage();
