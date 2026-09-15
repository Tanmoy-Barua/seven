import { useCallback, useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import {
  fetchMe,
  fetchState,
  getDataMode,
  getToken,
  logout,
  saveRemoteState,
  setToken,
  type AuthUser,
} from './api';
import { AuthScreen } from './components/AuthScreen';
import { DaySchedule } from './components/DaySchedule';
import { FocusTimer } from './components/FocusTimer';
import { HabitList } from './components/HabitList';
import { HardThing } from './components/HardThing';
import { HistoryPanel } from './components/HistoryPanel';
import { IdentityBuilder } from './components/IdentityBuilder';
import { InstallPrompt } from './components/InstallPrompt';
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

type SyncStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [state, setState] = useState<AppState | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [historyKey, setHistoryKey] = useState(0);
  const skipNextSave = useRef(true);
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!getToken()) {
        if (alive) setAuthChecking(false);
        return;
      }
      try {
        const me = await fetchMe();
        const remote = await fetchState();
        if (!alive) return;
        const local = loadState();
        const remoteEmpty =
          Object.keys(remote.days || {}).length === 0 && (remote.triggers || []).length === 0;
        const localHasData =
          Object.keys(local.days || {}).length > 0 || (local.triggers || []).length > 0;
        setUser(me.user);
        setState(
          remoteEmpty && localHasData ? { ...local, startDate: me.user.startDate } : remote,
        );
        skipNextSave.current = true;
      } catch {
        setToken(null);
      } finally {
        if (alive) setAuthChecking(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!state || !user) return;
    saveState(state);
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    setSyncStatus('saving');
    saveTimer.current = window.setTimeout(async () => {
      try {
        await saveRemoteState(state);
        setSyncStatus('saved');
        setHistoryKey((k) => k + 1);
      } catch {
        setSyncStatus('error');
      }
    }, 450);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [state, user]);

  const onAuthed = async (nextUser: AuthUser) => {
    const remote = await fetchState();
    const local = loadState();
    const remoteEmpty =
      Object.keys(remote.days || {}).length === 0 && (remote.triggers || []).length === 0;
    const localHasData =
      Object.keys(local.days || {}).length > 0 || (local.triggers || []).length > 0;
    const merged =
      remoteEmpty && localHasData ? { ...local, startDate: nextUser.startDate } : remote;
    skipNextSave.current = false;
    setUser(nextUser);
    setState(merged);
    if (remoteEmpty && localHasData) {
      await saveRemoteState(merged);
      setSyncStatus('saved');
    }
    setHistoryKey((k) => k + 1);
  };

  const onLogout = async () => {
    try {
      await logout();
    } catch {
      // clear local session anyway
    }
    setToken(null);
    setUser(null);
    setState(null);
    setSyncStatus('idle');
  };

  const onFocusComplete = useCallback((minutes: number) => {
    setState((s) => {
      if (!s) return s;
      let next = addFocusMinutes(s, minutes);
      const d = getDay(next);
      if (d.focusMinutes >= 120 && !d.habits.deepWork) {
        next = toggleHabit(next, 'deepWork');
      }
      return next;
    });
  }, []);

  if (authChecking) {
    return (
      <div className="auth-shell">
        <p className="empty">Loading…</p>
      </div>
    );
  }

  if (!user || !state) {
    return (
      <>
        <InstallPrompt />
        <AuthScreen onAuthed={onAuthed} />
      </>
    );
  }

  const day = getDay(state);
  const done = countCompletedHabits(day);
  const total = HABITS.length;
  const streak = streakDays(state);
  const activeDays = daysSinceStart(state);
  const todayLabel = format(new Date(), 'EEEE, MMMM d');
  const dataMode = getDataMode();
  const syncLabel =
    syncStatus === 'saving'
      ? dataMode === 'local'
        ? 'Saving on this device…'
        : 'Saving to database…'
      : syncStatus === 'saved'
        ? dataMode === 'local'
          ? 'Saved on this device'
          : 'Saved to database'
        : syncStatus === 'error'
          ? 'Couldn’t save — try again'
          : dataMode === 'local'
            ? 'Device database ready'
            : 'Ready';

  return (
    <div className="app">
      <InstallPrompt />
      <header className="hero">
        <div className="brand-row">
          <h1 className="brand">
            SEV<span>EN</span>
          </h1>
          <div className="account-chip">
            <span className="date-chip">{todayLabel}</span>
            <span className="pill">@{user.username}</span>
            <button type="button" className="btn ghost btn-sm" onClick={onLogout}>
              Log out
            </button>
          </div>
        </div>
        <div className="hero-copy">
          <p>
            <strong>What actually works.</strong> Seven things. Your day. Tracked every day.
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
              <span className="pill">
                Streak · {streak} day{streak === 1 ? '' : 's'}
              </span>
              <span className="pill">Day {activeDays}</span>
              <span className="pill sync-pill">{syncLabel}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="layout">
        <div className="stack">
          <HabitList
            day={day}
            onToggle={(id: HabitId) => setState((s) => (s ? toggleHabit(s, id) : s))}
          />
          <DaySchedule
            day={day}
            onToggle={(id) => setState((s) => (s ? toggleSchedule(s, id) : s))}
          />
          <FocusTimer
            focusMinutesToday={day.focusMinutes}
            onCompleteBlock={onFocusComplete}
          />
        </div>
        <div className="stack">
          <HardThing
            note={day.hardThingNote}
            onChange={(note) => setState((s) => (s ? setHardThingNote(s, note) : s))}
          />
          <IdentityBuilder
            triggers={state.triggers}
            onAdd={(identity, trigger) =>
              setState((s) => (s ? addTrigger(s, identity, trigger) : s))
            }
            onRemove={(id) => setState((s) => (s ? removeTrigger(s, id) : s))}
          />
          <HistoryPanel key={historyKey} />
          <ProgressPanel daysActive={activeDays} streak={streak} />
        </div>
      </div>

      <p className="footer-note">
        {dataMode === 'local'
          ? 'Progress is saved in this browser’s local database (works on Vercel and installed app).'
          : 'Progress is stored in SQLite on the server. Local cache keeps the UI snappy.'}
      </p>
    </div>
  );
}
