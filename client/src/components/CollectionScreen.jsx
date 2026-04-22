import { useState, useEffect, useRef } from 'react';

export default function CollectionScreen({ state, dispatch }) {
  const { selectedMadLib, collectedWords, currentSlotIndex } = state;
  const slots = selectedMadLib.slots;
  const currentSlot = slots[currentSlotIndex];

  const [input, setInput] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    setInput('');
    inputRef.current?.focus();
  }, [currentSlotIndex]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const word = input.trim();
    if (!word) {
      inputRef.current?.focus();
      return;
    }
    dispatch({ type: 'SUBMIT_WORD', slotId: currentSlot.id, word });
  };

  const pickExample = (word) => {
    setInput(word);
    inputRef.current?.focus();
  };

  const filledSlots = slots.slice(0, currentSlotIndex);

  return (
    <div className="collection-screen">
      <div className="collection-left">
        <div className="collection-progress">
          {currentSlotIndex + 1} of {slots.length}
        </div>
        <div className="collection-type">{currentSlot.type}</div>
        <div className="collection-hint">{currentSlot.hint}</div>
        {currentSlot.examples && currentSlot.examples.length > 0 && (
          <div className="collection-examples">
            <span className="collection-examples-label">e.g.</span>
            {currentSlot.examples.map((ex) => (
              <button
                key={ex}
                type="button"
                className="collection-example-pill"
                onClick={() => pickExample(ex)}
              >
                {ex}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={handleSubmit} className="collection-form">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="collection-input"
            autoComplete="off"
            spellCheck="false"
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
          />
          <button type="submit" className="collection-submit">
            Submit
          </button>
        </form>
      </div>

      <div className="collection-right">
        <h2 className="collection-list-header">Words So Far</h2>
        <ul className="collection-list">
          {filledSlots.map((slot) => (
            <li key={slot.id} className="collection-list-item">
              <span className="collection-list-type">[{slot.type}]</span>
              <span className="collection-list-word">{collectedWords[slot.id]}</span>
            </li>
          ))}
          <li className="collection-list-item pending">
            <span className="collection-list-type">[{currentSlot.type}]</span>
            <span className="collection-list-word">___</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
