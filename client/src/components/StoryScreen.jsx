import { useEffect } from 'react';

// Pacing: text tokens land roughly every 350ms, slot (filled word) tokens get
// a longer beat at 600ms for emphasis. Tuned to feel dramatic without dragging.
const TEXT_DELAY_MS = 350;
const SLOT_DELAY_MS = 600;

export default function StoryScreen({ state, dispatch }) {
  const {
    selectedMadLib,
    collectedWords,
    storyTokenIndex,
    storyComplete,
  } = state;

  const template = selectedMadLib.template;
  const slotById = Object.fromEntries(
    selectedMadLib.slots.map((s) => [s.id, s]),
  );

  useEffect(() => {
    if (storyComplete) return;
    if (storyTokenIndex >= template.length) {
      dispatch({ type: 'STORY_COMPLETE' });
      return;
    }
    const nextToken = template[storyTokenIndex];
    const delay = nextToken.type === 'slot' ? SLOT_DELAY_MS : TEXT_DELAY_MS;
    const timer = setTimeout(() => {
      dispatch({ type: 'ADVANCE_TOKEN' });
    }, delay);
    return () => clearTimeout(timer);
  }, [storyTokenIndex, storyComplete, template, dispatch]);

  const visibleTokens = template.slice(0, storyTokenIndex);

  return (
    <div className="story-screen">
      <p className="story-text">
        {visibleTokens.map((token, i) => {
          if (token.type === 'text') {
            return (
              <span key={i} className="story-token story-token-text">
                {token.value}
              </span>
            );
          }
          const slot = slotById[token.slotId];
          const word = collectedWords[token.slotId];
          return (
            <span key={i} className="story-token story-token-slot">
              <span className="story-slot-word">{word}</span>
              <span className="story-slot-type">{slot.type}</span>
            </span>
          );
        })}
      </p>

      {storyComplete && (
        <button
          className="story-continue"
          onClick={() => dispatch({ type: 'GO_TO_IMAGE' })}
          autoFocus
        >
          Continue →
        </button>
      )}
    </div>
  );
}
