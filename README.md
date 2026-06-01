# SubGen

**Professional subtitle and caption generator** — upload audio or video, get AI-powered transcriptions via Whisper, edit them in a Premiere Pro-style timeline, style captions with a live inspector, and export as SRT, VTT, or ASS.

Bring your own OpenAI or OpenRouter key. Nothing is stored server-side.

---

## ✨ Features

- **AI Transcription** — upload MP4, WEBM, MP3, or WAV → timed subtitles in seconds via Whisper
- **Timeline Editor** — inline text editing, timestamp controls, add/delete segments
- **Style Inspector** — live preview, Google Fonts (Bebas Neue, Inter, Montserrat, Space Mono…), size, weight, color, background, drop shadow, uppercase, position
- **Multi-format Export** — SRT, VTT, or ASS
- **Bring Your Own Key** — OpenAI or OpenRouter key stays in your browser only

---

## 🚀 Deploy to Vercel (one-click)

### Step 1 — Get a free database

SubGen needs PostgreSQL. Use either:

| Provider | Free tier | Link |
|---|---|---|
| **Neon** | 512 MB | [neon.tech](https://neon.tech) |
| **Supabase** | 500 MB | [supabase.com](https://supabase.com) |

Copy your `DATABASE_URL` connection string (looks like `postgresql://user:pass@host/db`).

### Step 2 — Import to Vercel

1. Go to **[vercel.com/new](https://vercel.com/new)**
2. Click **"Import Git Repository"** → select **SubGen**
3. Vercel auto-detects the config from `vercel.json` — no changes needed
4. Add one environment variable:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | your connection string from Step 1 |

5. Click **Deploy** ✅

### Step 3 — Run the database migration

After the first deploy, open Vercel's **Terminal** tab (or run locally):

```bash
pnpm --filter @workspace/db run push
```

> Or use [drizzle-kit push](https://orm.drizzle.team/docs/overview) — it only needs `DATABASE_URL`.

### Step 4 — Add your AI key

Open your deployed app → click **Settings** (top-right) → paste your API key:

| Provider | Base URL | Model |
|---|---|---|
| **OpenAI** | *(leave blank)* | `whisper-1` |
| **OpenRouter** | `https://openrouter.ai/api/v1` | `openai/whisper-large-v3` |

That's it. Upload a file and start transcribing.

---

## 🛠 Local Development

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL (or a free Neon/Supabase database)

### Setup

```bash
# 1. Clone
git clone https://github.com/jerreenj/SubGen.git
cd SubGen

# 2. Install
pnpm install

# 3. Set environment variable
cp .env.example .env
# Edit .env and set DATABASE_URL

# 4. Push schema
pnpm --filter @workspace/db run push

# 5. Start API server (port 8080)
pnpm --filter @workspace/api-server run dev

# 6. Start frontend (in a second terminal)
pnpm --filter @workspace/subtitle-generator run dev
```

Open the URL that Vite prints (usually `http://localhost:5173`).

---

## 🏗 Project Structure

```
SubGen/
├── api/
│   └── index.ts              # Vercel serverless function (wraps Express)
├── artifacts/
│   ├── api-server/           # Express 5 REST API
│   │   └── src/routes/
│   │       ├── projects.ts   # CRUD + SRT/VTT/ASS export
│   │       ├── segments.ts   # Segment CRUD + batch replace
│   │       └── transcribe.ts # Whisper transcription endpoint
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
├── vercel.json               # Vercel deployment config
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

The `/api/transcribe` endpoint reads your AI credentials from request headers — keys are never stored on the server:

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
| Deployment | Vercel (frontend + API as serverless function) |

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `PORT` | dev only | Port for standalone API server (Vercel manages this automatically) |

---

## 📄 License

MIT
