import { useEffect } from 'react';
import MissionBack from './MissionBack.jsx';

// Pacing: text tokens land every 500ms, slot (filled word) tokens get a longer
// 900ms beat for emphasis. Slower feels more theatrical; Continue gate lets
// the operator advance manually if a particular group wants it snappier.
const TEXT_DELAY_MS = 500;
const SLOT_DELAY_MS = 900;

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
      <MissionBack dispatch={dispatch} />
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
