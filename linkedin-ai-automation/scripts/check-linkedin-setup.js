
/**
 * Run: node scripts/check-linkedin-setup.js
 * Verifies Composio + LinkedIn before real publishing.
 */
require('dotenv').config();
const { config } = require('../config/env');
const { getLinkedInStatus } = require('../services/linkedinService');

const PROFILE_TOOLS = [
  'LINKEDIN_GET_MY_INFO',
  'LINKEDIN_GET_PERSON',
  'LINKEDIN_GET_USER_INFO',
];

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

async function tryTool(composio, slug) {
    const opts = {
      userId: config.composio.userId,
      version: config.composio.linkedinToolkitVersion,
      arguments: {},
    };
    if (config.composio.connectedAccountId) {
      opts.connectedAccountId = config.composio.connectedAccountId;
    }
    const result = await composio.tools.execute(slug, opts);

  if (result?.successful === false || result?.error) {
    throw new Error(result.error || `Tool ${slug} returned unsuccessful`);
  }

  const id = extractPersonId(result?.data ?? result);
  return { slug, id, raw: result?.data ?? result };
}

async function main() {
  console.log('--- LinkedIn setup check ---\n');
  console.log('MOCK_LINKEDIN_PUBLISH:', config.mockLinkedInPublish);
  console.log('COMPOSIO_USER_ID:', config.composio.userId);
  console.log('LINKEDIN_TOOLKIT_VERSION:', config.composio.linkedinToolkitVersion);
  const status = await getLinkedInStatus();
  console.log('Status:', JSON.stringify(status, null, 2));

  if (!status.connected && status.mode === 'composio') {
    console.log('\n>>> Run: npm run connect-linkedin');
    console.log('>>> Then complete LinkedIn login in the browser.\n');
    return;
  }

  if (config.mockLinkedInPublish) {
    console.log('\nSet MOCK_LINKEDIN_PUBLISH=false in .env for real posts.');
    return;
  }

  if (!config.composio.apiKey) {
    console.log('\nMissing COMPOSIO_API_KEY.');
    return;
  }

  const { Composio } = require('@composio/core');
  const composio = new Composio({ apiKey: config.composio.apiKey });

  for (const slug of PROFILE_TOOLS) {
    try {
      console.log(`\nTrying ${slug}...`);
      const { id, raw } = await tryTool(composio, slug);
      if (id) {
        console.log('\n✓ LinkedIn connected. Add to .env:');
        console.log(`LINKEDIN_AUTHOR_URN=urn:li:person:${id}`);
        return;
      }
      console.log('Response (no id found):', JSON.stringify(raw, null, 2).slice(0, 500));
    } catch (err) {
      console.log(`✗ ${slug}:`, err.message);
      if (err.cause) console.log('  cause:', err.cause);
      if (err.response?.data) {
        console.log('  details:', JSON.stringify(err.response.data).slice(0, 400));
      }
    }
  }

  console.log(`
---
Could not fetch your LinkedIn profile via Composio.

Do this:
1. Open https://platform.composio.dev
2. Connected accounts → remove LinkedIn → connect again
3. Use the SAME project as COMPOSIO_API_KEY in .env
4. COMPOSIO_USER_ID must match (currently: ${config.composio.userId})
5. Approve all permissions (especially "post" / w_member_social)
6. Run: npm run check-linkedin

If still failing, in Composio dashboard run LINKEDIN_GET_MY_INFO manually
and paste the person id into .env as LINKEDIN_AUTHOR_URN=urn:li:person:YOUR_ID
`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
