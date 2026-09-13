import { IGNORE_LIST, MILESTONES } from '../data';

interface Props {
  daysActive: number;
  streak: number;
}

export function ProgressPanel({ daysActive, streak }: Props) {
  return (
    <>
      <section className="section" style={{ animationDelay: '0.3s' }}>
        <h2>How long it takes</h2>
        <p className="section-lead">
          Day {daysActive}. Streak (4+ habits): {streak} day{streak === 1 ? '' : 's'}.
        </p>
        <ul className="milestone-list">
          {MILESTONES.map((m) => {
            const reached = daysActive >= m.days;
            return (
              <li key={m.days} className={`milestone${reached ? ' reached' : ''}`}>
                <div className="milestone-label">{m.label}</div>
                <p className="milestone-result">
                  {reached ? '✓ ' : ''}
                  {m.result}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="section" style={{ animationDelay: '0.34s' }}>
        <h2>What to ignore</h2>
        <p className="section-lead">Noise that pretends to help.</p>
        <ul className="ignore-list">
          {IGNORE_LIST.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </>
  );
}
