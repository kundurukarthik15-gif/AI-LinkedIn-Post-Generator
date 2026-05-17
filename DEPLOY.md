# Deploy & Post to LinkedIn

## Real LinkedIn posts (local)

1. Connect LinkedIn at [Composio Dashboard](https://platform.composio.dev) → **Connected accounts**.
2. In `.env` set:
   ```env
   MOCK_LINKEDIN_PUBLISH=false
   COMPOSIO_API_KEY=your_key
   COMPOSIO_USER_ID=default
   ```
3. Check setup:
   ```bash
   node scripts/check-linkedin-setup.js
   ```
4. Start app: `npm start` → http://localhost:3000
5. Generate → Preview → **Yes, publish** → check your LinkedIn profile.

## Deploy on Render (recommended)

1. Push project to GitHub (**do not commit `.env`**).
2. [render.com](https://render.com) → **New +** → **Blueprint** or **Web Service**.
3. Connect repo; root folder: `linkedin-ai-automation` (if repo root is parent, set root directory).
4. **Build:** `npm install` | **Start:** `npm start`
5. Add environment variables (same as `.env`):

   | Variable | Example |
   |----------|---------|
   | `NODE_ENV` | `production` |
   | `AI_PROVIDER` | `gemini` |
   | `GEMINI_API_KEY` | from Google AI Studio |
   | `GEMINI_MODEL` | `gemini-2.5-flash` |
   | `CLOUDINARY_CLOUD_NAME` | from dashboard |
   | `CLOUDINARY_API_KEY` | from dashboard |
   | `CLOUDINARY_API_SECRET` | from dashboard |
   | `COMPOSIO_API_KEY` | from Composio |
   | `COMPOSIO_USER_ID` | `default` |
   | `MOCK_LINKEDIN_PUBLISH` | `false` |
   | `LINKEDIN_TOOLKIT_VERSION` | `20260424_00` |

6. Deploy → open `https://your-app.onrender.com`

## Deploy on Railway

1. [railway.app](https://railway.app) → New Project → Deploy from GitHub.
2. Set start command: `npm start`
3. Variables → paste all keys from `.env`.
4. Generate domain in **Settings** → **Networking**.

## After deploy

- Composio LinkedIn connection is per `COMPOSIO_USER_ID` — same key works on Render.
- Always use **HTTPS** URL.
- Rotate any API key that was ever shared in chat.

## Troubleshooting publish

| Issue | Fix |
|-------|-----|
| Mock message in response | Set `MOCK_LINKEDIN_PUBLISH=false` and redeploy |
| Not connected | Reconnect LinkedIn in Composio |
| Author URN error | Run `node scripts/check-linkedin-setup.js` and set `LINKEDIN_AUTHOR_URN` |
