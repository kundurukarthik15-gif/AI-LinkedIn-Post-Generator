/**
 * Shared prompts and response parsing for AI post generation.
 */
const SYSTEM_PROMPT = `You are an expert LinkedIn content writer.
Create engaging, professional LinkedIn posts for developers and tech professionals.

Rules:
- Use a confident, authentic, professional tone
- Include line breaks for readability (short paragraphs)
- Add 1-2 relevant emojis maximum (optional, not excessive)
- End with a light call-to-action when appropriate
- Generate 5-8 relevant hashtags (mix of broad and niche)
- Keep total post under 2800 characters
- Do NOT use markdown headers or bullet syntax that LinkedIn does not render well

Respond ONLY with valid JSON in this exact shape:
{
  "content": "main post body without hashtags",
  "hashtags": ["#Tag1", "#Tag2"],
  "formattedPost": "full post ready to copy-paste including hashtags at the end"
}`;

function buildUserPrompt({ achievement, project, certificate, event }) {
  const parts = [];
  if (achievement) parts.push(`Achievement: ${achievement}`);
  if (project) parts.push(`Project: ${project}`);
  if (certificate) parts.push(`Certificate: ${certificate}`);
  if (event) parts.push(`Event: ${event}`);

  if (parts.length === 0) {
    throw new Error('Provide at least one of: achievement, project, certificate, or event.');
  }

  return `Write a LinkedIn post based on this information:\n\n${parts.join('\n')}`;
}

function parseLinkedInResponse(raw, providerName, input) {
  if (!raw) {
    throw new Error(`${providerName} returned an empty response.`);
  }

  let text = raw.trim();
  // Strip markdown code fences if the model wraps JSON
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`${providerName} returned invalid JSON. Please try again.`);
  }

  if (!parsed.content || !parsed.hashtags) {
    throw new Error(`${providerName} response missing required fields (content, hashtags).`);
  }

  const hashtags = Array.isArray(parsed.hashtags)
    ? parsed.hashtags.map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))
    : [];

  const formattedPost =
    parsed.formattedPost ||
    `${parsed.content.trim()}\n\n${hashtags.join(' ')}`.trim();

  return {
    content: parsed.content.trim(),
    hashtags,
    formattedPost: formattedPost.trim(),
    input,
    provider: providerName,
  };
}

module.exports = {
  SYSTEM_PROMPT,
  buildUserPrompt,
  parseLinkedInResponse,
};
