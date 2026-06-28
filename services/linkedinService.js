/**
 * LinkedIn publishing via Composio v3 SDK.
 */
const { Composio } = require('@composio/core');
const { config, getComposioMissingKeys } = require('../config/env');

const PUBLISH_TOOL = 'LINKEDIN_CREATE_LINKED_IN_POST';
const PROFILE_TOOLS = [
  'LINKEDIN_GET_MY_INFO',
  'LINKEDIN_GET_PERSON',
  'LINKEDIN_GET_USER_INFO',
];

let composioClient = null;

function getComposio() {
  if (!composioClient) {
    composioClient = new Composio({
      apiKey: config.composio.apiKey,
      toolkitVersions: {
        linkedin: config.composio.linkedinToolkitVersion,
      },
    });
  }
  return composioClient;
}

function buildExecuteOptions(toolArguments) {
  const opts = {
    userId: config.composio.userId,
    version: config.composio.linkedinToolkitVersion,
    arguments: toolArguments,
  };
  if (config.composio.connectedAccountId) {
    opts.connectedAccountId = config.composio.connectedAccountId;
  }
  return opts;
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

function extractPersonId(data) {
  if (!data) return null;
  const nested = data.data ?? data;
  return (
    nested.id ||
    nested.sub ||
    nested.personId ||
    nested.data?.id ||
    nested.data?.sub
  );
}

async function resolveAuthorUrn(composio) {
  const configured = normalizeAuthorUrn(config.composio.authorUrn);
  if (configured) return configured;

  for (const slug of PROFILE_TOOLS) {
    try {
      const result = await composio.tools.execute(slug, buildExecuteOptions({}));
      if (result?.successful === false || result?.error) continue;
      const id = extractPersonId(result?.data ?? result);
      if (id) return normalizeAuthorUrn(id);
    } catch {
      // try next profile tool
    }
  }

  return null;
}

function formatToolError(err, result) {
  if (result?.error) {
    return typeof result.error === 'string' ? result.error : JSON.stringify(result.error);
  }
  const nested = err?.error?.error?.message || err?.error?.message;
  if (nested) return nested;
  return err?.message || 'LinkedIn publish failed.';
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

  const composio = getComposio();
  const author = await resolveAuthorUrn(composio);
  if (!author) {
    throw new Error(
      'Could not resolve LinkedIn author URN. Set LINKEDIN_AUTHOR_URN in Render env vars or run npm run check-linkedin locally.'
    );
  }

  const toolArguments = {
    author,
    commentary,
    visibility: 'PUBLIC',
    lifecycleState: 'PUBLISHED',
  };

  if (draft.imageUrl) {
    toolArguments.images = [draft.imageUrl];
  }

  try {
    const result = await composio.tools.execute(
      PUBLISH_TOOL,
      buildExecuteOptions(toolArguments)
    );

    if (result?.error || result?.successful === false) {
      throw new Error(formatToolError(null, result));
    }

    return {
      mock: false,
      data: result?.data ?? result,
      author,
      publishedAt: new Date().toISOString(),
    };
  } catch (err) {
    throw new Error(formatToolError(err));
  }
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
    const response = await composio.connectedAccounts.list({
      userIds: [config.composio.userId],
      toolkitSlugs: ['linkedin'],
    });
    const items = response?.items || [];
    const active = items.filter((a) => a.status === 'ACTIVE');
    if (active.length > 0) {
      return {
        connected: true,
        mode: 'composio',
        userId: config.composio.userId,
        connectedAccountId: active[0].id,
        toolkitVersion: config.composio.linkedinToolkitVersion,
        message: 'LinkedIn is connected for this user. Ready to publish.',
      };
    }
    return { connected: false, mode: 'composio', message: 'No active LinkedIn connection.' };
  } catch (err) {
    return { connected: false, mode: 'composio', message: formatToolError(err) };
  }
}

module.exports = {
  publishToLinkedIn,
  getLinkedInStatus,
};
