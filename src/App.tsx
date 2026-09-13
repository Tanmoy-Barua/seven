import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { DaySchedule } from './components/DaySchedule';
import { FocusTimer } from './components/FocusTimer';
import { HabitList } from './components/HabitList';
import { HardThing } from './components/HardThing';
import { IdentityBuilder } from './components/IdentityBuilder';
import { ProgressPanel } from './components/ProgressPanel';
import { HABITS } from './data';
import {
  addFocusMinutes,
  addTrigger,
  countCompletedHabits,
  daysSinceStart,
  getDay,
  loadState,
  removeTrigger,
  saveState,
  setHardThingNote,
  streakDays,
  toggleHabit,
  toggleSchedule,
} from './storage';
import type { AppState, HabitId } from './types';

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const day = getDay(state);
  const done = countCompletedHabits(day);
  const total = HABITS.length;
  const streak = streakDays(state);
  const activeDays = daysSinceStart(state);
  const todayLabel = format(new Date(), 'EEEE, MMMM d');

  useEffect(() => {
    saveState(state);
  }, [state]);

  const onToggleHabit = (id: HabitId) => {
    setState((s) => toggleHabit(s, id));
  };

  const onToggleSchedule = (id: string) => {
    setState((s) => toggleSchedule(s, id));
  };

  const onHardThing = (note: string) => {
    setState((s) => setHardThingNote(s, note));
  };

  const onFocusComplete = useCallback((minutes: number) => {
    setState((s) => {
      let next = addFocusMinutes(s, minutes);
      // Auto-check deep work when you log a full 2-hour block (or accumulate to 120)
      const d = getDay(next);
      if (d.focusMinutes >= 120 && !d.habits.deepWork) {
        next = toggleHabit(next, 'deepWork');
      }
      return next;
    });
  }, []);

  const onAddTrigger = (identity: string, trigger: string) => {
    setState((s) => addTrigger(s, identity, trigger));
  };

  const onRemoveTrigger = (id: string) => {
    setState((s) => removeTrigger(s, id));
  };

  return (
    <div className="app">
      <header className="hero">
        <div className="brand-row">
          <h1 className="brand">
            SEV<span>EN</span>
          </h1>
          <div className="date-chip">{todayLabel}</div>
        </div>
        <div className="hero-copy">
          <p>
            <strong>What actually works.</strong> Seven things. Your day. Make it stick.
          </p>
        </div>
        <div className="progress-panel">
          <div
            className="ring"
            style={{ ['--pct' as string]: (done / total) * 100 }}
            aria-label={`${done} of ${total} habits done`}
          >
            {done}/{total}
          </div>
          <div className="progress-copy">
            <h2>{done === total ? 'All seven. That’s the whole game.' : 'Today’s seven'}</h2>
            <p>
              {done === 0
                ? 'Start anywhere. The list doesn’t care about order.'
                : done < total
                  ? `${total - done} left. Keep going.`
                  : 'Rest knowing you showed up.'}
            </p>
            <div className="streak">
              <span className="pill">Streak · {streak} day{streak === 1 ? '' : 's'}</span>
              <span className="pill">Day {activeDays}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="layout">
        <div className="stack">
          <HabitList day={day} onToggle={onToggleHabit} />
          <DaySchedule day={day} onToggle={onToggleSchedule} />
          <FocusTimer
            focusMinutesToday={day.focusMinutes}
            onCompleteBlock={onFocusComplete}
          />
        </div>
        <div className="stack">
          <HardThing note={day.hardThingNote} onChange={onHardThing} />
          <IdentityBuilder
            triggers={state.triggers}
            onAdd={onAddTrigger}
            onRemove={onRemoveTrigger}
          />
          <ProgressPanel daysActive={activeDays} streak={streak} />
        </div>
      </div>

      <p className="footer-note">
        Saved on this device. No accounts. No gadgets. Just the seven.
      </p>
    </div>
  );
}
