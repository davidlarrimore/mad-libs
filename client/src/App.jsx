import { useReducer, useEffect, useRef } from 'react';
import { MAD_LIBS } from './data/madlibs.js';
import { INTEL_GUARDIAN, SPROUT_GREETING_TEXT } from './data/challenges.js';
import SelectionScreen from './components/SelectionScreen.jsx';
import CollectionScreen from './components/CollectionScreen.jsx';
import RevealScreen from './components/RevealScreen.jsx';
import StoryScreen from './components/StoryScreen.jsx';
import ImageScreen from './components/ImageScreen.jsx';
import ChallengeScreen from './components/ChallengeScreen.jsx';
import VictoryScreen from './components/VictoryScreen.jsx';

const initialState = {
  phase: 'SELECTION',
  // Mad Lib state
  selectedMadLib: null,
  collectedWords: {},
  currentSlotIndex: 0,
  imageUrl: null,
  imageError: null,
  imageLoading: false,
  storyTokenIndex: 0,
  storyComplete: false,
  // Challenge state
  selectedChallenge: null,
  challengeMessages: [],
  challengeCoachNotes: [],
  challengeProgress: 0,
  challengeSending: false,
  challengeError: null,
};

const freshChallengeState = () => ({
  selectedChallenge: null,
  challengeMessages: [],
  challengeCoachNotes: [],
  challengeProgress: 0,
  challengeSending: false,
  challengeError: null,
});

