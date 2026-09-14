import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { fetchHistory, type HistoryRow } from '../api';

export function HistoryPanel() {
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await fetchHistory();
        if (alive) setRows(data.history);
      } catch (err) {
        if (alive) {
          setError(err instanceof Error ? err.message : 'Could not load history.');
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="section" style={{ animationDelay: '0.36s' }}>
      <h2>Everyday progress</h2>
      <p className="section-lead">Pulled from your database. Last 90 days.</p>
      {loading ? <p className="empty">Loading history…</p> : null}
      {error ? <p className="auth-error">{error}</p> : null}
      {!loading && !error && rows.length === 0 ? (
        <p className="empty">No days logged yet. Check off habits to start your record.</p>
      ) : null}
      {rows.length > 0 ? (
        <ul className="history-list">
          {rows.map((row) => {
            const pct = Math.round((row.completed / row.total) * 100);
            return (
              <li key={row.date} className="history-row">
                <div className="history-date">
                  <strong>{format(parseISO(row.date), 'MMM d')}</strong>
                  <span>{format(parseISO(row.date), 'EEEE')}</span>
                </div>
                <div className="history-bar-wrap" aria-label={`${row.completed} of ${row.total}`}>
                  <div className="history-bar" style={{ width: `${pct}%` }} />
                </div>
                <div className="history-score">
                  {row.completed}/{row.total}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
