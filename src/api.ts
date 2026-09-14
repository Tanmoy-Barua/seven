import type { AppState } from './types';

const TOKEN_KEY = 'seven-auth-token';

export type AuthUser = {
  id: number;
  username: string;
  startDate: string;
};

type AuthResponse = {
  token: string;
  user: AuthUser;
};

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
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
    throw new Error('Cannot reach the SEVEN server. Run npm run start (or npm run dev) and open that same URL.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const apiError = (data as { error?: string }).error;
    if (apiError) throw new Error(apiError);
    if (res.status === 404) {
      throw new Error(
        'API not found (404). Open the app from the server URL (http://localhost:3001), not a static preview.',
      );
    }
    throw new Error(`Request failed (${res.status})`);
  }
  return data as T;
}

export function register(username: string, password: string) {
  return request<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function login(username: string, password: string) {
  return request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function logout() {
  return request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
}

export function fetchMe() {
  return request<{ user: AuthUser }>('/api/me');
}

export function fetchState() {
  return request<AppState>('/api/state');
}

export function saveRemoteState(state: AppState) {
  return request<AppState>('/api/state', {
    method: 'PUT',
    body: JSON.stringify(state),
  });
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
  return request<{ history: HistoryRow[] }>('/api/history');
}
