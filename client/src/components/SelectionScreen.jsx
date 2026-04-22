export default function SelectionScreen({ madLibs, dispatch }) {
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
      </div>
      <footer className="selection-footer">
        <img src="/brand/amivero-logo-tagline-white.webp" alt="Amivero" />
        <span>Take Your Child to Work Day 2026</span>
      </footer>
    </div>
  );
}
