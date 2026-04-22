# Mad Libs Presentation App — Architecture & Requirements

This is the complete build spec. Implement exactly as described. The source-of-truth
original is `MadLibs_App_Architecture_1.docx` in the user's OneDrive
(`2025-TYCTWD/`); this markdown is the working copy Claude Code should build from.

## 1. Product Overview

A fullscreen, screen-share-ready SPA that runs the Mad Libs word game during a live
group session. The human operator (Dave) controls the app from a laptop while
screen-sharing to a TV. Kids in the room call out words; Dave types them in. The app
handles the theatrical presentation: collecting words, building suspense, revealing
the completed story with an AI-generated image.

### 1.1 User Flow (State Machine)

Strict linear state machine with five phases:

| Phase        | Description |
| ------------ | ----------- |
| `SELECTION`  | Full-screen menu. Dave clicks one of three ominously-named Mad Lib challenges. |
| `COLLECTION` | Split screen: large word-type prompt on left, growing word list on right. Dave types each word and hits Enter. **Async image generation request fires when this phase begins.** |
| `REVEAL`     | Full-screen dramatic animation: pulsing "REVEAL" text, flash to black, themed background fades in. |
| `STORY`      | Words appear one-by-one in Mad Lib format on the themed background. Blanks styled as underlined tokens with word-type label beneath. Image generation completes in background during this phase. |
| `IMAGE`      | AI-generated image fills the screen with a fade-in. Only entered once story is done AND image is ready. |

### 1.2 Design Principles

- **Presentation-first.** Designed for a 1080p or 4K external display being
  screen-shared. Large fonts, high contrast, minimal UI chrome.
- **Operator-controlled.** Dave is the only person interacting. No touch targets or
  mobile considerations.
- **Async image generation.** The OpenAI API call fires at the start of `COLLECTION`
  (once the Mad Lib is selected), so the image is ready — or nearly ready — by the
  time the story finishes displaying.
- **No persistence.** All state lives in React state. Refresh resets to `SELECTION`.
- No auth, no database, no user accounts.

## 2. Technology Stack

### 2.1 Image Generation: OpenAI DALL-E 3

- Model: `dall-e-3`
- Resolution: `1024x1024`
- Quality: `standard` (not `hd` — faster, still excellent for this use case)
- Expected latency: 8–20 seconds. This is why the API call fires at `COLLECTION`
  start, not `REVEAL` start.
- Cost: ~$0.040 per image. Three rounds = ~$0.12 total. Negligible.

Chosen over Gemini Imagen / Stability for lowest API friction: one POST, one URL
back; handles surreal/whimsical prompts especially well; API key takes 60 seconds to
generate on `platform.openai.com`.

### 2.2 Frontend

- **React 18 + Vite 5.** Component state maps cleanly to the phase machine;
  `useReducer` is ideal for strict linear flow.
- **Plain CSS with CSS custom properties** for per-Mad-Lib theming. No framework.
- **CSS keyframe animations.** No animation library.
- **No router.** Single page, single route. React state drives everything.

### 2.3 Backend

- **Node 20 + Express 4.** ~60 lines, one file.
- Two responsibilities: (1) serve the built React app as static files, (2) proxy
  image generation to OpenAI so the API key never reaches the browser.
- Not using Vite dev proxy in production because we want a single unified server for
  the Docker build.

### 2.4 Infrastructure

- **Docker multi-stage build.** Stage 1: build React with Node/Vite. Stage 2: Node
  20 Alpine running Express, copying in the built static files and `server.js`.
- **Docker Compose, single service.** Maps container `:5555` to host `:5555`
  (port 5555 chosen to avoid collisions with other containers on the operator's
  machine). `OPENAI_API_KEY` injected via `.env`.
- Access: `http://localhost:5555`. Screen-share the browser window or display.
- No HTTPS. Local only.

## 3. Project File Structure

