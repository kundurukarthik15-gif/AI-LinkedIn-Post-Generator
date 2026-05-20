/**
 * Google Gemini — generates professional LinkedIn posts from user input.
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { config, getGeminiMissingKeys } = require('../config/env');
const {
  SYSTEM_PROMPT,
  buildUserPrompt,
  parseLinkedInResponse,
} = require('./postGenerationUtils');

function getModel() {
  const missing = getGeminiMissingKeys();
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }

  const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
  return genAI.getGenerativeModel({
    model: config.gemini.model,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      temperature: 0.7,
      responseMimeType: 'application/json',
    },
  });
}

/**
 * Generate LinkedIn post content using Google Gemini.
 * Retries up to 3 times on 503 (high demand) errors.
 */
async function generateLinkedInPost(input) {
  const model = getModel();
  const userPrompt = buildUserPrompt(input);

  const MAX_RETRIES = 3;
  let lastErr;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await model.generateContent(userPrompt);
      const raw = result.response.text();
      return parseLinkedInResponse(raw, 'Gemini', input);
    } catch (err) {
      const is503 = err.message?.includes('503') || err.status === 503;
      if (is503 && attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, attempt * 2000));
        continue;
      }
      lastErr = err;
      break;
    }
  }

  if (lastErr?.message?.includes('503')) {
    throw new Error('Gemini is experiencing high demand right now. Please try again in a moment.');
  }
  throw lastErr;
}

module.exports = {
  generateLinkedInPost,
};
