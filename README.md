# SubGen

**Professional subtitle and caption generator** — upload audio or video, get AI-powered transcriptions via Whisper, edit them in a timeline editor, style captions with a live inspector, and export as SRT, VTT, or ASS.

Bring your own OpenAI or OpenRouter key. Nothing is stored server-side; your key lives only in your browser.

---

## Features

- **AI Transcription** — upload MP4, WEBM, MP3, or WAV and get timed subtitles in seconds via OpenAI Whisper (or any OpenAI-compatible endpoint, including OpenRouter)
- **Timeline Editor** — Premiere Pro-style segment list with inline text editing, timestamp controls, and add/delete
- **Style Inspector** — live caption preview with font picker (Google Fonts: Bebas Neue, Inter, Montserrat, Space Mono, and more), size, weight, color, background, drop shadow, uppercase/italic toggles, position, and alignment
- **Multi-format Export** — download subtitles as **SRT**, **VTT**, or **ASS**
- **Bring Your Own Key** — paste your OpenAI or OpenRouter API key in Settings; it never leaves your browser except to forward your transcription request

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4, shadcn/ui, TanStack Query, wouter |
| Backend | Node.js 24, Express 5, Drizzle ORM |
| Database | PostgreSQL |
| Transcription | OpenAI Whisper API (or any OpenAI-compatible endpoint) |
| Monorepo | pnpm workspaces, TypeScript 5.9 |

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL database

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/SubGen.git
cd SubGen
pnpm install
```

### 2. Configure environment

```bash
# Required
DATABASE_URL=postgresql://user:password@localhost:5432/subgen

# Optional — only needed if you want server-side defaults
# Users can always paste their own key in the Settings page
OPENAI_API_KEY=sk-...
```

Copy `.env.example` to `.env` and fill in the values.

### 3. Push the database schema

```bash
pnpm --filter @workspace/db run push
```

### 4. Start development servers

```bash
# Terminal 1 — API server (port 8080)
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Frontend (port varies)
pnpm --filter @workspace/subtitle-generator run dev
```

Open `http://localhost:5173` (or whichever port Vite picks).

### 5. Add your API key

Open **Settings** (top-right) and paste your OpenAI or OpenRouter key. That's it — start uploading files and transcribing.

---

## Deployment

### Vercel (recommended for frontend)

The frontend is a standard Vite/React app. Deploy it on Vercel:

```bash
# Build output
pnpm --filter @workspace/subtitle-generator run build
# Output is in artifacts/subtitle-generator/dist/
```

Set `VITE_API_URL` to your API server's public URL if the API lives on a different domain.

### API Server

Deploy the Express API to any Node.js host (Railway, Render, Fly.io, etc.):

```bash
pnpm --filter @workspace/api-server run build
# Output is in artifacts/api-server/dist/index.mjs
node artifacts/api-server/dist/index.mjs
```

Required env vars on the server:
- `PORT` — port to listen on
- `DATABASE_URL` — PostgreSQL connection string

---

## Project Structure

```
SubGen/
├── artifacts/
│   ├── api-server/          # Express 5 REST API
│   │   └── src/routes/
│   │       ├── projects.ts  # CRUD + export (SRT/VTT/ASS)
│   │       ├── segments.ts  # Segment CRUD + batch replace
│   │       └── transcribe.ts# Whisper transcription endpoint
│   └── subtitle-generator/  # React + Vite frontend
│       └── src/
│           ├── pages/
│           │   ├── dashboard.tsx   # Project list + stats
│           │   ├── editor.tsx      # Timeline + style inspector
│           │   ├── new-project.tsx # Create project
│           │   └── settings.tsx    # API key management
│           └── lib/
│               └── ai-settings.ts  # localStorage key management
├── lib/
│   ├── api-spec/            # OpenAPI spec (source of truth)
│   ├── api-client-react/    # Generated TanStack Query hooks
│   ├── api-zod/             # Generated Zod schemas
│   └── db/                  # Drizzle ORM schema + client
```

---

## API Reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/projects` | List all projects |
| `POST` | `/api/projects` | Create a project |
| `GET` | `/api/projects/:id` | Get project with segments |
| `PATCH` | `/api/projects/:id` | Update project (name, style, etc.) |
| `DELETE` | `/api/projects/:id` | Delete project + segments |
| `GET` | `/api/projects/:id/export?format=srt\|vtt\|ass` | Export subtitles |
| `GET` | `/api/projects/:id/segments` | List segments |
| `POST` | `/api/projects/:id/segments` | Add a segment |
| `PUT` | `/api/projects/:id/segments` | Batch replace all segments |
| `PATCH` | `/api/segments/:id` | Edit a segment |
| `DELETE` | `/api/segments/:id` | Delete a segment |
| `POST` | `/api/transcribe` | Transcribe audio/video (multipart) |

### Transcription headers

The `/api/transcribe` endpoint reads your AI credentials from request headers so no keys are stored on the server:

| Header | Required | Description |
|---|---|---|
| `x-api-key` | ✅ | Your OpenAI or OpenRouter API key |
| `x-base-url` | No | Custom base URL (e.g. `https://openrouter.ai/api/v1`) |
| `x-model` | No | Model name (default: `whisper-1`) |

---

## Using OpenRouter

1. Sign up at [openrouter.ai](https://openrouter.ai) and create an API key
2. In SubGen Settings, set:
   - **API Key**: your OpenRouter key
   - **Base URL**: `https://openrouter.ai/api/v1`
   - **Model**: `openai/whisper-large-v3` (or any Whisper-compatible model)

---

## License

MIT
