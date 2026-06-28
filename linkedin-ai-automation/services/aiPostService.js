/**
 * Routes post generation to Gemini or OpenAI based on AI_PROVIDER in .env.
 */
const { config, getAiMissingKeys } = require('../config/env');
const geminiService = require('./geminiService');
const openaiService = require('./openaiService');

async function generateLinkedInPost(input) {
  const missing = getAiMissingKeys();
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }

  if (config.ai.provider === 'gemini') {
    return geminiService.generateLinkedInPost(input);
  }

  return openaiService.generateLinkedInPost(input);
}

module.exports = {
  generateLinkedInPost,
};
