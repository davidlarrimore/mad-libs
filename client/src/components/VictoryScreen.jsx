export default function VictoryScreen({ state, dispatch }) {
  // The final agent message is Sprout's "MISSION SUCCESS!" line — render
  // it front and center as the reveal.
  const finalMessage =
    [...state.challengeMessages]
      .reverse()
      .find((m) => m.role === 'agent')?.text || 'Mission Success!';

  return (
    <div className="victory-screen">
      {/* 40 confetti pieces, deterministic angles via nth-child in CSS */}
      <div className="victory-confetti" aria-hidden="true">
        {Array.from({ length: 40 }).map((_, i) => (
          <span key={i} className={`confetti-piece confetti-piece-${i % 5}`} />
        ))}
      </div>

      <div className="victory-content">
        <h1 className="victory-title">🎉 MISSION SUCCESS! 🎉</h1>
        <p className="victory-body">{finalMessage}</p>
        <div className="victory-actions">
          <button
            type="button"
            className="victory-btn victory-btn-primary"
            onClick={() => dispatch({ type: 'CHALLENGE_RESTART' })}
          >
            Try Again
          </button>
          <button
            type="button"
            className="victory-btn"
            onClick={() => dispatch({ type: 'RESET' })}
          >
            Back to Missions
          </button>
        </div>
      </div>
    </div>
  );
}
