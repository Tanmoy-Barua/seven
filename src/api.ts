import type { AppState } from './types';
import {
  isLocalToken,
  localGetState,
  localHistory,
  localLogin,
  localLogout,
  localMe,
  localRegister,
  localSaveState,
} from './localDb';

const TOKEN_KEY = 'seven-auth-token';
const MODE_KEY = 'seven-data-mode';

export type AuthUser = {
  id: number;
  username: string;
  startDate: string;
};

type AuthResponse = {
  token: string;
  user: AuthUser;
};

export type DataMode = 'cloud' | 'local';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getDataMode(): DataMode {
  return localStorage.getItem(MODE_KEY) === 'local' ? 'local' : 'cloud';
}

export function setDataMode(mode: DataMode): void {
  localStorage.setItem(MODE_KEY, mode);
}

async function cloudRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers || {});
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(path, { ...init, headers });
  } catch {
    const err = new Error('Failed to fetch') as Error & { status?: number };
    err.status = 0;
    throw err;
  }

  const contentType = res.headers.get('content-type') || '';
  // Static hosts (Vercel SPA) often return index.html with 200 for /api/*
  if (!contentType.includes('application/json')) {
    const err = new Error('API not found') as Error & { status?: number };
    err.status = 404;
    throw err;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(
      (data as { error?: string }).error || `Request failed (${res.status})`,
    ) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return data as T;
}

async function withCloudOrLocal<T>(
  cloudCall: () => Promise<T>,
  localCall: () => T,
  preferLocal = false,
): Promise<T> {
  if (preferLocal || getDataMode() === 'local' || isLocalToken(getToken())) {
    setDataMode('local');
    return localCall();
  }
  try {
    const result = await cloudCall();
    setDataMode('cloud');
    return result;
  } catch (err) {
    const status = (err as { status?: number }).status;
    const message = err instanceof Error ? err.message : '';
    const shouldFallback =
      status === 404 ||
      status === 405 ||
      status === 502 ||
      status === 503 ||
      message.includes('Failed to fetch') ||
      message.includes('NetworkError') ||
      message.includes('API not found');
    if (!shouldFallback) throw err;
    setDataMode('local');
    return localCall();
  }
}

export async function register(username: string, password: string) {
  try {
    const result = await cloudRequest<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setDataMode('cloud');
    return result;
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status && status !== 404 && status !== 502 && status !== 503) throw err;
    // Static hosts (like Vercel frontend-only) have no API — use on-device DB
    const result = localRegister(username, password);
    setDataMode('local');
    return result;
  }
}

export async function login(username: string, password: string) {
  try {
    const result = await cloudRequest<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setDataMode('cloud');
    return result;
  } catch (err) {
    const status = (err as { status?: number }).status;
    // Wrong password from cloud should not fall back
    if (status === 401 || status === 400 || status === 409) throw err;
    try {
      const result = localLogin(username, password);
      setDataMode('local');
      return result;
    } catch (localErr) {
      if (status === 404 || status === 502 || status === 503 || !status) {
        // Prefer local error if cloud is missing; otherwise cloud error
        throw localErr;
      }
      throw err;
    }
  }
}

export async function logout() {
  const token = getToken();
  if (getDataMode() === 'local' || isLocalToken(token)) {
    localLogout();
    return { ok: true };
  }
  try {
    return await cloudRequest<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
  } catch {
    localLogout();
    return { ok: true };
  }
}

export function fetchMe() {
  return withCloudOrLocal(
    () => cloudRequest<{ user: AuthUser }>('/api/me'),
    () => localMe(getToken() || ''),
  );
}

export function fetchState() {
  return withCloudOrLocal(
    () => cloudRequest<AppState>('/api/state'),
    () => localGetState(getToken() || ''),
  );
}

export function saveRemoteState(state: AppState) {
  return withCloudOrLocal(
    () =>
      cloudRequest<AppState>('/api/state', {
        method: 'PUT',
        body: JSON.stringify(state),
      }),
    () => localSaveState(getToken() || '', state),
  );
}

export type HistoryRow = {
  date: string;
  completed: number;
  total: number;
  hardThingNote: string;
  focusMinutes: number;
  updatedAt: string;
};

export function fetchHistory() {
  return withCloudOrLocal(
    () => cloudRequest<{ history: HistoryRow[] }>('/api/history'),
    () => localHistory(getToken() || ''),
  );
}