```
madlibs-app/
├── .env                          # OPENAI_API_KEY=sk-... (never committed)
├── .gitignore                    # node_modules, .env, dist
├── docker-compose.yml            # Single service definition
├── Dockerfile                    # Multi-stage build
├── package.json                  # Root — Express server deps
├── server.js                     # Express server (~60 lines)
└── client/
    ├── package.json              # Vite + React deps
    ├── vite.config.js            # Proxy /api → localhost:5555 for dev
    ├── index.html                # Vite entry point
    └── src/
        ├── main.jsx              # React root mount
        ├── App.jsx               # State machine root
        ├── App.css               # Global styles, CSS variables
        ├── data/
        │   └── madlibs.js        # Mad Lib templates and metadata
        └── components/
            ├── SelectionScreen.jsx
            ├── CollectionScreen.jsx
            ├── RevealScreen.jsx
            ├── StoryScreen.jsx
            └── ImageScreen.jsx
```

Also copy `brand/amivero-logo-tagline-white.webp` → `client/public/brand/` during
scaffold so Vite serves it at `/brand/amivero-logo-tagline-white.webp`.

## 4. Data Model

### 4.1 Mad Lib Template Structure (`madlibs.js`)

Each Mad Lib is an object with a `slots` array (collection order) and a `template`
array of `{ type: 'text' | 'slot', value, slotId }` tokens (render order).

```js
// client/src/data/madlibs.js
export const MAD_LIBS = [
  {
    id: "metamorphosis",
    codename: "Operation Metamorphosis",
    theme: "creature",          // drives CSS theme class
    background: "dark jungle, bioluminescent plants, alien atmosphere, deep purple sky",
    imagePromptSuffix: "Digital fantasy creature concept art, vivid colors, dramatic lighting, no text",
    slots: [
      { id: "adj1",  type: "ADJECTIVE", hint: "how it looks overall" },
      { id: "noun1", type: "NOUN",      hint: "a type of creature or animal" },
      { id: "adj2",  type: "ADJECTIVE", hint: "describes a body part" },
      { id: "noun2", type: "NOUN",      hint: "a body part (wings, horns, etc)" },
      { id: "adj3",  type: "ADJECTIVE", hint: "another descriptor" },
      { id: "noun3", type: "NOUN",      hint: "another feature (eyes, scales, etc)" },
      { id: "verb1", type: "VERB",      hint: "how it moves" },
      { id: "noun4", type: "NOUN",      hint: "a location or terrain" },
      { id: "verb2", type: "VERB",      hint: "what it does when scared" },
      { id: "noun5", type: "NOUN",      hint: "its favorite food" },
      { id: "adj4",  type: "ADJECTIVE", hint: "the sound it makes" },
    ],
    template: [
      { type: "text",  value: "A " },
      { type: "slot",  slotId: "adj1" },
      { type: "text",  value: " " },
      { type: "slot",  slotId: "noun1" },
      { type: "text",  value: " creature with " },
      { type: "slot",  slotId: "adj2" },
      { type: "text",  value: " " },
      { type: "slot",  slotId: "noun2" },
      { type: "text",  value: " and " },
      { type: "slot",  slotId: "adj3" },
      { type: "text",  value: " " },
      { type: "slot",  slotId: "noun3" },
      { type: "text",  value: ". It " },
      { type: "slot",  slotId: "verb1" },
      { type: "text",  value: " through " },
      { type: "slot",  slotId: "noun4" },
      { type: "text",  value: " and " },
      { type: "slot",  slotId: "verb2" },
      { type: "text",  value: " when threatened. Its favorite food is " },
      { type: "slot",  slotId: "noun5" },
      { type: "text",  value: " and it makes a " },
      { type: "slot",  slotId: "adj4" },
      { type: "text",  value: " sound." },
    ],
  },
  // Spatial Recalibration and Patent Pending defined identically — see §Appendix.
];
```

### 4.2 App State Shape (single `useReducer` in `App.jsx`)

