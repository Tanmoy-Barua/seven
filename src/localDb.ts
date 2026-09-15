import bcrypt from 'bcryptjs';
import { format } from 'date-fns';
import type { AppState, DayLog } from './types';

export type LocalAuthUser = {
  id: number;
  username: string;
  startDate: string;
};

export type LocalHistoryRow = {
  date: string;
  completed: number;
  total: number;
  hardThingNote: string;
  focusMinutes: number;
  updatedAt: string;
};

const USERS_KEY = 'seven-local-users-v1';
const SESSION_KEY = 'seven-local-session-v1';
const STATE_PREFIX = 'seven-local-state-v1:';

type LocalUser = {
  id: number;
  username: string;
  passwordHash: string;
  startDate: string;
};

type LocalSession = {
  token: string;
  userId: number;
};

function todayKey(date = new Date()) {
  return format(date, 'yyyy-MM-dd');
}

function readUsers(): LocalUser[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]') as LocalUser[];
  } catch {
    return [];
  }
}

function writeUsers(users: LocalUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function readSession(): LocalSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as LocalSession) : null;
  } catch {
    return null;
  }
}

function writeSession(session: LocalSession | null) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
}

function stateKey(userId: number) {
  return `${STATE_PREFIX}${userId}`;
}

function emptyState(): AppState {
  return { days: {}, triggers: [], startDate: todayKey() };
}

function toAuthUser(user: LocalUser): LocalAuthUser {
  return { id: user.id, username: user.username, startDate: user.startDate };
}

function createToken() {
  return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
}

export function localRegister(username: string, password: string): { token: string; user: LocalAuthUser } {
  const name = username.trim();
  if (name.length < 3) throw new Error('Username must be at least 3 characters.');
  if (password.length < 6) throw new Error('Password must be at least 6 characters.');

  const users = readUsers();
  if (users.some((u) => u.username.toLowerCase() === name.toLowerCase())) {
    throw new Error('That username is taken.');
  }

  const user: LocalUser = {
    id: users.reduce((max, u) => Math.max(max, u.id), 0) + 1,
    username: name,
    passwordHash: bcrypt.hashSync(password, 8),
    startDate: todayKey(),
  };
  users.push(user);
  writeUsers(users);

  const token = createToken();
  writeSession({ token, userId: user.id });
  localStorage.setItem(stateKey(user.id), JSON.stringify(emptyState()));

  return { token, user: toAuthUser(user) };
}

export function localLogin(username: string, password: string): { token: string; user: LocalAuthUser } {
  const users = readUsers();
  const user = users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    throw new Error('Wrong username or password.');
  }
  const token = createToken();
  writeSession({ token, userId: user.id });
  return { token, user: toAuthUser(user) };
}

export function localLogout() {
  writeSession(null);
}

export function localMe(token: string): { user: LocalAuthUser } {
  const session = readSession();
  if (!session || session.token !== token) throw new Error('Please log in.');
  const user = readUsers().find((u) => u.id === session.userId);
  if (!user) throw new Error('Please log in.');
  return { user: toAuthUser(user) };
}

export function localGetState(token: string): AppState {
  const { user } = localMe(token);
  try {
    const raw = localStorage.getItem(stateKey(user.id));
    if (!raw) return { ...emptyState(), startDate: user.startDate };
    const parsed = JSON.parse(raw) as AppState;
    return {
      days: parsed.days ?? {},
      triggers: parsed.triggers ?? [],
      startDate: parsed.startDate || user.startDate,
    };
  } catch {
    return { ...emptyState(), startDate: user.startDate };
  }
}

export function localSaveState(token: string, state: AppState): AppState {
  const { user } = localMe(token);
  const next = {
    days: state.days ?? {},
    triggers: state.triggers ?? [],
    startDate: state.startDate || user.startDate,
  };
  localStorage.setItem(stateKey(user.id), JSON.stringify(next));

  // keep startDate on user record too
  const users = readUsers().map((u) =>
    u.id === user.id ? { ...u, startDate: next.startDate } : u,
  );
  writeUsers(users);
  return next;
}

export function localHistory(token: string): { history: LocalHistoryRow[] } {
  const state = localGetState(token);
  const history = Object.values(state.days)
    .map((day: DayLog) => {
      const completed = Object.values(day.habits || {}).filter(Boolean).length;
      return {
        date: day.date,
        completed,
        total: 7,
        hardThingNote: day.hardThingNote || '',
        focusMinutes: day.focusMinutes || 0,
        updatedAt: new Date().toISOString(),
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 90);
  return { history };
}

export function isLocalToken(token: string | null): boolean {
  if (!token) return false;
  const session = readSession();
  return Boolean(session && session.token === token);
}
