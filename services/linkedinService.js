/**
 * LinkedIn publishing via Composio REST API.
 */
const axios = require('axios');
const { Composio } = require('@composio/core');
const { config, getComposioMissingKeys } = require('../config/env');

let composioClient = null;

function getComposio() {
  if (!composioClient) {
    composioClient = new Composio({ apiKey: config.composio.apiKey });
  }
  return composioClient;
}

function normalizeAuthorUrn(value) {
  const urn = (value || '').trim();
  if (!urn) return null;
  if (urn.startsWith('http://') || urn.startsWith('https://')) {
    throw new Error('LINKEDIN_AUTHOR_URN must be urn:li:person:YOUR_ID, not a profile URL.');
  }
  if (urn.startsWith('urn:li:')) return urn;
  return `urn:li:person:${urn}`;
}

function buildCommentary(draft) {
  const hashtagLine = (draft.hashtags || []).join(' ');
  let text = draft.content.trim();
  if (hashtagLine) text = `${text}\n\n${hashtagLine}`;
  return text.slice(0, 3000);
}

async function publishToLinkedIn(draft) {
  const commentary = buildCommentary(draft);

  if (config.mockLinkedInPublish) {
    return {
      mock: true,
      message: 'Mock publish successful (MOCK_LINKEDIN_PUBLISH=true)',
      commentary,
      publishedAt: new Date().toISOString(),
    };
  }

  const missing = getComposioMissingKeys();
  if (missing.length > 0) throw new Error(`Missing: ${missing.join(', ')}`);

  const author = normalizeAuthorUrn(config.composio.authorUrn);
  if (!author) throw new Error('LINKEDIN_AUTHOR_URN is required. Set it in environment variables.');

  const body = {
    entityId: config.composio.userId,
    input: {
      author,
      commentary,
      visibility: 'PUBLIC',
      lifecycleState: 'PUBLISHED',
    },
  };

  if (draft.imageUrl) body.input.images = [draft.imageUrl];

  let res;
  try {
    res = await axios.post(
      'https://backend.composio.dev/api/v2/actions/LINKEDIN_CREATE_LINKED_IN_POST/execute',
      body,
      {
        headers: {
          'x-api-key': config.composio.apiKey,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (err) {
    const detail = err.response?.data;
    throw new Error(JSON.stringify(detail) || err.message);
  }

  const result = res.data;
  if (result?.error || result?.successful === false) {
    throw new Error(result?.error || 'LinkedIn publish failed.');
  }

  return {
    mock: false,
    data: result?.data ?? result,
    author,
    publishedAt: new Date().toISOString(),
  };
}

async function getLinkedInStatus() {
  if (config.mockLinkedInPublish) {
    return { connected: true, mode: 'mock', message: 'Running in mock publish mode.' };
  }

  const missing = getComposioMissingKeys();
  if (missing.length > 0) {
    return { connected: false, mode: 'unconfigured', missing, message: 'Add COMPOSIO_API_KEY.' };
  }

  try {
    const composio = getComposio();
    const list = await composio.connectedAccounts.list({
      userIds: [config.composio.userId],
      toolkitSlugs: ['linkedin'],
    });
    const active = (list.items || []).filter((a) => a.status === 'ACTIVE');
    if (active.length > 0) {
      return {
        connected: true,
        mode: 'composio',
        userId: config.composio.userId,
        connectedAccountId: active[0].id,
        message: 'LinkedIn is connected for this user. Ready to publish.',
      };
    }
    return { connected: false, mode: 'composio', message: 'No active LinkedIn connection.' };
  } catch (err) {
    return { connected: false, mode: 'composio', message: err.message };
  }
}

module.exports = {
  publishToLinkedIn,
  getLinkedInStatus,
};
