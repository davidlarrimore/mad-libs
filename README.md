# Mad Libs Presentation App

Fullscreen interactive Mad Libs for Amivero's Take Your Child to Work Day 2026. The
operator runs it on a laptop, screen-shared to a TV. Kids call out words; the app
reveals a themed story and an AI-generated image.

Full architecture and design spec in [`ARCHITECTURE.md`](./ARCHITECTURE.md). If you
just want to run it, the steps below are enough.

## Setup

1. **Get an OpenAI API key** at <https://platform.openai.com/api-keys> and drop it
   into `.env` at the repo root:

   ```bash
   echo 'OPENAI_API_KEY=sk-proj-your-key-here' > .env
   ```

2. **Build and start with Docker:**

   ```bash
   docker compose up --build
   ```

3. **Open the app:** <http://localhost:5555>

4. **Stop:**

   ```bash
   docker compose down
   ```

## Local dev (no Docker, faster iteration)

Two terminals. `npm start` loads `.env` automatically via Node's built-in
`--env-file-if-exists` flag, so you don't have to re-export the key each time.

```bash
# Terminal 1 — API server on :5555 (reads .env)
npm start

# Terminal 2 — Vite dev server on :5173 (proxies /api to :5555)
cd client && npm install && npm run dev
```

Open <http://localhost:5173>.

## Running the session

Before going live, put the browser in fullscreen (Cmd-Ctrl-F on macOS) and share
the display. Do one dry-run round to confirm DALL-E is responding — image
generation takes 8–20s and fires the moment a Mad Lib is selected.

Cost: ~$0.04 per image. Three rounds per session ≈ $0.12.

## What's in the box

- Three Mad Lib challenges with progressive kid-friendly prompts:
  `Operation Metamorphosis` (creature), `Spatial Recalibration` (office),
  `Patent Pending` (device).
- Themed per-Mad-Lib CSS (dark bioluminescent jungle, blueprint-blue office grid,
  aged-parchment patent).
- Token-by-token story reveal with word-type labels.
- Async DALL-E 3 call — image is usually ready by the time the story finishes.
