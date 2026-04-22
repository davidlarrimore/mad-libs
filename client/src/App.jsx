import { useReducer, useEffect, useRef } from 'react';
import { MAD_LIBS } from './data/madlibs.js';
import SelectionScreen from './components/SelectionScreen.jsx';
import CollectionScreen from './components/CollectionScreen.jsx';
import RevealScreen from './components/RevealScreen.jsx';
import StoryScreen from './components/StoryScreen.jsx';
import ImageScreen from './components/ImageScreen.jsx';

const initialState = {
  phase: 'SELECTION',
  selectedMadLib: null,
  collectedWords: {},
  currentSlotIndex: 0,
  imageUrl: null,
  imageError: null,
  imageLoading: false,
  storyTokenIndex: 0,
  storyComplete: false,
};

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

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

// Prefixed (not appended!) to every image prompt. DALL-E 3 weights the
// beginning of the prompt far more than the end, and it ALWAYS rewrites
// the prompt internally before generating. A "no text" rule tacked on at
// the end gets weak-weighted and ignored once DALL-E has decided it's
// looking at a patent/diagram description. Putting the negative constraints
// first forces the model to commit to "pure illustration, no annotations"
// before it sees the description. We also forbid specific text-heavy
// styles by name because that's the most reliable way to keep DALL-E
// out of patent-drawing / technical-diagram / book-page modes.
const ANTI_TEXT_PREFIX =
  'Generate a single purely pictorial illustration. ' +
  'ABSOLUTELY NO text, letters, numbers, words, captions, writing, labels, ' +
  'signage, annotations, callouts, or typography of any kind may appear ' +
  'anywhere in the image. ' +
  'Do NOT render this as a patent drawing, technical diagram, blueprint, ' +
  'schematic, book illustration page, comic panel, or annotated figure. ' +
  'Style it as vibrant illustration art, not a document. ' +
  'Subject to illustrate:';

const ANTI_TEXT_SUFFIX =
  'Reminder: the image must be entirely wordless. Pure visual illustration only.';

function buildImagePrompt(madLib, collectedWords) {
  const storyText = madLib.template
    .map((token) =>
      token.type === 'text' ? token.value : collectedWords[token.slotId],
    )
    .join('')
    .trim();
  return `${ANTI_TEXT_PREFIX}\n\n${storyText}\n\n${ANTI_TEXT_SUFFIX}`;
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

  const themeClass = state.selectedMadLib ? `theme-${state.selectedMadLib.theme}` : '';

  return (
    <div className={`app ${themeClass}`.trim()}>
      {state.phase === 'SELECTION' && (
        <SelectionScreen madLibs={MAD_LIBS} dispatch={dispatch} />
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
    </div>
  );
}
