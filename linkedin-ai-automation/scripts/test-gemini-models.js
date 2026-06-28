require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const models = [
  'gemini-2.5-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-2.0-flash',
];
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function tryModel(name) {
  try {
    const model = genAI.getGenerativeModel({
      model: name,
      generationConfig: { responseMimeType: 'application/json' },
    });
    await model.generateContent('Reply with JSON: {"ok":true}');
    console.log(`${name}: OK`);
    return true;
  } catch (e) {
    const msg = e.message || String(e);
    console.log(`${name}: ${msg.includes('429') ? 'QUOTA' : msg.slice(0, 100)}`);
    return false;
  }
}

(async () => {
  for (const m of models) {
    await tryModel(m);
  }
})();
