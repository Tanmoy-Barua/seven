import { HABITS } from '../data';
import type { DayLog, HabitId } from '../types';

interface Props {
  day: DayLog;
  onToggle: (id: HabitId) => void;
}

export function HabitList({ day, onToggle }: Props) {
  return (
    <section className="section" style={{ animationDelay: '0.1s' }}>
      <h2>The 7 things</h2>
      <p className="section-lead">Check them off as you do them. Same seven. Every day.</p>
      <ul className="habit-list">
        {HABITS.map((habit) => {
          const done = Boolean(day.habits[habit.id]);
          return (
            <li key={habit.id} className={`habit${done ? ' done' : ''}`}>
              <button
                type="button"
                className="check"
                aria-pressed={done}
                aria-label={`${done ? 'Unmark' : 'Mark'} ${habit.title}`}
                onClick={() => onToggle(habit.id)}
              >
                {done ? '✓' : ''}
              </button>
              <div>
                <p className="habit-title">
                  <span className="habit-num">{habit.number}.</span>
                  {habit.title}
                </p>
                <p className="habit-detail">{habit.detail}</p>
                <p className="habit-cue">{habit.cue}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
