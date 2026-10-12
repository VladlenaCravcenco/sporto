const HISTORY_KEY = 'sporto_search_history';
const MAX_HISTORY = 7;

export function getSearchHistory(): string[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
  catch { return []; }
}
export function addToHistory(query: string): void {
  if (!query.trim() || query.trim().length < 2) return;
  const h = getSearchHistory().filter(q => q.toLowerCase() !== query.toLowerCase());
  h.unshift(query.trim());
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, MAX_HISTORY)));
}
export function removeFromHistory(query: string): void {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(getSearchHistory().filter(q => q !== query)));
}
export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