function reducer(state, action) {
  switch (action.type) {
    case 'SELECT_MAD_LIB':
      return {
        ...initialState,
        phase: 'COLLECTION',
        selectedMadLib: action.madLib,
      };

    case 'SUBMIT_WORD': {
      const { slotId, word } = action;
      const collectedWords = { ...state.collectedWords, [slotId]: word };
      const nextIndex = state.currentSlotIndex + 1;
      const isLast = nextIndex >= state.selectedMadLib.slots.length;
      return {
        ...state,
        collectedWords,
        currentSlotIndex: isLast ? state.currentSlotIndex : nextIndex,
        phase: isLast ? 'REVEAL' : state.phase,
        // Fire the image request at REVEAL start, so the completed story can
        // drive the prompt. The REVEAL + STORY phases give DALL-E a ~13s
        // head start before the user clicks Continue.
        imageLoading: isLast ? true : state.imageLoading,
      };
    }

    case 'START_STORY':
      return { ...state, phase: 'STORY', storyTokenIndex: 0, storyComplete: false };

    case 'ADVANCE_TOKEN':
      return { ...state, storyTokenIndex: state.storyTokenIndex + 1 };

    case 'STORY_COMPLETE':
      return { ...state, storyComplete: true };

    case 'GO_TO_IMAGE':
      return { ...state, phase: 'IMAGE' };

    case 'IMAGE_READY':
      return { ...state, imageUrl: action.url, imageLoading: false, imageError: null };

    case 'IMAGE_ERROR':
      return { ...state, imageError: action.error, imageLoading: false };

    case 'RETRY_IMAGE':
      return { ...state, imageLoading: true, imageError: null, imageUrl: null };

    case 'SELECT_CHALLENGE':
      return {
        ...initialState,
        phase: 'CHALLENGE',
        selectedChallenge: action.challenge,
        challengeMessages: [{ role: 'agent', text: SPROUT_GREETING_TEXT }],
      };

    case 'CHALLENGE_SEND':
      return {
        ...state,
        challengeMessages: [
          ...state.challengeMessages,
          { role: 'user', text: action.text },
        ],
        challengeSending: true,
        challengeError: null,
      };

    case 'CHALLENGE_AGENT_REPLY': {
      const replyText = action.text || '';
      // Victory detection: either the scripted "MISSION SUCCESS" phrase OR
      // the password itself leaks. The scripted phrase is what the system
      // prompt asks for, but LLMs paraphrase sometimes — the password leak
      // is the real semantic signal of victory.
      const won =
        /MISSION\s+SUCCESS/i.test(replyText) ||
        /OLD\s+TREEHOUSE\s+BEHIND\s+THE\s+LIBRARY/i.test(replyText);
      const lost = /MISSION\s+FAILED/i.test(replyText);
      return {
        ...state,
        challengeMessages: [
          ...state.challengeMessages,
          { role: 'agent', text: replyText },
        ],
        challengeSending: false,
        phase: won ? 'VICTORY' : lost ? 'CHALLENGE' : state.phase,
        challengeProgress: won ? 10 : state.challengeProgress,
      };
    }

    case 'CHALLENGE_COACH_NOTE':
      return {
        ...state,
        challengeCoachNotes: [
          ...state.challengeCoachNotes,
          { text: action.text },
        ],
        challengeProgress:
          typeof action.progress === 'number'
            ? action.progress
            : state.challengeProgress,
      };

    case 'CHALLENGE_ERROR':
      return {
        ...state,
        challengeSending: false,
        challengeError: action.error,
      };

    case 'CHALLENGE_RESTART':
      return {
        ...state,
        ...freshChallengeState(),
        phase: 'CHALLENGE',
        selectedChallenge: state.selectedChallenge || INTEL_GUARDIAN,
        challengeMessages: [{ role: 'agent', text: SPROUT_GREETING_TEXT }],
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

// DALL-E 3 ALWAYS rewrites prompts internally (visible in server logs as
// `revised_prompt`). Two gotchas baked into this design from painful
// smoke-test results:
//
// 1) ANY labeled instruction like "Reminder:" or "Subject to illustrate:"
//    gets echoed by DALL-E's rewriter and then rendered as literal signs
//    or banners in the image. So the wrapping rules here are written as
//    plain descriptive sentences with no colon-labeled headers.
//
// 2) Patent Pending has to be framed as a CARTOON CHARACTER, not a
//    machine/contraption/device/mechanism. Those words are inseparable
//    from blueprint/patent/technical-diagram imagery in DALL-E's training
//    data — no amount of "no text" override wins. Pixar-style character
//    framing steers DALL-E firmly into animated-character-design space
//    where text captions don't belong.
const IMAGE_PROMPT_BUILDERS = {
  metamorphosis: (w) =>
    `A ${w.adj1} ${w.noun1} creature with ${w.adj2} ${w.noun2} and ${w.adj3} ${w.noun3}. ` +
    `Shown ${w.verb1} through ${w.noun4}. ` +
    `Full-body cartoon illustration, centered subject, vivid colors.`,

  'spatial-recalibration': (w) =>
    `An indoor office scene. ${w.adj1}, ${w.adj2} walls. ` +
    `${w.noun1} stand in every corner. ${w.noun2} hang from the ceiling. ` +
    `In the break room: ${w.noun3} and ${w.noun4}. ` +
    `Desks made of ${w.noun5}, ${w.adj3}, with ${w.noun6} on top. ` +
    `A ${w.adj4} ${w.noun7} in the lobby. ` +
    `Wide-angle cartoon illustration of the room, vivid colors.`,

  // Patent Pending: we drop verb2/verb3/verb4 (the three simultaneous
  // actions) and verb5 (activation behavior) from the image prompt. Action
  // verb lists get rendered as labeled callouts pointing to the character.
  // Those verbs are abstract motion anyway (hard to depict in a still
  // frame); they stay in the kid-facing story template for the narration,
  // just not in the DALL-E prompt.
  'patent-pending': (w) =>
    `A cartoon Pixar-style character named "${w.noun1}" with a friendly face ` +
    `and googly eyes, ${w.adj1} in appearance, holding a ${w.noun2} in its hands. ` +
    `It is surrounded by a swirl of floating ${w.noun3}. ` +
    `Centered on a plain colorful background. Friendly cartoon character portrait, ` +
    `no technical elements, no diagrams, no labels pointing to parts.`,
};

// These are plain descriptive sentences on purpose. Earlier versions used
// "Subject to illustrate:" and "Reminder:" which DALL-E literally rendered
// as signs and banners.
const ANTI_TEXT_PREFIX =
  'A purely pictorial illustration with absolutely no text, letters, numbers, ' +
  'words, captions, writing, labels, signage, annotations, callouts, or ' +
  'typography of any kind anywhere in the image. Not a patent drawing, not a ' +
  'technical diagram, not a blueprint, not a schematic, not a book illustration ' +
  'page, not a comic panel, not an annotated figure. Pure visual art only.';

function buildImagePrompt(madLib, collectedWords) {
  const builder = IMAGE_PROMPT_BUILDERS[madLib.id];
  if (!builder) {
    throw new Error(`No image prompt builder for Mad Lib: ${madLib.id}`);
  }
  const subject = builder(collectedWords);
  return `${ANTI_TEXT_PREFIX}\n\n${subject}`;
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const requestIdRef = useRef(0);

  // Fire image request whenever imageLoading flips true (REVEAL start + retries).
  useEffect(() => {
    if (!state.selectedMadLib || !state.imageLoading) return;
    const myRequestId = ++requestIdRef.current;
    const prompt = buildImagePrompt(state.selectedMadLib, state.collectedWords);

    console.groupCollapsed(
      `%c[image] request #${myRequestId} — ${state.selectedMadLib.codename}`,
      'color:#ffd95e;font-weight:bold',
    );
    console.log('prompt:\n' + prompt);
    console.log('collected words:', state.collectedWords);
    console.groupEnd();

    const startedAt = performance.now();
    fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    })
      .then(async (r) => ({ ok: r.ok, status: r.status, data: await r.json().catch(() => ({})) }))
      .then(({ ok, status, data }) => {
        if (myRequestId !== requestIdRef.current) return;
        const elapsed = ((performance.now() - startedAt) / 1000).toFixed(1);
        if (ok && data.url) {
          console.log(
            `%c[image] response #${myRequestId} — ok in ${elapsed}s`,
            'color:#3fd8e0',
            { url: data.url },
          );
          dispatch({ type: 'IMAGE_READY', url: data.url });
        } else {
          console.warn(
            `[image] response #${myRequestId} — FAILED in ${elapsed}s (HTTP ${status})`,
            data,
          );
          dispatch({ type: 'IMAGE_ERROR', error: data.error || 'Image generation failed' });
        }
      })
      .catch((err) => {
        if (myRequestId !== requestIdRef.current) return;
        console.error(`[image] request #${myRequestId} threw:`, err);
        dispatch({ type: 'IMAGE_ERROR', error: err.message || 'Network error' });
      });
  }, [state.selectedMadLib, state.imageLoading]);

  // STORY → IMAGE is now gated on an explicit Continue click (StoryScreen),
  // not on automatic transition when the image resolves.

  const themeClass = state.selectedMadLib
    ? `theme-${state.selectedMadLib.theme}`
    : state.selectedChallenge
    ? `theme-${state.selectedChallenge.theme}`
    : '';

  return (
    <div className={`app ${themeClass}`.trim()}>
      {state.phase === 'SELECTION' && (
        <SelectionScreen madLibs={MAD_LIBS} challenges={[INTEL_GUARDIAN]} dispatch={dispatch} />
      )}
      {state.phase === 'COLLECTION' && (
        <CollectionScreen state={state} dispatch={dispatch} />
      )}
      {state.phase === 'REVEAL' && <RevealScreen dispatch={dispatch} />}
      {state.phase === 'STORY' && (
        <StoryScreen state={state} dispatch={dispatch} />
      )}
      {state.phase === 'IMAGE' && (
        <ImageScreen state={state} dispatch={dispatch} />
      )}
      {state.phase === 'CHALLENGE' && (
        <ChallengeScreen state={state} dispatch={dispatch} />
      )}
      {state.phase === 'VICTORY' && (
        <VictoryScreen state={state} dispatch={dispatch} />
      )}
    </div>
  );
}
