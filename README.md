# SubGen

**Professional subtitle and caption generator** — upload audio or video, get AI-powered transcriptions via Whisper, edit them in a Premiere Pro-style timeline, style captions with a live inspector, and export as SRT, VTT, or ASS.

No database. No backend. Just paste your API key and go.

---

## ✨ Features

- **AI Transcription** — upload MP4, WEBM, MP3, or WAV → timed subtitles in seconds (calls OpenAI Whisper directly from your browser)
- **Timeline Editor** — inline text editing, timestamp controls, add/delete segments
- **Style Inspector** — live caption preview, Google Fonts, size, weight, color, background, drop shadow, uppercase, position
- **Multi-format Export** — SRT, VTT, or ASS — generated entirely in the browser
- **Bring Your Own Key** — OpenAI or OpenRouter key stays in your browser only (localStorage). Never sent to any server.
- **No database** — all projects and segments saved in browser localStorage. Nothing leaves your device.

---

## 🚀 Deploy to Vercel (one-click)

1. Go to **[vercel.com/new](https://vercel.com/new)**
2. Click **"Import Git Repository"** → select `jerreenj/SubGen`
3. No environment variables needed — Vercel auto-reads `vercel.json`
4. Click **Deploy** ✅

That's it. No database. No backend server. No environment variables to configure.

### After deploy — add your AI key

Open your deployed app → click **Settings** (top-right) → paste your key:

| Provider | Base URL | Model |
|---|---|---|
| **OpenAI** | *(leave blank)* | `whisper-1` |
| **OpenRouter** | `https://openrouter.ai/api/v1` | `openai/whisper-large-v3` |

---

## 🛠 Local Development

```bash
# 1. Clone
git clone https://github.com/jerreenj/SubGen.git
cd SubGen

# 2. Install
pnpm install

# 3. Start the frontend
pnpm --filter @workspace/subtitle-generator run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

No database or API server needed for local dev either.

---

## 🏗 How it works

```
Browser (React + Vite)
  ├─ Projects & segments  →  localStorage  (stays on your device)
  ├─ Transcription        →  OpenAI Whisper API  (called directly from browser)
  └─ Export (SRT/VTT/ASS) →  generated in browser  (no server involved)
```

Everything runs in the browser. The only network call is the transcription request sent directly from your browser to the OpenAI API using the key you provide.

---

## 🏗 Project Structure

```
SubGen/
├── artifacts/
│   └── subtitle-generator/       # React + Vite frontend (the entire app)
│       └── src/
│           ├── lib/
│           │   ├── storage.ts        # localStorage CRUD + SRT/VTT/ASS export
│           │   └── ai-settings.ts    # API key management (localStorage)
│           └── pages/
│               ├── dashboard.tsx     # Project list + stats
│               ├── editor.tsx        # Timeline + style inspector + transcription
│               ├── new-project.tsx   # Create project
│               └── settings.tsx      # API key input
├── vercel.json                   # Vercel config (builds frontend, SPA routing)
└── lib/                          # Shared TypeScript libs (API spec, DB — not used in frontend)
```

---

## 🔌 Transcription API call

The app calls OpenAI's transcription endpoint **directly from the browser** — no proxy server:

```
POST {baseUrl}/audio/transcriptions
Authorization: Bearer {your-api-key}
Content-Type: multipart/form-data

file: <audio/video file>
model: whisper-1
response_format: verbose_json
timestamp_granularities[]: segment
```

The `baseUrl` defaults to `https://api.openai.com/v1` but can be changed in Settings for OpenRouter or any compatible API.

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4, shadcn/ui, wouter |
| Storage | Browser localStorage (no database) |
| Transcription | OpenAI Whisper (called directly from browser) |
| Export | SRT / VTT / ASS generated in-browser |
| Monorepo | pnpm workspaces, TypeScript 5.9 |
| Deployment | Vercel (static site — one click) |

---

## 📄 License

MIT
