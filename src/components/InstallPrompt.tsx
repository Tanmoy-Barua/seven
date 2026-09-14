import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const DISMISS_KEY = 'seven-install-dismissed';

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || Boolean(nav.standalone);
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY) === '1') return;

    if (isIos()) {
      setIosHint(true);
      setVisible(true);
      return;
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    if (choice.outcome === 'accepted') {
      setVisible(false);
    } else {
      dismiss();
    }
  };

  return (
    <div className="install-banner" role="dialog" aria-label="Install SEVEN">
      <div className="install-copy">
        <strong>Install SEVEN</strong>
        {iosHint ? (
          <p>
            On iPhone/iPad: tap the Share button, then <em>Add to Home Screen</em>.
          </p>
        ) : (
          <p>Add it to your home screen for quick daily check-ins.</p>
        )}
      </div>
      <div className="install-actions">
        {!iosHint && deferred ? (
          <button type="button" className="btn btn-sm" onClick={install}>
            Install
          </button>
        ) : null}
        <button type="button" className="btn ghost btn-sm" onClick={dismiss}>
          Not now
        </button>
      </div>
    </div>
  );
}
