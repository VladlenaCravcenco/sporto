import { useSyncExternalStore } from 'react';

export type AdminTheme = 'light' | 'dark';
const KEY = 'sporto-admin-theme';
const EVENT = 'sporto-admin-theme-change';
let current: AdminTheme = 'light';
let initialized = false;

function snapshot(): AdminTheme {
  if (!initialized && typeof window !== 'undefined') {
    try { current = localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light'; } catch {}
    initialized = true;
  }
  return current;
}
function subscribe(notify: () => void) {
  const storage = (event: StorageEvent) => {
    if (event.key !== KEY && event.key !== null) return;
    initialized = false;
    notify();
  };
  window.addEventListener(EVENT, notify);
  window.addEventListener('storage', storage);
  return () => {
    window.removeEventListener(EVENT, notify);
    window.removeEventListener('storage', storage);
  };
}
export function setAdminTheme(theme: AdminTheme) {
  current = theme;
  initialized = true;
  try { localStorage.setItem(KEY, theme); } catch {}
  window.dispatchEvent(new Event(EVENT));
}
export function useAdminTheme() {
  return useSyncExternalStore(subscribe, snapshot, (): AdminTheme => 'light');
}
