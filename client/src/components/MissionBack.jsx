// Shared top-right "← Missions" button used across every in-mission screen
// so operators can bail out consistently no matter which phase they're in.

export default function MissionBack({ dispatch }) {
  return (
    <button
      type="button"
      className="mission-back"
      onClick={() => dispatch({ type: 'RESET' })}
      title="Back to Mission Select"
    >
      ← Missions
    </button>
  );
}
