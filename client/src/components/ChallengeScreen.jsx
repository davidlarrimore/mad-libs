import { useState, useRef, useEffect } from 'react';
import {
  SPROUT_SYSTEM_PROMPT,
  COACH_SYSTEM_PROMPT,
  INTEL_GUARDIAN,
} from '../data/challenges.js';
import MissionBack from './MissionBack.jsx';

// Build a single user-message payload for the coach describing the full
// exchange so far. The coach is stateless from OpenAI's perspective each
// turn — we re-send the entire history every time as one block.
function formatTranscriptForCoach(history) {
  const lines = history.map((m) =>
    m.role === 'agent' ? `Agent Sprout: ${m.text}` : `Student: ${m.text}`,
  );
  return (
    `Here is the conversation so far between the student and Agent Sprout:\n\n` +
    lines.join('\n') +
    `\n\nWrite your one-sentence observation for the student now. ` +
    `Remember to include <progress>N</progress> at the end.`
  );
}

function parseCoachResponse(content) {
  const progressMatch = content.match(/<progress>\s*(\d+)\s*<\/progress>/i);
  const progress = progressMatch
    ? Math.max(0, Math.min(10, parseInt(progressMatch[1], 10)))
    : null;
  const text = content.replace(/<progress>[\s\S]*?<\/progress>/gi, '').trim();
  return { text, progress };
}

export default function ChallengeScreen({ state, dispatch }) {
  const {
    challengeMessages,
    challengeCoachNotes,
    challengeProgress,
    challengeSending,
    challengeError,
    selectedChallenge,
  } = state;

  const challenge = selectedChallenge || INTEL_GUARDIAN;

  const [input, setInput] = useState('');
  const inputRef = useRef(null);
  const chatEndRef = useRef(null);
  const coachEndRef = useRef(null);

  useEffect(() => {
    if (!challengeSending) inputRef.current?.focus();
  }, [challengeSending, challengeMessages.length]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [challengeMessages, challengeSending]);

  useEffect(() => {
    coachEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [challengeCoachNotes]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || challengeSending) return;

    // The history we'll send is the current messages PLUS the new user one
    // (the reducer appends it in CHALLENGE_SEND at the same time).
    const historyWithNew = [
      ...challengeMessages,
      { role: 'user', text },
    ];

    dispatch({ type: 'CHALLENGE_SEND', text });
    setInput('');

    console.groupCollapsed(
      `%c[challenge] turn — student says: "${text.slice(0, 40)}…"`,
      'color:#4ade80;font-weight:bold',
    );

    const agentPayload = {
      label: 'sprout',
      systemPrompt: SPROUT_SYSTEM_PROMPT,
      messages: historyWithNew.map((m) => ({
        role: m.role === 'agent' ? 'assistant' : 'user',
        content: m.text,
      })),
    };

    const coachPayload = {
      label: 'coach',
      systemPrompt: COACH_SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: formatTranscriptForCoach(historyWithNew) },
      ],
      temperature: 0.7,
      maxTokens: 120,
    };

    try {
      const [agentRes, coachRes] = await Promise.all([
        fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(agentPayload),
        }).then((r) => r.json()),
        fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(coachPayload),
        }).then((r) => r.json()),
      ]);

      console.log('agent reply:', agentRes.content);
      console.log('coach note:', coachRes.content);
      console.groupEnd();

      if (agentRes.error) {
        dispatch({
          type: 'CHALLENGE_ERROR',
          error: `Agent error: ${agentRes.error}`,
        });
      } else {
        dispatch({ type: 'CHALLENGE_AGENT_REPLY', text: agentRes.content });
      }

      if (!coachRes.error && coachRes.content) {
        const { text: coachText, progress } = parseCoachResponse(
          coachRes.content,
        );
        if (coachText) {
          dispatch({
            type: 'CHALLENGE_COACH_NOTE',
            text: coachText,
            progress,
          });
        }
      }
    } catch (err) {
      console.error('Challenge turn failed:', err);
      console.groupEnd();
      dispatch({
        type: 'CHALLENGE_ERROR',
        error: err.message || 'Network error',
      });
    }
  };

  const progressPercent = Math.min(100, (challengeProgress / 10) * 100);

  return (
    <div className="challenge-screen">
      <MissionBack dispatch={dispatch} />
      <header className="challenge-header">
        <div className="challenge-title">
          <span className="challenge-title-label">Mission</span>
          <span className="challenge-title-main">
            {challenge.codename.toUpperCase()}
          </span>
        </div>
      </header>

      <div className="challenge-body">
        <section className="challenge-chat" aria-label="Conversation">
          <div className="challenge-chat-header">
            <span className="challenge-chat-avatar">🕵️</span>
            <span className="challenge-chat-name">AGENT SPROUT</span>
            <span className="challenge-chat-status">
              {challengeSending ? 'typing…' : 'on duty'}
            </span>
          </div>

          <div className="challenge-chat-log">
            {challengeMessages.map((m, i) => (
              <div
                key={i}
                className={`chat-message chat-message-${m.role}`}
              >
                <div className="chat-bubble">{m.text}</div>
              </div>
            ))}
            {challengeSending && (
              <div className="chat-message chat-message-agent">
                <div className="chat-bubble chat-typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            {challengeError && (
              <div className="chat-message chat-message-error">
                <div className="chat-bubble">{challengeError}</div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </section>

        <aside className="challenge-coach" aria-label="Coach notes">
          {challenge.briefing && (
            <div className="challenge-briefing">
              <div className="challenge-briefing-label">Mission Briefing</div>
              <p className="challenge-briefing-text">{challenge.briefing}</p>
            </div>
          )}

          <div className="challenge-coach-header">
            <span className="challenge-coach-emoji">🎓</span>
            <span className="challenge-coach-name">COACH'S NOTES</span>
          </div>

          <div className="challenge-coach-notes">
            {challengeCoachNotes.length === 0 && (
              <p className="challenge-coach-empty">
                Try talking to Agent Sprout! I'll drop hints here as you go. 🌟
              </p>
            )}
            {challengeCoachNotes.map((note, i) => (
              <div key={i} className="challenge-coach-note">
                {note.text}
              </div>
            ))}
            <div ref={coachEndRef} />
          </div>

          <div className="challenge-coach-progress">
            <div className="challenge-progress-label">
              <span>Progress</span>
              <span>{challengeProgress} / 10</span>
            </div>
            <div className="challenge-progress-track">
              <div
                className="challenge-progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </aside>
      </div>

      <form onSubmit={handleSubmit} className="challenge-input-bar">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message to Agent Sprout…"
          className="challenge-input"
          disabled={challengeSending}
          autoComplete="off"
          spellCheck="false"
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
        />
        <button
          type="submit"
          className="challenge-send"
          disabled={challengeSending || !input.trim()}
        >
          Send
        </button>
        <button
          type="button"
          className="challenge-reset"
          onClick={() => dispatch({ type: 'CHALLENGE_RESTART' })}
          title="Restart the challenge with a fresh Agent Sprout"
        >
          Reset
        </button>
      </form>
    </div>
  );
}
