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

function buildImagePrompt(madLib, collectedWords) {
  // Each Mad Lib carries its own `imagePrompt` template with {slotId}
  // placeholders — prompts are shaped per use case so DALL-E can produce
  // something coherent for the particular aesthetic (creature concept art,
  // surreal office rendering, steampunk oil painting) without slipping
  // into text-rendering modes. See madlibs.js for the templates.
  return madLib.imagePrompt.replace(
    /\{(\w+)\}/g,
    (_, slotId) => collectedWords[slotId] ?? `[${slotId}]`,
  );
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
