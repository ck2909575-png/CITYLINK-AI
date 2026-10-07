require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

async function main() {
  console.log('Sending prompt to Gemini...');
  const prompt = `You are the UrbanShield Autonomous Emergency Triage & Vision Intelligence Core.
Evaluate this incident:
Description: Multi-vehicle collision on highway with heavy fuel spill and fire.
Respond with ONLY valid JSON with this exact schema:
{
  "title": "Concise headline",
  "domain": "TRAFFIC_ACCIDENT",
  "severity": "CRITICAL",
  "primary_agency": "FIRE_DEPARTMENT",
  "confidence_score": 0.95,
  "hazard_perimeter_meters": 150,
  "key_hazards_detected": ["fuel spill", "active flames"],
  "citizen_advisory": "Stay back 150m and avoid breathing smoke.",
  "responder_tactical_brief": "Deploy foam and secure perimeter.",
  "traffic_vms_text": "HIGHWAY CLOSED - HAZMAT ACCIDENT - DETOUR"
}`;

  const res = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt
  });

  console.log('Gemini Response:');
  console.log(res.text);
}

main().catch(console.error);
