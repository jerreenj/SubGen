# SubGen

**Professional subtitle and caption generator** — upload audio or video, get AI-powered transcriptions via Whisper, edit them in a Premiere Pro-style timeline, style captions with a live inspector, and export as SRT, VTT, or ASS.

Bring your own OpenAI or OpenRouter key. API keys never touch the server.

---

## ✨ Features

- **AI Transcription** — upload MP4, WEBM, MP3, or WAV → timed subtitles in seconds via Whisper
- **Timeline Editor** — inline text editing, timestamp controls, add/delete segments
- **Style Inspector** — live preview, Google Fonts, size, weight, color, background, drop shadow, uppercase, position
- **Multi-format Export** — SRT, VTT, or ASS
- **Bring Your Own Key** — OpenAI or OpenRouter key stays in your browser; never stored on the server

---

## 🚀 Deploy (one-click, free)

SubGen has two parts: a **React frontend** and an **Express API**. Deploy each in one click.

### Part 1 — API server on Railway

1. Go to **[railway.app](https://railway.app)** → New Project → Deploy from GitHub → select **SubGen**
2. Set the **Root Directory** to `artifacts/api-server`
3. Add environment variable: `DATABASE_URL` — get a free Postgres from [Neon](https://neon.tech) or [Supabase](https://supabase.com)
4. Deploy — Railway gives you a URL like `https://subgen-api.up.railway.app`
5. After deploy, run the DB migration once:
   ```bash
   DATABASE_URL=<your-url> pnpm --filter @workspace/db run push
   ```
   Or use the Railway shell tab.

### Part 2 — Frontend on Vercel

1. Go to **[vercel.com/new](https://vercel.com/new)** → Import `jerreenj/SubGen`
2. Vercel auto-reads `vercel.json` — no settings to change
3. Add one environment variable:

   | Name | Value |
   |---|---|
   | `VITE_API_URL` | your Railway URL from Part 1, e.g. `https://subgen-api.up.railway.app` |

4. Click **Deploy** ✅

### Part 3 — Add your AI key in the app

Open your deployed app → click **Settings** (top-right) → paste your key:

| Provider | Base URL | Model |
|---|---|---|
| **OpenAI** | *(leave blank)* | `whisper-1` |
| **OpenRouter** | `https://openrouter.ai/api/v1` | `openai/whisper-large-v3` |

---

## 🛠 Local Development

### Prerequisites

- Node.js 20+
- pnpm 9+ (`npm install -g pnpm`)
- PostgreSQL (or a free Neon/Supabase connection string)

### Setup

```bash
# 1. Clone
git clone https://github.com/jerreenj/SubGen.git
cd SubGen

# 2. Install
pnpm install

# 3. Set env vars
cp .env.example .env
# Edit .env and fill in DATABASE_URL

# 4. Push DB schema
pnpm --filter @workspace/db run push

# 5. Start API server (terminal 1)
pnpm --filter @workspace/api-server run dev

# 6. Start frontend (terminal 2)
pnpm --filter @workspace/subtitle-generator run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

---

## 🏗 Project Structure

```
SubGen/
├── artifacts/
│   ├── api-server/           # Express 5 REST API
│   │   └── src/
│   │       ├── app.ts        # Express app
│   │       └── routes/
│   │           ├── projects.ts   # CRUD + SRT/VTT/ASS export
│   │           ├── segments.ts   # Segment CRUD + batch replace
│   │           └── transcribe.ts # Whisper transcription endpoint
│   └── subtitle-generator/   # React + Vite frontend
│       └── src/
│           ├── pages/
│           │   ├── dashboard.tsx    # Project list + stats
│           │   ├── editor.tsx       # Timeline + style inspector
│           │   ├── new-project.tsx  # Create project
│           │   └── settings.tsx     # API key management
│           └── lib/
│               └── ai-settings.ts   # localStorage key management
├── lib/
│   ├── api-spec/             # OpenAPI spec (source of truth)
│   ├── api-client-react/     # Generated TanStack Query hooks
│   ├── api-zod/              # Generated Zod schemas
│   └── db/                   # Drizzle ORM schema + client
├── vercel.json               # Vercel frontend deployment config
└── .env.example              # Environment variable reference
```

---

## 🔌 API Reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/projects` | List all projects |
| `POST` | `/api/projects` | Create a project |
| `GET` | `/api/projects/:id` | Get project with segments |
| `PATCH` | `/api/projects/:id` | Update project |
| `DELETE` | `/api/projects/:id` | Delete project |
| `GET` | `/api/projects/:id/export?format=srt\|vtt\|ass` | Export subtitles |
| `POST` | `/api/projects/:id/segments` | Add a segment |
| `PUT` | `/api/projects/:id/segments` | Batch replace segments |
| `PATCH` | `/api/segments/:id` | Edit a segment |
| `DELETE` | `/api/segments/:id` | Delete a segment |
| `POST` | `/api/transcribe` | Transcribe audio/video (multipart) |

### Transcription headers

`POST /api/transcribe` reads your AI credentials from request headers — keys never stored server-side:

| Header | Required | Description |
|---|---|---|
| `x-api-key` | ✅ | Your OpenAI or OpenRouter API key |
| `x-base-url` | — | Custom base URL (e.g. `https://openrouter.ai/api/v1`) |
| `x-model` | — | Model name (default: `whisper-1`) |

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4, shadcn/ui, TanStack Query, wouter |
| Backend | Node.js 24, Express 5, Drizzle ORM |
| Database | PostgreSQL |
| Transcription | OpenAI Whisper API (or any OpenAI-compatible endpoint) |
| Monorepo | pnpm workspaces, TypeScript 5.9 |
| Deployment | Vercel (frontend) + Railway (API) |

---

## 🔑 Environment Variables

### API server (`artifacts/api-server`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `PORT` | dev only | Port for the API server (Railway sets this automatically) |

### Frontend (`artifacts/subtitle-generator`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | production | URL of the deployed API server (e.g. `https://subgen-api.up.railway.app`) — leave unset for local dev |

---

## 📄 License

MIT
