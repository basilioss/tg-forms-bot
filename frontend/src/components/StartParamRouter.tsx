import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';

function detectStartParam() {
  try {
    const s = (window as any)?.Telegram?.WebApp?.initDataUnsafe?.start_param;
    if (s) return s;
  } catch {}

  try {
    const sp = new URLSearchParams(window.location.search);
    return (
      sp.get("tgWebAppStartParam") ||
      sp.get("startapp") ||
      sp.get("startattach") ||
      null
    );
  } catch {}
  return null;
}

export default function StartParamRouter() {
  const nav = useNavigate();
  const location = useLocation();

  useEffect(() => {
    try {
      const tg = (window as any)?.Telegram?.WebApp;
      tg?.ready?.();
      tg?.expand?.();
    } catch {}

    const value = detectStartParam();

    if (value) {
      if (value.startsWith('form_')) {
        const id = value.slice(5);
        nav(`/form/${id}`, { replace: true });
      } else if (value.startsWith('responses_')) {
        const id = value.slice(10);
        nav(`/responses/${id}`, { replace: true });
      } else if (value.startsWith('create')) {
        nav(`/create/`, { replace: true });
      }
    } else {
      nav(`/index/`);
    }
  }, [nav, location.search]);
}