```js
const initialState = {
  phase: 'SELECTION',         // SELECTION | COLLECTION | REVEAL | STORY | IMAGE
  selectedMadLib: null,       // reference to the chosen MAD_LIBS entry
  collectedWords: {},         // { slotId: 'word entered by user' }
  currentSlotIndex: 0,        // which slot we're currently collecting
  imageUrl: null,             // populated when OpenAI responds
  imageError: null,           // populated if generation fails
  imageLoading: true,         // true until image resolves or errors
  storyTokenIndex: 0,         // which token in the template is currently visible
};
```

### 4.3 Actions

```
SELECT_MAD_LIB     { madLib }          // SELECTION screen click
SUBMIT_WORD        { slotId, word }    // per word entry
START_REVEAL       {}                  // last word submitted
START_STORY        {}                  // REVEAL animation ends
ADVANCE_TOKEN      {}                  // per story timer tick
IMAGE_READY        { url }             // async image fetch resolved
IMAGE_ERROR        { error }           // async image fetch failed
STORY_COMPLETE     {}                  // last token shown
RESET              {}                  // returns to SELECTION
```

## 5. Component Specifications

### 5.1 `App.jsx` — Root State Machine

- Owns the `useReducer` state and dispatch.
- Renders the correct screen component based on `phase`.
- On `SELECT_MAD_LIB`: **immediately** fires async `fetch('/api/generate-image', ...)`.
  Does NOT await. Dispatches `IMAGE_READY` or `IMAGE_ERROR` when it resolves.
- On `STORY_COMPLETE`: transitions to `IMAGE` only if `imageUrl` is populated.
  Otherwise show a themed loading spinner overlay until `IMAGE_READY` fires.
- Passes `dispatch` to child components as props (no Context needed at this scale).

### 5.2 `SelectionScreen.jsx`

- Full viewport. Dark background. Three large clickable cards, one per Mad Lib.
- Each card shows only the codename (Operation Metamorphosis, Spatial Recalibration,
  Patent Pending) in large text. **No description. No spoilers.**
- Subtle hover animation (scale or glow). Click fires `SELECT_MAD_LIB`.
- Small Amivero logo in footer. Nothing else.

### 5.3 `CollectionScreen.jsx`

Layout: two-column split, left ~65%, right ~35%.

**Left — word prompt area:**
- Enormous word-type label (`NOUN`, `ADJECTIVE`, `VERB`) in 96px+ font. Dominant
  visual when screen-sharing.
- Smaller hint text below the type label (e.g. "a type of creature or animal").
- Auto-focused text input. Submit button. Enter key also submits.
- Progress indicator (e.g. "4 of 11").

**Right — collected words list:**
- Header: "Words So Far"
- Each row: `[TYPE] word` — e.g. `[NOUN] volcano`
- Words slide in with subtle animation as they're added.
- Scrolls if long (unlikely at 11 max, but handle it).
- Current pending slot shown as a pulsing empty row.

**Image generation:** fires silently on mount. No UI indication to audience. Operator
doesn't need to know status during this phase.

### 5.4 `RevealScreen.jsx`

Pure animation. No user interaction. Three sequential phases:

1. "REVEAL" text appears center screen, enormous font, pulsing/throbbing (~1.5s).
2. White flash fills the screen (~0.3s).
3. Screen holds black for a beat (~0.5s), then `RevealScreen` unmounts and
   `StoryScreen` mounts.

CSS-animation-driven, single `useEffect` with a `setTimeout` chain. Total ~3s. Fire
`START_STORY` dispatch at the end.

### 5.5 `StoryScreen.jsx`

**Background:** each Mad Lib has a CSS theme class applied to root (`.theme-creature`,
`.theme-office`, `.theme-device`). Themes use CSS custom properties for colors,
gradient, and text color.

**Text rendering:** the template is rendered into a large paragraph.
- `text` tokens: plain inline span. Appear as baseline text.
- `slot` tokens (filled words):
  - The word itself, bold, contrasting color.
  - `border-bottom` underline (not `text-decoration`).
  - Word type (NOUN/VERB/ADJECTIVE) in smaller text below the underline.

