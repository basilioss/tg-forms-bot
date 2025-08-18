import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

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

      if (value.startsWith('poll')) {
        const id = value.slice(4);
        nav(`/poll/${id}${location.search}`, { replace: true });
      } else if (value.startsWith('results')) {
        const id = value.slice(7);
        nav(`/results/${id}${location.search}`, { replace: true });
      }
    } else {
      console.warn('[StartParamRouter] No start param found', debug);
    }
  }, [nav, location.search]);

  return (
    <div className="container">
      <h1 className="text-2xl font-bold mb-3">Poll Bot Web</h1>
      <div className="card space-y-2">
        <p>Create polls via Telegram:</p>
        <code className="block p-3 bg-black/40 rounded">
          /newpoll Best color? | Red | Blue | Green
        </code>
        <p>
          Then open the link the bot sends, like <code>/poll/1</code> to vote.
        </p>
        <ul className="list-disc ml-6">
          <li>
            <code>/poll/&lt;id&gt;</code> – voting page
          </li>
          <li>
            <code>/results/&lt;id&gt;</code> – results chart
          </li>
        </ul>
      </div>
    </div>
  );
}

