# AI LinkedIn Automation Assistant

An AI-powered LinkedIn automation system built with **Node.js**, **Express**, **OpenAI**, **Cloudinary**, and **Composio (MCP)**. It generates professional posts, uploads images, shows a preview, and only publishes after explicit user confirmation.

## Features

- **AI post generator** — Turn achievements, projects, certificates, or events into polished LinkedIn copy
- **Automatic hashtags** — OpenAI returns 5–8 relevant hashtags
- **Image uploads** — Multer + Cloudinary for public image URLs
- **Preview-first workflow** — Never publishes without confirmation
- **LinkedIn publishing** — Composio toolkit (`LINKEDIN_CREATE_LINKED_IN_POST`)
- **Simple web UI** — Generate, preview, confirm, publish from the browser
- **Modular architecture** — Routes, controllers, and services separated for clarity

## Workflow

```
User input (achievement / project / certificate / event)
        ↓
OpenAI generates post + hashtags
        ↓
(Optional) Cloudinary uploads image
        ↓
Preview shown — "Do you want to publish?"
        ↓
User confirms (confirmed: true)
        ↓
Composio publishes to LinkedIn
```

## Project structure

```
linkedin-ai-automation/
├── server.js                 # Express entry point
├── config/env.js             # Environment config
├── routes/postRoutes.js      # API routes
├── controllers/postController.js
├── services/
│   ├── openaiService.js      # Post generation
│   ├── cloudinaryService.js  # Image upload
│   ├── linkedinService.js    # Composio / LinkedIn
│   └── draftStore.js         # Preview drafts (in-memory)
├── middleware/
│   ├── upload.js             # Multer
│   └── errorHandler.js
├── uploads/                  # Temporary files
├── public/                   # Frontend UI
├── .env.example
├── package.json
└── README.md
```

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [OpenAI API key](https://platform.openai.com/api-keys)
- [Cloudinary account](https://cloudinary.com/)
- [Composio account](https://platform.composio.dev/) (for LinkedIn publishing)

### Steps

1. **Clone or open the project**

   ```bash
   cd linkedin-ai-automation
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   ```bash
   copy .env.example .env
   ```

   Edit `.env` and add your keys:

   | Variable | Description |
   |----------|-------------|
   | `OPENAI_API_KEY` | OpenAI API key |
   | `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
   | `CLOUDINARY_API_KEY` | Cloudinary API key |
   | `CLOUDINARY_API_SECRET` | Cloudinary API secret |
   | `COMPOSIO_API_KEY` | Composio API key |
   | `COMPOSIO_USER_ID` | Composio user/session ID (default: `default`) |
   | `MOCK_LINKEDIN_PUBLISH` | Set `true` to test without LinkedIn |

4. **Start the server**

   ```bash
   npm start
   ```

5. **Open the UI**

   Visit [http://localhost:3000](http://localhost:3000)

## Composio + LinkedIn setup (MCP)

1. Sign up at [Composio](https://platform.composio.dev/)
2. Create a project and copy your **API key** into `.env`
3. Connect **LinkedIn** for your `COMPOSIO_USER_ID`:
   - Dashboard → Connected accounts → Add LinkedIn (OAuth)
4. Optional: run `LINKEDIN_GET_MY_INFO` in Composio to find your person ID, then set:

   ```env
   LINKEDIN_AUTHOR_URN=urn:li:person:YOUR_ID
   ```

### MCP in Cursor

You can also use Composio’s LinkedIn MCP server in Cursor for agent-driven posting:

- Docs: [Composio LinkedIn MCP](https://mcp.composio.dev/linkedin)
- This backend uses the same LinkedIn tools via `@composio/core` for programmatic publish after confirmation.

## API routes

Base URL: `http://localhost:3000/api`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/linkedin/status` | Composio / LinkedIn config status |
| `POST` | `/generate-post` | Generate post with OpenAI |
| `POST` | `/upload-image` | Upload image (multipart `image`) |
| `POST` | `/preview-post` | Create preview + `draftId` |
| `POST` | `/publish-post` | Publish (requires `confirmed: true`) |

Aliases without `/api` prefix also work (e.g. `/generate-post`).

### Example: generate post

```bash
curl -X POST http://localhost:3000/api/generate-post \
  -H "Content-Type: application/json" \
  -d "{\"achievement\": \"I completed my AI Portfolio Dashboard project using Python and OpenAI.\"}"
```

### Example: preview

```bash
curl -X POST http://localhost:3000/api/preview-post \
  -H "Content-Type: application/json" \
  -d "{\"content\": \"Your post body...\", \"hashtags\": [\"#AI\", \"#Python\"]}"
```

### Example: publish (only after user confirms)

```bash
curl -X POST http://localhost:3000/api/publish-post \
  -H "Content-Type: application/json" \
  -d "{\"draftId\": \"YOUR_DRAFT_ID\", \"confirmed\": true}"
```

> Publishing is **blocked** unless `confirmed` is exactly `true`.

## Screenshots

_Add screenshots of the UI here after running locally:_

1. Input form (achievement / project / image)
2. Generated preview with hashtags
3. Confirmation modal
4. Success result

## Local testing without LinkedIn

Set in `.env`:

```env
MOCK_LINKEDIN_PUBLISH=true
```

The full generate → preview → confirm flow works; publish returns a mock success response.

## Future improvements

- [ ] Persistent draft storage (Redis / MongoDB)
- [ ] User authentication and multi-account support
- [ ] Schedule posts for later
- [ ] Post analytics from LinkedIn API
- [ ] Draft history and edit-before-publish UI
- [ ] Webhook triggers via Composio
- [ ] Docker deployment

## License

MIT
