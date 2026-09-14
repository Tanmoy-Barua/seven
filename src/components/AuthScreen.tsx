import { useState, type FormEvent } from 'react';
import { login, register, setToken, type AuthUser } from '../api';

type Props = {
  onAuthed: (user: AuthUser) => void;
};

export function AuthScreen({ onAuthed }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const result =
        mode === 'login'
          ? await login(username.trim(), password)
          : await register(username.trim(), password);
      setToken(result.token);
      onAuthed(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card section">
        <h1 className="brand auth-brand">
          SEV<span>EN</span>
        </h1>
        <p className="section-lead">
          Log in so every day’s progress is saved to your database — not just this browser.
        </p>
        <form className="auth-form" onSubmit={submit}>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your name"
              required
              minLength={3}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="at least 6 characters"
              required
              minLength={6}
            />
          </div>
          {error ? <p className="auth-error">{error}</p> : null}
          <button type="submit" className="btn" disabled={busy}>
            {busy ? 'Working…' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>
        <button
          type="button"
          className="btn ghost auth-switch"
          onClick={() => {
            setMode((m) => (m === 'login' ? 'register' : 'login'));
            setError('');
          }}
        >
          {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Log in'}
        </button>
      </div>
    </div>
  );
}
