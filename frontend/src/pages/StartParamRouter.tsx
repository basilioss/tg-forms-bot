import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';

function detectStartParam() {
  const debug: Record<string, any> = {};

  try {
    const s = (window as any)?.Telegram?.WebApp?.initDataUnsafe?.start_param;
    debug.initDataUnsafe = s;
    if (s) return { value: s, debug };
  } catch (e: any) {
    debug.error1 = e.message;
  }

  try {
    const sp = new URLSearchParams(window.location.search);
    const s =
      sp.get('tgWebAppStartParam') ||
      sp.get('startapp') ||
      sp.get('startattach');
    debug.urlQuery = s;
    if (s) return { value: s, debug };
  } catch (e: any) {
    debug.error2 = e.message;
  }

  return { value: null, debug };
}

export default function StartParamRouter() {
  const nav = useNavigate();
  const location = useLocation();
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});

  useEffect(() => {
    const tg = (window as any)?.Telegram?.WebApp;
    tg?.ready?.();
    tg?.expand?.();

    const { value, debug } = detectStartParam();
    setDebugInfo(debug);

    if (value) {
      console.log('[StartParamRouter] Detected start param:', value, debug);

      if (value.startsWith('form_')) {
        const id = value.slice(5);
        nav(`/poll/${id}${location.search}`, { replace: true });
      } else if (value.startsWith('responses_')) {
        const id = value.slice(10);
        nav(`/results/${id}${location.search}`, { replace: true });
      }
    } else {
      nav(`/create/`);
      console.warn('[StartParamRouter] No start param found', debug);
    }
  }, [nav, location.search]);

  return (
    <div className="container">
      <h1>Poll Bot Web</h1>
    </div>
  );
}
