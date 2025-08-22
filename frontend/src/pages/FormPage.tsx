import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import "@telegram-apps/telegram-ui/dist/styles.css";
import {
  AppRoot,
  List,
  Section,
  Cell,
  Text,
  Button,
  Radio,
  Spinner,
} from "@telegram-apps/telegram-ui";

const API = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

function getTelegramUserId(): string | null {
  try {
    const u = (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user;
    return u?.id?.toString() || null;
  } catch {
    return null;
  }
}

function getOrCreateAnonId(): string {
  const key = "formbot_anon_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export default function FormPage() {
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<any>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const userId = useMemo(() => getTelegramUserId() || getOrCreateAnonId(), []);

  // Initialize Telegram WebApp context
  useEffect(() => {
    try {
      const tg = (window as any)?.Telegram?.WebApp;
      tg?.ready?.();
      tg?.expand?.();
    } catch {}
  }, []);

  // Fetch form data
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${API}/forms/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Form not found");
        return r.json();
      })
      .then((data) => {
        setForm(data);
        setMessage(null);
      })
      .catch((e) => setMessage(e.message || "Failed to load form"))
      .finally(() => setLoading(false));
  }, [id]);

  async function submitResponse() {
    if (!selected || !id) return;
    setMessage("Submitting...");
    try {
      const res = await fetch(`${API}/forms/${id}/response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ option_id: selected, user_id: userId }),
      });
      if (res.ok) {
        setMessage("✅ Response recorded!");
      } else {
        const t = await res.text();
        setMessage("❌ Error: " + t);
      }
    } catch {
      setMessage("❌ Network error");
    }
  }

  return (
    <AppRoot>
      <List
        style={{
          background: "var(--tgui--secondary_bg_color)",
          padding: 10,
        }}
      >
        <Section header={form?.question || "Loading..."}>
          {loading && (
            <Cell before={<Spinner />} multiline>
              Fetching form...
            </Cell>
          )}

          {!loading &&
            form?.options?.map((o: any) => (
              <Cell
                key={o.id}
                Component="label"
                before={
                  <Radio
                    name="form"
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

        <Button
          mode="filled"
          size="l"
          stretched
          disabled={!selected || loading}
          onClick={submitResponse}
        >
          Submit response
        </Button>
        {message && <Text multiline>{message}</Text>}
      </List>
    </AppRoot>
  );
}