**Word-by-word reveal:** do NOT render all at once. `setInterval` (~180ms per token)
fires `ADVANCE_TOKEN` repeatedly. Only tokens up to `storyTokenIndex` are rendered.
Feels "typed out" in front of the audience. Slot tokens use a slightly longer pause
(300ms) for emphasis.

**Font size:** readable on a shared screen from across a room. 36–42px body text,
larger for filled words. Use `rem` units. Test at 1920×1080.

**On complete:** fire `STORY_COMPLETE`. App transitions to `IMAGE` phase, or holds
with a themed loading spinner if the image isn't ready.

### 5.6 `ImageScreen.jsx`

- Full viewport. AI image fills with `object-fit: cover`.
- Fade-in on mount (opacity 0→1 over ~1s).
- If generation failed: tasteful error message centered on themed background. Don't
  crash. Provide a "Try Again" button that retriggers the API call.
- Small "Reset" button in corner (visible on hover) fires `RESET` → `SELECTION`.

## 6. API Integration

### 6.1 Image Generation Endpoint

```js
// server.js — POST /api/generate-image
// Body: { prompt: string }
// Response: { url: string } or { error: string }

app.post('/api/generate-image', async (req, res) => {
  const { prompt } = req.body;
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    }),
  });
  const data = await response.json();
  if (data.data?.[0]?.url) {
    res.json({ url: data.data[0].url });
  } else {
    res.status(500).json({ error: 'Image generation failed' });
  }
});
```

### 6.2 Prompt Construction

The image prompt is built in `App.jsx` when `SELECT_MAD_LIB` fires — **before** any
words are collected. It uses the Mad Lib's static metadata only. User words are NOT
in the image prompt. The image represents the **world** of the Mad Lib, not the
specific story, ensuring visual coherence regardless of what the kids choose.

```js
function buildImagePrompt(madLib) {
  return `${madLib.background}. ${madLib.imagePromptSuffix}`;
}
// Example for Operation Metamorphosis:
// "dark jungle, bioluminescent plants, alien atmosphere, deep purple sky.
//  Digital fantasy creature concept art, vivid colors, dramatic lighting, no text"
```

### 6.3 Environment Variable Setup

```bash
# .env (never committed)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

```yaml
# docker-compose.yml
services:
  madlibs:
    build: .
    ports:
      - '5555:5555'
    env_file:
      - .env
```

```
# .gitignore — must include
.env
node_modules
client/node_modules
dist
```

## 7. Docker Configuration

### 7.1 Multi-Stage Dockerfile

```dockerfile
# Stage 1: Build the React frontend
FROM node:20-alpine AS builder
WORKDIR /app
COPY client/package*.json ./client/
RUN cd client && npm install
COPY client/ ./client/
RUN cd client && npm run build

# Stage 2: Production server
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY server.js ./
COPY --from=builder /app/client/dist ./public
EXPOSE 5555
CMD ["node", "server.js"]
```

### 7.2 Running

```bash
# 1. Add your OpenAI API key
echo 'OPENAI_API_KEY=sk-proj-your-key-here' > .env

# 2. Build and start
docker compose up --build

# 3. Open in browser
# http://localhost:5555

# 4. Stop
docker compose down
```

Local dev (faster iteration, no Docker):

```bash
# Terminal 1:
OPENAI_API_KEY=sk-... node server.js
# Terminal 2:
cd client && npm run dev
# Open http://localhost:5173
```

## 8. Visual Design

### 8.1 Theme System

Three CSS classes on the document root, each with custom properties:

| Class            | Description |
| ---------------- | ----------- |
| `.theme-creature` | Dark background (`#0D0221` deep purple-black). Cyan/teal accent. Bioluminescent feel. Radial gradient deep purple → near-black. |
| `.theme-office`   | Blueprint blue (`#0A1628`). White/yellow accent. Blueprint paper grid overlay (subtle CSS grid lines). |
| `.theme-device`   | Aged paper / parchment (`#F5E6C8`). Dark brown text. Vintage technical-diagram feel. Sepia. |

