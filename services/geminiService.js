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
 */
async function generateLinkedInPost(input) {
  const model = getModel();
  const userPrompt = buildUserPrompt(input);

  const result = await model.generateContent(userPrompt);
  const raw = result.response.text();

  return parseLinkedInResponse(raw, 'Gemini', input);
}

module.exports = {
  generateLinkedInPost,
};
