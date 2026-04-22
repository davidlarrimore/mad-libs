# Mad Libs Presentation App

Fullscreen, screen-share-ready SPA for running AI Mad Libs at Amivero's Take Your
Child to Work Day 2026. Kids (ages 10–14) call out words; the operator (Dave) types
them; the app reveals the completed story over a themed background, then displays an
AI-generated image.

**This is a one-day presentation tool, not production software.** Do not add tests,
telemetry, persistence, auth, routing, or settings UI. Refresh resets state.

## Status

Project not yet scaffolded. Full build spec lives in [ARCHITECTURE.md](./ARCHITECTURE.md).
When the user asks to build the app, follow the implementation order in
`ARCHITECTURE.md` §9.1 exactly.

## Stack

- **Frontend:** React 18 + Vite 5, plain CSS (no framework), `useReducer` for the
  5-phase state machine (`SELECTION → COLLECTION → REVEAL → STORY → IMAGE`).
- **Backend:** Node 20 + Express 4. One file, ~60 lines. Its only jobs: serve the
  built SPA as static files, and proxy `POST /api/generate-image` to OpenAI so the
  API key stays server-side.
- **Image model:** DALL-E 3 at 1024x1024, `quality: "standard"`. Call fires at the
  start of COLLECTION — not REVEAL — so the image is ready by the time the story
  finishes animating.
- **Deploy:** Docker Compose, single service, `docker compose up --build`. Port
  **5555** (non-standard to avoid collisions with other containers on Dave's
  machine). `OPENAI_API_KEY` from `.env` (never commit).

## Hard constraints (from source spec)

Do NOT:
- Use any CSS framework (Tailwind, Bootstrap, MUI — all out). Plain CSS with custom
  properties only.
- Add routing, multiple pages, or navigation. Single page, phase-driven.
- Persist state to localStorage or any storage. Refresh = reset.
- Add tests, analytics, or a settings panel.
- Put user-supplied words into the image prompt. The image represents the *world*
  of the Mad Lib (from the template's `background` + `imagePromptSuffix` fields),
  not the specific story. This guarantees a visually coherent image no matter what
  the kids say.

## Key operational facts

- **Audience:** the app is driven by one operator on a laptop, screen-shared to a
  TV. Design for 1920×1080 minimum. No touch targets, no mobile layout.
- **Typography:** huge. 96px+ for word-type prompts on COLLECTION, 120px for the
  REVEAL headline. Readable from across a room.
- **Async image gen:** fire `/api/generate-image` the instant a Mad Lib is selected.
  If the story finishes before the image resolves, show a themed loading spinner;
  don't transition until the URL is in.
- **Empty-string guard:** ignore submissions with no word; keep focus, do not
  advance the slot.

## Brand assets

The Amivero logo (white/tagline version) is at `brand/amivero-logo-tagline-white.webp`.
During scaffold, copy it to `client/public/brand/` so Vite serves it at
`/brand/amivero-logo-tagline-white.webp`. Use it as small, tasteful branding on the
SELECTION screen footer — not prominent. The app is for kids; the logo is a subtle
"who's hosting" signal.

## Amivero brand palette (observed from logo)

Pulled from the logo and safe to reuse in global chrome:

- Cyan/teal: `#2FB5D0` (inner eye stroke)
- Orange: `#E87726` (outer eye stroke, tagline underline)
- Deep blue: `#1F3A93` (pin outline)
- Purple/magenta: `#6B2574` (pin interior)

These are branding accents, not the per-Mad-Lib theme colors. The three Mad Lib
themes (`creature`, `office`, `device`) have their own palettes specified in
ARCHITECTURE.md §8.1 and should not be replaced with Amivero colors.

## Dev commands (once scaffolded)

```bash
# Docker (production-like, single command)
docker compose up --build                    # http://localhost:5555

# Local dev (two terminals, faster iteration)
npm start                                    # terminal 1, Express :5555 — loads .env via --env-file-if-exists
cd client && npm run dev                     # terminal 2, Vite :5173 (proxies /api → :5555)
```

Both paths read `OPENAI_API_KEY` from `.env` at the repo root. Docker Compose
injects it via `env_file`; local `npm start` uses Node 20.12+'s built-in
`--env-file-if-exists=.env` flag (no `dotenv` dependency).

## Reference documents

Authoritative source docs live in the user's OneDrive; paths captured in memory.
If you need the session-flow context (who's in the room, pacing, round order),
check the memory reference entry for source docs.
