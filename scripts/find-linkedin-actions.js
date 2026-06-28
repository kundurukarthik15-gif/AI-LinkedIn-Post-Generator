require('dotenv').config();
const axios = require('axios');

async function main() {
  const res = await axios.get('https://backend.composio.dev/api/v3/tools', {
    headers: { 'x-api-key': process.env.COMPOSIO_API_KEY },
    params: { limit: 5, page: 1, toolkit_slugs: 'linkedin' },
  });
  const items = res.data.items || [];
  // Print all keys of first item to understand structure
  console.log('First item keys:', Object.keys(items[0] || {}));
  console.log('First item:', JSON.stringify(items[0], null, 2));
}

main().catch((e) => console.error(e.response?.status, e.response?.data || e.message));
