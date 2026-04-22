export default function ImageScreen({ state, dispatch }) {
  const { imageUrl, imageError, selectedMadLib, collectedWords } = state;

  const slotById = Object.fromEntries(
    selectedMadLib.slots.map((s) => [s.id, s]),
  );

  return (
    <div className="showcase">
      <div className="showcase-frame-wrap">
        <div className="art-frame">
          {imageError ? (
            <div className="art-frame-panel art-frame-error">
              <h3>Image generation failed</h3>
              <p>{imageError}</p>
              <button onClick={() => dispatch({ type: 'RETRY_IMAGE' })}>
                Try Again
              </button>
            </div>
          ) : imageUrl ? (
            <div className="art-frame-mat">
              <img
                src={imageUrl}
                alt={`Scene from ${selectedMadLib.codename}`}
                className="art-frame-image"
              />
            </div>
          ) : (
            <div className="art-frame-panel art-frame-loading">
              <div className="spinner" />
              <p>Generating image…</p>
            </div>
          )}
        </div>
      </div>

      <div className="showcase-story-wrap">
        <p className="showcase-story">
          {selectedMadLib.template.map((token, i) => {
            if (token.type === 'text') {
              return (
                <span key={i} className="showcase-story-token showcase-story-text">
                  {token.value}
                </span>
              );
            }
            const slot = slotById[token.slotId];
            const word = collectedWords[token.slotId];
            return (
              <span key={i} className="showcase-story-token showcase-story-slot">
                <span className="showcase-slot-word">{word}</span>
                <span className="showcase-slot-type">{slot.type}</span>
              </span>
            );
          })}
        </p>
      </div>

      <button
        className="showcase-reset"
        onClick={() => dispatch({ type: 'RESET' })}
      >
        Reset
      </button>
    </div>
  );
}
