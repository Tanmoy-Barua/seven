import { format } from 'date-fns';
import type { AppState, DayLog, HabitId, IdentityTrigger } from './types';

const STORAGE_KEY = 'seven-habits-v1';

function todayKey(date = new Date()): string {
  return format(date, 'yyyy-MM-dd');
}

function emptyDay(date: string): DayLog {
  return {
    date,
    habits: {},
    hardThingNote: '',
    scheduleDone: {},
    focusMinutes: 0,
    notes: '',
  };
}

function defaultState(): AppState {
  return {
    days: {},
    triggers: [],
    startDate: todayKey(),
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as AppState;
    return {
      ...defaultState(),
      ...parsed,
      days: parsed.days ?? {},
      triggers: parsed.triggers ?? [],
    };
  } catch {
    return defaultState();
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getDay(state: AppState, date = new Date()): DayLog {
  const key = todayKey(date);
  return state.days[key] ?? emptyDay(key);
}

export function upsertDay(
  state: AppState,
  date: Date,
  updater: (day: DayLog) => DayLog,
): AppState {
  const key = todayKey(date);
  const current = state.days[key] ?? emptyDay(key);
  return {
    ...state,
    days: {
      ...state.days,
      [key]: updater(current),
    },
  };
}

export function toggleHabit(
  state: AppState,
  habitId: HabitId,
  date = new Date(),
): AppState {
  return upsertDay(state, date, (day) => ({
    ...day,
    habits: {
      ...day.habits,
      [habitId]: !day.habits[habitId],
    },
  }));
}

export function toggleSchedule(
  state: AppState,
  itemId: string,
  date = new Date(),
): AppState {
  return upsertDay(state, date, (day) => ({
    ...day,
    scheduleDone: {
      ...day.scheduleDone,
      [itemId]: !day.scheduleDone[itemId],
    },
  }));
}

export function setHardThingNote(
  state: AppState,
  note: string,
  date = new Date(),
): AppState {
  return upsertDay(state, date, (day) => ({
    ...day,
    hardThingNote: note,
  }));
}

export function addFocusMinutes(
  state: AppState,
  minutes: number,
  date = new Date(),
): AppState {
  return upsertDay(state, date, (day) => ({
    ...day,
    focusMinutes: day.focusMinutes + minutes,
  }));
}

export function addTrigger(
  state: AppState,
  identity: string,
  trigger: string,
): AppState {
  const item: IdentityTrigger = {
    id: crypto.randomUUID(),
    identity: identity.trim(),
    trigger: trigger.trim(),
    createdAt: new Date().toISOString(),
  };
  return {
    ...state,
    triggers: [item, ...state.triggers],
  };
}

export function removeTrigger(state: AppState, id: string): AppState {
  return {
    ...state,
    triggers: state.triggers.filter((t) => t.id !== id),
  };
}

export function countCompletedHabits(day: DayLog): number {
  return Object.values(day.habits).filter(Boolean).length;
}

export function streakDays(state: AppState, asOf = new Date()): number {
  let streak = 0;
  const cursor = new Date(asOf);
  cursor.setHours(12, 0, 0, 0);

  for (let i = 0; i < 400; i += 1) {
    const key = todayKey(cursor);
    const day = state.days[key];
    const done = day ? countCompletedHabits(day) : 0;
    if (done >= 4) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else if (i === 0) {
      // Today incomplete doesn't break yesterday's streak yet
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export function daysSinceStart(state: AppState, asOf = new Date()): number {
  const start = new Date(`${state.startDate}T12:00:00`);
  const end = new Date(asOf);
  end.setHours(12, 0, 0, 0);
  const diff = Math.floor((end.getTime() - start.getTime()) / 86400000);
  return Math.max(0, diff) + 1;
}

export { todayKey };
