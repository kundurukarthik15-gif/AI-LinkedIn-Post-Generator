/**
 * LinkedIn publishing via Composio (MCP-compatible toolkit).
 * Never publishes without explicit confirmation — that check lives in the controller.
 */
const { Composio } = require('@composio/core');
const { config, getComposioMissingKeys } = require('../config/env');

let composioClient = null;

/** Build options for composio.tools.execute (user + optional connected account). */
function buildExecuteOptions(argumentsPayload) {
  const opts = {
    userId: config.composio.userId,
    version: config.composio.linkedinToolkitVersion,
    arguments: argumentsPayload,
  };
  if (config.composio.connectedAccountId) {
    opts.connectedAccountId = config.composio.connectedAccountId;
  }
  return opts;
}

function getComposio() {
  if (config.mockLinkedInPublish) {
    return null;
  }

  const missing = getComposioMissingKeys();
  if (missing.length > 0) {
    throw new Error(`Missing Composio environment variables: ${missing.join(', ')}`);
  }

  if (!composioClient) {
    composioClient = new Composio({ apiKey: config.composio.apiKey });
  }
  return composioClient;
}

/**
 * Resolve LinkedIn author URN (person ID) for posting.
 */
function normalizeAuthorUrn(value) {
  const urn = (value || '').trim();
  if (!urn) return null;
  if (urn.startsWith('http://') || urn.startsWith('https://')) {
    throw new Error(
      'LINKEDIN_AUTHOR_URN must be urn:li:person:YOUR_ID (from Composio LINKEDIN_GET_MY_INFO), not a profile URL.'
    );
  }
  if (urn.startsWith('urn:li:person:')) return urn;
  if (urn.startsWith('urn:li:')) return urn;
  return `urn:li:person:${urn}`;
}

async function resolveAuthorUrn() {
  if (config.composio.authorUrn) {
    return normalizeAuthorUrn(config.composio.authorUrn);
  }

  const composio = getComposio();
  const result = await composio.tools.execute(
    'LINKEDIN_GET_MY_INFO',
    buildExecuteOptions({})
  );

  const data = result?.data ?? result;
  const id =
    data?.id ||
    data?.sub ||
    data?.data?.id ||
    data?.data?.sub;

  if (!id) {
    throw new Error(
      'Could not resolve LinkedIn author ID. Set LINKEDIN_AUTHOR_URN in .env or connect LinkedIn in Composio.'
    );
  }

  return `urn:li:person:${id}`;
}

/**
 * Build full commentary text (content + hashtags + optional image note).
 */
function buildCommentary(draft) {
  const hashtagLine = (draft.hashtags || []).join(' ');
  let text = draft.content.trim();
  if (hashtagLine) {
    text = `${text}\n\n${hashtagLine}`;
  }
  return text.slice(0, 3000);
}

/**
 * Publish a confirmed draft to LinkedIn using Composio.
 */
async function publishToLinkedIn(draft) {
  const commentary = buildCommentary(draft);

  if (config.mockLinkedInPublish) {
    return {
      mock: true,
      message: 'Mock publish successful (MOCK_LINKEDIN_PUBLISH=true)',
      commentary,
      imageUrl: draft.imageUrl || null,
      publishedAt: new Date().toISOString(),
    };
  }

  const composio = getComposio();
  const author = await resolveAuthorUrn();

  const argumentsPayload = {
    author,
    commentary,
    visibility: 'PUBLIC',
    lifecycleState: 'PUBLISHED',
  };

  // Attach image if Cloudinary URL is available (Composio uploads to LinkedIn)
  if (draft.imageUrl) {
    argumentsPayload.images = [draft.imageUrl];
  }

  const result = await composio.tools.execute(
    'LINKEDIN_CREATE_LINKED_IN_POST',
    buildExecuteOptions(argumentsPayload)
  );

  if (result?.error || result?.successful === false) {
    throw new Error(result?.error || 'LinkedIn publish failed via Composio.');
  }

  return {
    mock: false,
    data: result?.data ?? result,
    author,
    publishedAt: new Date().toISOString(),
  };
}

/**
 * Check whether Composio/LinkedIn is configured (for status endpoint).
 */
async function getLinkedInStatus() {
  if (config.mockLinkedInPublish) {
    return { connected: true, mode: 'mock', message: 'Running in mock publish mode.' };
  }

  const missing = getComposioMissingKeys();
  if (missing.length > 0) {
    return {
      connected: false,
      mode: 'unconfigured',
      missing,
      message: 'Add COMPOSIO_API_KEY and connect LinkedIn at https://platform.composio.dev',
    };
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

    return {
      connected: false,
      mode: 'composio',
      userId: config.composio.userId,
      message:
        `No LinkedIn connection for user "${config.composio.userId}". Run: npm run connect-linkedin`,
    };
  } catch (err) {
    return {
      connected: false,
      mode: 'composio',
      message: err.message || 'Could not verify LinkedIn connection.',
    };
  }
}

module.exports = {
  publishToLinkedIn,
  getLinkedInStatus,
};
