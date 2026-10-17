'use client';
import { useEffect, useState } from 'react';
export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.dataset.theme === 'dark');
  }, []);
  function toggle() {
    const next = !dark;
    setDark(next);
    const theme = next ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('marketplace-theme', theme);
    } catch {}
  }
  return (
    <button
      className="market-theme-button"
      onClick={toggle}
      aria-pressed={dark}
      aria-label={`Switch to ${dark ? 'light' : 'dark'} theme`}
    >
      <span aria-hidden="true">{dark ? '☀' : '☾'}</span>
      <span>{dark ? 'Light' : 'Dark'}</span>
    </button>
  );
}
