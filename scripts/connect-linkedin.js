/**
 * Run: npm run connect-linkedin
 * Opens OAuth to link LinkedIn to COMPOSIO_USER_ID (default: "default").
 */
require('dotenv').config();
const { exec } = require('child_process');
const { config, getComposioMissingKeys } = require('../config/env');

const AUTH_CONFIG_ID = process.env.COMPOSIO_LINKEDIN_AUTH_CONFIG_ID || 'ac_AAliAsDSTsH0';

async function main() {
  const missing = getComposioMissingKeys();
  if (missing.length) {
    console.error('Missing:', missing.join(', '));
    process.exit(1);
  }

  const { Composio } = require('@composio/core');
  const composio = new Composio({ apiKey: config.composio.apiKey });
  const userId = config.composio.userId;

  console.log(`\nLinking LinkedIn for Composio user/entity: "${userId}"\n`);

  const request = await composio.connectedAccounts.link(userId, AUTH_CONFIG_ID);
  const url = request.redirectUrl || request.redirect_url;

  if (!url) {
    console.log('Response:', JSON.stringify(request, null, 2));
    return;
  }

  console.log('1. Open this URL in your browser:\n');
  console.log(url);
  console.log('\n2. Sign in to LinkedIn and approve access.');
  console.log('3. When done, run: npm run check-linkedin\n');

  // Windows: try to open browser
  if (process.platform === 'win32') {
    exec(`start "" "${url}"`);
    console.log('(Browser should open automatically on Windows.)\n');
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
