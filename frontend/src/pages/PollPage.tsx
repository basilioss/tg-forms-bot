import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import '@telegram-apps/telegram-ui/dist/styles.css';
import { AppRoot, List, Section, Cell, Selectable, Button, Radio } from '@telegram-apps/telegram-ui';


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
  <AppRoot>
    <List
      style={{
        background: 'var(--tgui--secondary_bg_color)',
        padding: 10
      }}
    >
      <Section header={poll?.question || "Loading..."}>
        {poll?.options?.map((o: any) => (
          <Cell
            key={o.id}
            Component="label"
            before={
              <Radio
                name="poll"
                value={o.id}
                checked={selected === o.id}
                onChange={() => setSelected(o.id)}
              />
            }
            multiline
          >
            {o.text}
          </Cell>
        ))}
      </Section>

      <Section>
        <Button
          mode="filled"
          size="l"
          stretched
          disabled={!selected}
          onClick={submit}
        >
          Submit vote
        </Button>
        {status && <Cell multiline>{status}</Cell>}
      </Section>
    </List>
  </AppRoot>
  );
}
