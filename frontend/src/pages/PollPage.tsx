import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

const API = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000';

function getTelegramUserId(): string | null {
  try {
    const u = (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user;
    return u?.id?.toString() || null;
  } catch {
    return null;
  }
}

function getOrCreateAnonId(): string {
  const key = 'pollbot_anon_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export default function PollPage() {
  const { id } = useParams<{ id: string }>();
  const [poll, setPoll] = useState<any>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  const userId = useMemo(() => getTelegramUserId() || getOrCreateAnonId(), []);

  useEffect(() => {
    try {
      const tg = (window as any)?.Telegram?.WebApp;
      tg?.ready?.();
      tg?.expand?.();
    } catch {}
  }, []);

  useEffect(() => {
    if (!id) return;
    setStatus('Loading poll...');
    fetch(`${API}/polls/${id}`)
      .then(r => {
        if (!r.ok) throw new Error('Poll not found');
        return r.json();
      })
      .then(data => {
        setPoll(data);
        setStatus('');
      })
      .catch(e => setStatus(e.message || 'Failed to load poll'));
  }, [id]);

  async function submit() {
    if (selected == null || !id) return;
    setStatus('Submitting...');
    try {
      const res = await fetch(`${API}/polls/${id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ option_id: selected, user_id: userId }),
      });
      if (res.ok) {
        setStatus('✅ Vote recorded!');
      } else {
        const t = await res.text();
        setStatus('Error: ' + t);
      }
    } catch {
      setStatus('Network error');
    }
  }

  return (
    <div
      style={{
        maxWidth: 500,
        margin: '16px auto',
        padding: 16,
        borderRadius: 12,
        background: 'var(--tg-theme-bg-color, #fff)',
        color: 'var(--tg-theme-text-color, #000)',
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {!poll ? (
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
          {status || 'Loading...'}
        </h2>
      ) : (
        <>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
            {poll.question}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {poll.options.map((o: any) => (
              <label
                key={o.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  padding: '8px 12px',
                  borderRadius: 8,
                  background:
                    selected === o.id
                      ? 'var(--tg-theme-button-color, #3390ec)'
                      : 'rgba(0,0,0,0.05)',
                  color:
                    selected === o.id
                      ? 'var(--tg-theme-button-text-color, #fff)'
                      : 'inherit',
                }}
              >
                <input
                  type="radio"
                  name="opt"
                  value={o.id}
                  checked={selected === o.id}
                  onChange={() => setSelected(o.id)}
                  style={{ display: 'none' }}
                />
                <span>{o.text}</span>
              </label>
            ))}
          </div>

          <button
            onClick={submit}
            disabled={selected == null}
            style={{
              marginTop: 16,
              width: '100%',
              padding: '12px 16px',
              border: 'none',
              borderRadius: 8,
              background:
                selected == null
                  ? 'rgba(0,0,0,0.1)'
                  : 'var(--tg-theme-button-color, #3390ec)',
              color:
                selected == null
                  ? 'rgba(0,0,0,0.4)'
                  : 'var(--tg-theme-button-text-color, #fff)',
              fontSize: 16,
              fontWeight: 500,
              cursor: selected == null ? 'not-allowed' : 'pointer',
            }}
          >
            Submit vote
          </button>

          {status && (
            <div style={{ marginTop: 8, fontSize: 14, opacity: 0.8 }}>
              {status}
            </div>
          )}
        </>
      )}
    </div>
  );
}
