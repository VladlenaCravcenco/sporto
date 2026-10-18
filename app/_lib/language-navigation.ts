export function languageTarget(current: URL, language: 'ro' | 'ru', alternate?: string | null) {
  if (/^\/(login|register|account|forgot-password|reset-password|callback)$/.test(current.pathname)) {
    const query = new URLSearchParams(current.search);
    query.set('lang', language);
    return `${current.pathname}?${query}${current.hash}`;
  }
  const rest = current.pathname.replace(/^\/(ro|ru)(?=\/|$)/, '');
  let pathname = `/${language}${rest}`;
  if (/^\/product\/[^/]+\/[^/]+\/?$/.test(rest) && alternate) {
    try {
      const translated = new URL(alternate, current);
      const parts = translated.pathname.split('/').filter(Boolean);
      const id = current.pathname.split('/').filter(Boolean).at(-1);
      if (parts.length === 4 && parts[0] === language && parts[1] === 'product' && parts[3] === id) pathname = translated.pathname;
    } catch { /* Keep the current product identifier if metadata is unavailable. */ }
  }
  return `${pathname}${current.search}${current.hash}`;
}
