/**
 * OpenAI — generates professional LinkedIn posts (optional provider).
 */
const OpenAI = require('openai');
const { config, getOpenAiMissingKeys } = require('../config/env');
const {
  SYSTEM_PROMPT,
  buildUserPrompt,
  parseLinkedInResponse,
} = require('./postGenerationUtils');

function getClient() {
  const missing = getOpenAiMissingKeys();
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
  return new OpenAI({ apiKey: config.openai.apiKey });
}

/**
 * Generate LinkedIn post content using OpenAI.
 */
async function generateLinkedInPost(input) {
  const client = getClient();
  const userPrompt = buildUserPrompt(input);

  const response = await client.chat.completions.create({
    model: config.openai.model,
    temperature: 0.7,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
  });

  const raw = response.choices[0]?.message?.content;
  return parseLinkedInResponse(raw, 'OpenAI', input);
}

module.exports = {
  generateLinkedInPost,
};
