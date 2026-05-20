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

const FALLBACK_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

function getClient() {
  const missing = getGeminiMissingKeys();
  if (missing.length > 0) throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  return new GoogleGenerativeAI(config.gemini.apiKey);
}

function getModel(modelName) {
  return getClient().getGenerativeModel({
    model: modelName,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: { temperature: 0.7, responseMimeType: 'application/json' },
  });
}

/**
 * Generate LinkedIn post content using Google Gemini.
 * Retries up to 3 times on 503 (high demand) errors.
 */
async function generateLinkedInPost(input) {
  const userPrompt = buildUserPrompt(input);
  const primaryModel = config.gemini.model || 'gemini-2.5-flash';
  const models = [primaryModel, ...FALLBACK_MODELS.filter((m) => m !== primaryModel)];

  let lastErr;
  for (const modelName of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const result = await getModel(modelName).generateContent(userPrompt);
        const raw = result.response.text();
        return parseLinkedInResponse(raw, 'Gemini', input);
      } catch (err) {
        const is503 = err.message?.includes('503') || err.status === 503;
        if (is503 && attempt === 1) {
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }
        lastErr = err;
        break;
      }
    }
  }

  throw new Error('All Gemini models are currently busy. Please try again in a minute.');
}

module.exports = {
  generateLinkedInPost,
};