### 8.2 Typography Scale

| Element                       | Size |
| ----------------------------- | ---- |
| Selection screen codenames    | 72px, bold |
| Collection word type          | 96px, bold, uppercase, letter-spacing |
| Collection hint text          | 28px, italic, muted |
| Collection word-list entries  | 26px |
| Story body text               | 40px |
| Story filled words            | 44px, bold, contrasting color |
| Story word-type labels        | 18px, uppercase, muted |
| REVEAL animation text         | 120px, bold |

### 8.3 Key Animations

| Animation              | Spec |
| ---------------------- | ---- |
| Word-type pulse (Collection) | `scale(1)→1.03→1`, 1.5s infinite ease-in-out |
| Word slide-in (list)   | `translateX(20px) + opacity:0` → `translateX(0) + opacity:1`, 0.3s ease-out |
| REVEAL pulse           | `scale(1)→1.08→1`, 0.8s infinite, color cycles through theme colors |
| White flash            | white overlay div, opacity 0→1→0, 0.5s |
| Story token appear     | opacity 0→1, 0.15s ease-in. Slot tokens add `translateY(4px)→0` |
| Image fade-in          | opacity 0→1, 1.2s ease-in |

## 9. Implementation Instructions

### 9.1 Order (avoid dependency issues)

1. Project scaffold: directories, package.json files, `vite.config.js`, `.gitignore`.
2. `madlibs.js` with all three Mad Libs fully specified (see Appendix).
3. `server.js` with `/api/generate-image` route and static file serving.
4. `App.jsx` with `useReducer` state machine and async image fetch.
5. `SelectionScreen.jsx`
6. `CollectionScreen.jsx`
7. `RevealScreen.jsx` with CSS animation sequence.
8. `StoryScreen.jsx` with token-by-token reveal timer.
9. `ImageScreen.jsx` with fade-in and error fallback.
10. `App.css` with all three themes and global presentation styles.
11. `Dockerfile` and `docker-compose.yml`.
12. `README.md` with setup steps.

### 9.2 Edge Cases — Must Handle

- Image gen takes longer than the story: centered loading spinner on
  theme-colored background. Do NOT transition to `IMAGE` until `imageUrl` populated.
- Image gen fails (network, content policy): friendly error on theme background,
  "Try Again" button retriggers the API call. No crash, no blank screen.
- Empty submission: ignore. Keep focus on input. Do not advance.
- Long runs of plain text between slots: all appear rapidly (per-token, not
  per-character).
- Screen resize / fullscreen toggle mid-presentation: layouts fully responsive via
  `vh`/`vw`. No breakage.

### 9.3 Do NOT

- Use any CSS framework.
- Add navigation, routing, multi-page structure.
- Add telemetry, analytics, or logging (beyond server console).
- Add a settings panel or configuration UI.
- Store state in `localStorage` or any persistence layer.
- Add tests.

## Appendix: Complete Mad Lib Templates

### Operation Metamorphosis

Completed story:
> A [adj1] [noun1] creature with [adj2] [noun2] and [adj3] [noun3]. It [verb1]
> through [noun4] and [verb2] when threatened. Its favorite food is [noun5] and it
> makes a [adj4] sound.

