export default function SelectionScreen({ madLibs, challenges = [], dispatch }) {
  return (
    <div className="selection-screen">
      <h1 className="selection-title">Mission Select</h1>
      <div className="selection-cards">
        {madLibs.map((madLib) => (
          <button
            key={madLib.id}
            className="selection-card"
            onClick={() => dispatch({ type: 'SELECT_MAD_LIB', madLib })}
          >
            {madLib.codename}
          </button>
        ))}
        {challenges.map((challenge) => (
          <button
            key={challenge.id}
            className="selection-card selection-card-challenge"
            onClick={() => dispatch({ type: 'SELECT_CHALLENGE', challenge })}
          >
            <span className="selection-card-tag">Challenge</span>
            {challenge.codename}
          </button>
        ))}
      </div>
      <footer className="selection-footer">
        <img src="/brand/amivero-logo-tagline-white.webp" alt="Amivero" />
        <span>Take Your Child to Work Day 2026</span>
      </footer>
    </div>
  );
}
