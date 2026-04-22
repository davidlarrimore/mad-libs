import { useEffect, useState } from 'react';

export default function RevealScreen({ dispatch }) {
  const [stage, setStage] = useState('pulse'); // pulse → flash → black → (unmount)

  useEffect(() => {
    const t1 = setTimeout(() => setStage('flash'), 1500);
    const t2 = setTimeout(() => setStage('black'), 1800);
    const t3 = setTimeout(() => dispatch({ type: 'START_STORY' }), 2300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [dispatch]);

  return (
    <div className={`reveal-screen reveal-${stage}`}>
      {stage === 'pulse' && <div className="reveal-text">REVEAL</div>}
      {stage === 'flash' && <div className="reveal-flash" />}
    </div>
  );
}
