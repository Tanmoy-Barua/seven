import { useEffect, useState } from 'react';

interface Props {
  note: string;
  onChange: (note: string) => void;
}

export function HardThing({ note, onChange }: Props) {
  const [draft, setDraft] = useState(note);

  useEffect(() => {
    setDraft(note);
  }, [note]);

  return (
    <section className="section" style={{ animationDelay: '0.22s' }}>
      <h2>One small hard thing</h2>
      <p className="section-lead">Cold shower. Tough set. Scary call. Write it, then do it.</p>
      <div className="field">
        <label htmlFor="hard-thing">Today’s hard thing</label>
        <textarea
          id="hard-thing"
          value={draft}
          placeholder="e.g. Call the dentist. Or finish the hard email."
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => onChange(draft)}
        />
      </div>
      <div className="timer-actions" style={{ marginTop: '0.75rem' }}>
        <button type="button" className="btn secondary" onClick={() => onChange(draft)}>
          Save
        </button>
      </div>
    </section>
  );
}
