import { useEffect, useRef, useState } from 'react';

interface Props {
  focusMinutesToday: number;
  onCompleteBlock: (minutes: number) => void;
}

const TWO_HOURS = 2 * 60 * 60;

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function FocusTimer({ focusMinutesToday, onCompleteBlock }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(TWO_HOURS);
  const [running, setRunning] = useState(false);
  const endedRef = useRef(false);

  useEffect(() => {
    if (!running) return undefined;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (secondsLeft === 0 && running && !endedRef.current) {
      endedRef.current = true;
      setRunning(false);
      onCompleteBlock(120);
    }
  }, [secondsLeft, running, onCompleteBlock]);

  const start = () => {
    endedRef.current = false;
    setRunning(true);
  };

  const pause = () => setRunning(false);

  const reset = () => {
    setRunning(false);
    endedRef.current = false;
    setSecondsLeft(TWO_HOURS);
  };

  const logPartial = () => {
    const elapsed = TWO_HOURS - secondsLeft;
    const minutes = Math.max(1, Math.round(elapsed / 60));
    onCompleteBlock(minutes);
    reset();
  };

  return (
    <section className="section" style={{ animationDelay: '0.18s' }}>
      <h2>Deep work</h2>
      <p className="section-lead">Two hours. One task. Phone in another room.</p>
      <div className="timer-display" aria-live="polite">
        {formatTime(secondsLeft)}
      </div>
      <div className="timer-actions">
        {!running ? (
          <button type="button" className="btn" onClick={start}>
            Start focus
          </button>
        ) : (
          <button type="button" className="btn secondary" onClick={pause}>
            Pause
          </button>
        )}
        <button type="button" className="btn ghost" onClick={reset}>
          Reset
        </button>
        <button
          type="button"
          className="btn secondary"
          onClick={logPartial}
          disabled={secondsLeft === TWO_HOURS}
        >
          Log time so far
        </button>
      </div>
      <p className="timer-note">
        Today: <em>{focusMinutesToday} min</em> logged. Put the phone somewhere you can’t reach it.
      </p>
    </section>
  );
}
