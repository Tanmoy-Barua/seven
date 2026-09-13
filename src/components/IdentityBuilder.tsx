import { useState, type FormEvent } from 'react';
import type { IdentityTrigger } from '../types';

interface Props {
  triggers: IdentityTrigger[];
  onAdd: (identity: string, trigger: string) => void;
  onRemove: (id: string) => void;
}

export function IdentityBuilder({ triggers, onAdd, onRemove }: Props) {
  const [identity, setIdentity] = useState("I'm a person who sleeps well");
  const [trigger, setTrigger] = useState('When it’s 10 pm, I put my phone in the kitchen');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!identity.trim() || !trigger.trim()) return;
    onAdd(identity, trigger);
    setIdentity("I'm a person who ");
    setTrigger('When ');
  };

  return (
    <section className="section" style={{ animationDelay: '0.26s' }}>
      <h2>Make it stick</h2>
      <p className="section-lead">
        Don’t say “I should.” Say who you are. Then pick a trigger.
      </p>
      <form className="trigger-form" onSubmit={submit}>
        <div className="field">
          <label htmlFor="identity">Identity</label>
          <input
            id="identity"
            value={identity}
            onChange={(e) => setIdentity(e.target.value)}
            placeholder="I'm a person who…"
          />
        </div>
        <div className="field">
          <label htmlFor="trigger">Trigger</label>
          <input
            id="trigger"
            value={trigger}
            onChange={(e) => setTrigger(e.target.value)}
            placeholder="When X, I Y"
          />
        </div>
        <button type="submit" className="btn">
          Add cue
        </button>
      </form>
      {triggers.length === 0 ? (
        <p className="empty">No cues yet. Add one identity + trigger pair.</p>
      ) : (
        <ul className="trigger-list">
          {triggers.map((item) => (
            <li key={item.id} className="trigger-card">
              <p className="trigger-identity">{item.identity}</p>
              <p className="trigger-when">{item.trigger}</p>
              <div className="trigger-actions">
                <button type="button" className="btn ghost" onClick={() => onRemove(item.id)}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
