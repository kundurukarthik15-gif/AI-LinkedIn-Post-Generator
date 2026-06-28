require('dotenv').config();
const { Composio } = require('@composio/core');

async function main() {
  const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });
  const tools = await composio.tools.getRawComposioTools({ toolkits: ['linkedin'] });
  const items = Array.isArray(tools) ? tools : (tools.items || tools.tools || []);
  const tool = items.find(t => t.slug === 'LINKEDIN_CREATE_ARTICLE_OR_URL_SHARE');
  const params = tool?.inputParameters || tool?.parameters || tool?.input_schema;
  process.stdout.write(JSON.stringify(params, null, 2) + '\n');
}

main().catch(e => process.stdout.write(e.message + '\n'));
