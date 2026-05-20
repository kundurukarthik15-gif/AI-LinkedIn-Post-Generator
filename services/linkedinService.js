/**
 * LinkedIn publishing via Composio REST API (no SDK).
 */
const axios = require('axios');
const { config, getComposioMissingKeys } = require('../config/env');

const COMPOSIO_BASE = 'https://backend.composio.dev/api/v2';

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
    userId: config.composio.userId,
    arguments: {
      author,
      lifecycleState: 'PUBLISHED',
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareMediaCategory: 'NONE',
          shareCommentary: { text: commentary },
          media: [
            {
              status: 'READY',
              originalUrl: draft.imageUrl || 'https://www.linkedin.com',
              ...(draft.imageUrl ? { title: { text: commentary.slice(0, 200) } } : {}),
            },
          ],
        },
      },
    },
  };

  let result;
  try {
    const response = await axios.post(
      `${COMPOSIO_BASE}/actions/LINKEDIN_CREATE_ARTICLE_OR_URL_SHARE/execute`,
      body,
      {
        headers: {
          'x-api-key': config.composio.apiKey,
          'Content-Type': 'application/json',
        },
      }
    );
    result = response.data;
  } catch (err) {
    const msg = err.response?.data?.message || err.response?.data?.error || err.message;
    throw new Error(msg || 'LinkedIn publish failed.');
  }

  if (result?.error || result?.successful === false) {
    throw new Error(JSON.stringify(result?.error) || 'LinkedIn publish failed.');
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
    const response = await axios.get(`${COMPOSIO_BASE}/connectedAccounts`, {
      headers: { 'x-api-key': config.composio.apiKey },
      params: {
        userIds: config.composio.userId,
        toolkitSlugs: 'linkedin',
      },
    });
    const items = response.data?.items || [];
    const active = items.filter((a) => a.status === 'ACTIVE');
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
    const msg = err.response?.data?.message || err.message;
    return { connected: false, mode: 'composio', message: msg };
  }
}

module.exports = {
  publishToLinkedIn,
  getLinkedInStatus,
};
