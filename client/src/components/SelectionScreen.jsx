export default function SelectionScreen({ madLibs, challenges = [], dispatch }) {
  return (
    <div className="selection-screen">
      <div className="selection-starfield" aria-hidden="true" />

      <div className="selection-header">
        <span className="selection-eyebrow">Take Your Child to Work Day 2026</span>
        <h1 className="selection-title">Mission Select</h1>
        <p className="selection-subtitle">Pick your mission, Agent.</p>
      </div>

      <div className="selection-cards">
        {madLibs.map((madLib) => (
          <button
            key={madLib.id}
            className={`selection-card selection-card-${madLib.theme}`}
            onClick={() => dispatch({ type: 'SELECT_MAD_LIB', madLib })}
          >
            <span className="selection-card-watermark" aria-hidden="true" />
            <span className="selection-card-content">
              <span className="selection-card-codename">{madLib.codename}</span>
              {madLib.description && (
                <span className="selection-card-desc">{madLib.description}</span>
              )}
            </span>
          </button>
        ))}
        {challenges.map((challenge) => (
          <button
            key={challenge.id}
            className={`selection-card selection-card-${challenge.theme}`}
            onClick={() => dispatch({ type: 'SELECT_CHALLENGE', challenge })}
          >
            <span className="selection-card-watermark" aria-hidden="true" />
            <span className="selection-card-tag">Challenge</span>
            <span className="selection-card-content">
              <span className="selection-card-codename">{challenge.codename}</span>
              {challenge.description && (
                <span className="selection-card-desc">{challenge.description}</span>
              )}
            </span>
          </button>
        ))}
      </div>

      <footer className="selection-footer">
        <img src="/brand/amivero-logo-tagline-white.webp" alt="Amivero" />
      </footer>
    </div>
  );
}
