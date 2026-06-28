/**
 * Central place to read environment variables.
 * Keeps server.js and services clean.
 */
require('dotenv').config();

function resolveAiProvider() {
  const explicit = (process.env.AI_PROVIDER || '').toLowerCase();
  if (explicit === 'gemini' || explicit === 'openai') {
    return explicit;
  }
  if (process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.OPENAI_API_KEY) return 'openai';
  return 'gemini';
}

const aiProvider = resolveAiProvider();

const config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  ai: {
    provider: aiProvider,
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  composio: {
    apiKey: process.env.COMPOSIO_API_KEY,
    userId: process.env.COMPOSIO_USER_ID || 'default',
    connectedAccountId: process.env.COMPOSIO_CONNECTED_ACCOUNT_ID || '',
    linkedinAuthConfigId: process.env.COMPOSIO_LINKEDIN_AUTH_CONFIG_ID || 'ac_AAliAsDSTsH0',
    linkedinToolkitVersion: process.env.LINKEDIN_TOOLKIT_VERSION || 'latest',
    authorUrn: process.env.LINKEDIN_AUTHOR_URN || '',
  },

  mockLinkedInPublish: process.env.MOCK_LINKEDIN_PUBLISH === 'true',
};

function getGeminiMissingKeys() {
  const missing = [];
  if (!config.gemini.apiKey) missing.push('GEMINI_API_KEY');
  return missing;
}

function getOpenAiMissingKeys() {
  const missing = [];
  if (!config.openai.apiKey) missing.push('OPENAI_API_KEY');
  return missing;
}

/** Missing keys for the active AI provider (generate-post). */
function getAiMissingKeys() {
  if (config.ai.provider === 'gemini') return getGeminiMissingKeys();
  return getOpenAiMissingKeys();
}

/** @deprecated Use getAiMissingKeys */
function getMissingKeys() {
  return getAiMissingKeys();
}

function getCloudinaryMissingKeys() {
  const missing = [];
  if (!config.cloudinary.cloudName) missing.push('CLOUDINARY_CLOUD_NAME');
  if (!config.cloudinary.apiKey) missing.push('CLOUDINARY_API_KEY');
  if (!config.cloudinary.apiSecret) missing.push('CLOUDINARY_API_SECRET');
  return missing;
}

function getComposioMissingKeys() {
  const missing = [];
  if (!config.composio.apiKey) missing.push('COMPOSIO_API_KEY');
  return missing;
}

module.exports = {
  config,
  getAiMissingKeys,
  getGeminiMissingKeys,
  getOpenAiMissingKeys,
  getMissingKeys,
  getCloudinaryMissingKeys,
  getComposioMissingKeys,
};
