import { DAY_SCHEDULE } from '../data';
import type { DayLog } from '../types';

interface Props {
  day: DayLog;
  onToggle: (id: string) => void;
}

export function DaySchedule({ day, onToggle }: Props) {
  return (
    <section className="section" style={{ animationDelay: '0.14s' }}>
      <h2>Your day</h2>
      <p className="section-lead">One composition for the hours. Follow the flow, not the noise.</p>
      <ul className="schedule-list">
        {DAY_SCHEDULE.map((item) => {
          const done = Boolean(day.scheduleDone[item.id]);
          return (
            <li key={item.id} className={`schedule-item${done ? ' done' : ''}`}>
              <button
                type="button"
                className="dot"
                aria-pressed={done}
                aria-label={`${done ? 'Unmark' : 'Mark'} ${item.label}`}
                onClick={() => onToggle(item.id)}
              />
              <div>
                <p className="schedule-label">{item.label}</p>
                <p className="schedule-hint">{item.hint}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