| Slot ID | Type | Hint |
| ------- | ---- | ---- |
| adj1  | ADJECTIVE | how it looks overall (e.g. glowing, lumpy, invisible) |
| noun1 | NOUN      | a type of creature or animal (e.g. lizard, octopus) |
| adj2  | ADJECTIVE | describes a body feature (e.g. slimy, enormous, see-through) |
| noun2 | NOUN      | a body part (e.g. wings, horns, tail) |
| adj3  | ADJECTIVE | another descriptor (e.g. electric, fuzzy, metallic) |
| noun3 | NOUN      | another body feature (e.g. eyes, scales, fins) |
| verb1 | VERB      | how it moves (e.g. slithers, teleports, somersaults) |
| noun4 | NOUN      | a location or terrain (e.g. volcano, swamp, the moon) |
| verb2 | VERB      | what it does when scared (e.g. explodes, hibernates, cries) |
| noun5 | NOUN      | its favorite food (e.g. spaghetti, batteries, sadness) |
| adj4  | ADJECTIVE | the sound it makes (e.g. melodic, deafening, squeaky) |

Theme: `creature`. Background prompt:
`"dark jungle, bioluminescent plants, alien atmosphere, deep purple sky"`.
Suffix: `"Digital fantasy creature concept art, vivid colors, dramatic lighting, no text"`.

### Spatial Recalibration

Completed story:
> Our new office has [adj1] and [adj2] walls. [noun1] in every corner. [noun2]
> hanging from the ceiling. The break room features [noun3] and [noun4]. Desks made
> of [noun5], [adj3] with [noun6] on top. The lobby has a [adj4] [noun7]
> installation.

| Slot ID | Type | Hint |
| ------- | ---- | ---- |
| adj1  | ADJECTIVE | wall color/texture (e.g. neon, polka-dotted, holographic) |
| adj2  | ADJECTIVE | another wall quality (e.g. bouncy, transparent, furry) |
| noun1 | NOUN      | something in every corner (e.g. volcanoes, trampolines) |
| noun2 | NOUN      | something hanging from the ceiling (e.g. surfboards, dinosaurs) |
| noun3 | NOUN      | something in the break room (e.g. roller coaster, waterfall) |
| noun4 | NOUN      | another break room feature (e.g. swimming pool, jungle gym) |
| noun5 | NOUN      | what desks are made of (e.g. ice, cheese, rainbows) |
| adj3  | ADJECTIVE | describes the desk surface (e.g. singing, invisible, edible) |
| noun6 | NOUN      | desk accessory (e.g. jetpacks, a portal) |
| adj4  | ADJECTIVE | lobby installation quality (e.g. rotating, melting, musical) |
| noun7 | NOUN      | what the lobby installation is (e.g. statue, fountain, black hole) |

Theme: `office`. Background prompt:
`"modern open office interior, blueprint technical illustration style, architectural rendering"`.
Suffix: `"Architectural illustration, interior design, vivid and surreal, no text"`.

### Patent Pending

Completed story:
> We invented a device called the [noun1] that [verb1] your [noun2]. It [verb2],
> [verb3], and [verb4] simultaneously. It uses [adj1] technology and produces
> [noun3] as a side effect. When activated, it [verb5] and sounds like a [noun4].

| Slot ID | Type | Hint |
| ------- | ---- | ---- |
| noun1 | NOUN      | the device name (e.g. Turbo-Blaster, The Snorkelizer) |
| verb1 | VERB      | what it does (e.g. inflates, dissolves, harmonizes) |
| noun2 | NOUN      | what it acts on (e.g. homework, your left shoe) |
| verb2 | VERB      | first simultaneous action (e.g. spins, hums, levitates) |
| verb3 | VERB      | second simultaneous action (e.g. predicts, wobbles) |
| verb4 | VERB      | third simultaneous action (e.g. calculates, sneezes) |
| adj1  | ADJECTIVE | type of technology (e.g. quantum, artisanal, underwater) |
| noun3 | NOUN      | the side effect (e.g. rainbows, confusion, cheese) |
| verb5 | VERB      | activation behavior (e.g. vibrates, glows, recites poetry) |
| noun4 | NOUN      | what it sounds like (e.g. a foghorn, a hamster, a jazz band) |

Theme: `device`. Background prompt:
`"vintage patent blueprint on aged parchment, technical engineering diagram with labels and arrows"`.
Suffix: `"Detailed technical blueprint style illustration, vintage engineering diagram, sepia tones, no text"`.
