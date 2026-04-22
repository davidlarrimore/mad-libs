---
name: run-session
description: Pre-flight checklist and run instructions for presenting the Mad Libs app live at a TYCTWD session. Use when the user asks to "prep the session", "run the session", "go live", or similar before/during the actual event.
---

# Run Session — Live Presentation Checklist

You are helping Dave run the Mad Libs app in front of a live audience of kids. This
is not a routine dev task — a failure here is visible to ~10 kids and their parents.
Be methodical and cautious.

## Pre-flight (run these in order)

1. **Confirm `.env` has a valid `OPENAI_API_KEY`.** Read `.env` (do not print the
   key back to the user — just confirm it's present and starts with `sk-`).
2. **Verify OpenAI connectivity.** Suggest the user run a quick curl against the
   DALL-E endpoint with their key to confirm the account has image-gen credit.
   Example:
   ```bash
   curl -sS https://api.openai.com/v1/images/generations \
     -H "Authorization: Bearer $OPENAI_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"model":"dall-e-3","prompt":"test","n":1,"size":"1024x1024"}' | head -c 200
   ```
3. **Start the app via Docker Compose** (the blessed "it just works" path):
   ```bash
   docker compose up --build
   ```
   Wait for "listening on 5555" or equivalent in logs. Do NOT use `-d` — the user
   wants the logs visible so they can spot image-gen errors mid-session.
4. **Open `http://localhost:5555` in the browser** Dave will screen-share from.
   Confirm the SELECTION screen renders with three cards.
5. **Remind Dave to toggle browser fullscreen** (Cmd-Ctrl-F on macOS) before
   sharing screen. The app uses `vh`/`vw` units and looks best with no browser
   chrome.
6. **Run one full dry-run round** before kids arrive. Pick any Mad Lib, submit junk
   words, watch it cycle through REVEAL → STORY → IMAGE. This confirms the
   OpenAI API is live and the full animation pipeline works.

## During the session

- Dave types words into the COLLECTION input; the app advances automatically on
  Enter. He doesn't need to click anything once a Mad Lib is selected until the
  IMAGE screen offers "Reset" in the corner.
- Image gen takes 8–20s and fires at COLLECTION start, so the image is usually
  ready before STORY finishes. If it isn't, the app shows a themed spinner — wait
  it out, don't refresh.
- If image gen fails mid-round: the ImageScreen shows a "Try Again" button. Click
  it. If that also fails, check the server logs for the OpenAI error (rate limit,
  content policy, billing) and surface it to Dave.

## Recovery playbook

- **App won't start:** check `docker compose logs`. Most common issues: port 5555
  in use (`lsof -i :5555` to find culprit), or `.env` missing.
- **Image gen repeatedly fails:** check OpenAI billing/quota at
  `platform.openai.com`. A new API key can be created in 60s if needed; update
  `.env` and restart the container.
- **Animation glitches or layout broken:** Dave should hard-refresh (Cmd-Shift-R).
  State is in React only, so a refresh resets cleanly to SELECTION.
- **Screen share looks wrong:** confirm browser is in fullscreen mode and the share
  target is the whole display or the browser window (not a specific tab).

## What to report back

After pre-flight, give Dave a one-line status:
"Ready: server up, OpenAI responding, dry-run passed."
Or the specific blocker if any step fails.
