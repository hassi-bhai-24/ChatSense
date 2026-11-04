# ChatSense

ChatSense is a single-user web app that analyses chat transcripts. Paste a
chat log (or upload an export file), and it decodes the other person's
emotional subtext, maps power dynamics, and drafts calibrated replies —
using Google's Gemini API on the server side.

## What it does

- **Initial diagnostic** — a structured report: emotional diagnostic,
  power dynamics and subtext, red/green flags, and a behavioural playbook
  with three sample reply scripts.
- **Interactive coaching** — follow-up questions grounded in the attached
  transcript, streamed back over SSE.
- **Line decoder** — 2–3 ranked interpretations of one specific message.
- **Reply generator** — three calibrated scripts (playful, direct,
  cool/unbothered) for a chosen communication goal.
- **Sample dilemmas** — four built-in transcripts (dating, workplace, ex,
  friendship) to try the app without pasting your own chat.

## Setup

Requires Node.js 20+ and a Gemini API key. The key is never committed:
it lives in a local `.env` file (see `.env.example`).

```bash
npm install
cp .env.example .env   # then put your real GEMINI_API_KEY in .env
npm run dev            # http://localhost:3000
```

Other commands:

```bash
npm run build   # typecheck + production build
npm start       # run the production server (NODE_ENV=production)
npm test        # unit tests for the server helpers
npm run lint    # tsc --noEmit
```

## How it works

- Frontend: React 19 + Vite + Tailwind CSS 4 (in `src/`).
- Backend: one Express server (`server.ts`) that serves the app and
  proxies Gemini calls. The browser never sees the API key.
- The model is `gemini-3.8-flash`. Requests are capped (2 MB bodies,
  50 messages, 1.5M transcript characters) with a small in-memory rate
  limit (30 AI requests per minute per client).
- Transcripts are truncated by a char-budget head/tail split when they
  exceed 1.5M characters (see `formatTranscriptContext` in `server.ts`).

## Privacy — please read

- **Nothing is stored in this app's database or browser storage.** There
  is no database; sessions live only in memory and are lost on refresh.
- **Transcripts ARE sent to Google's Gemini API** for analysis, and are
  subject to Google's data retention. Do not paste conversations you do
  not want shared with Google.
- Ending a session clears this app's in-memory copy only. It cannot
  delete copies already sent to Google.
- No analytics scripts or tracking pixels are loaded, and no third-party
  font requests are made.

## Running it safely

This server has **no authentication** — only a small rate limit. Run it
on localhost or another trusted, private network. Do not expose it
publicly without adding authentication, or anyone who can reach it can
spend your Gemini quota.

## License

MIT — see `LICENSE`.
