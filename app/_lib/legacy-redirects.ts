const publicPages = new Set([
  'catalog', 'about', 'contacts', 'turnkey-solutions', 'maintenance-service',
  'terms-of-cooperation', 'delivery-terms', 'privacy-policy', 'order-request',
]);

/** Redirect only known legacy content; never redirect API, auth or unknown routes. */
export function legacyContentRedirect(pathname: string, search: string): string | null {
  const parts = pathname.split('/').filter(Boolean);
  if (!(parts.length === 0 || parts.length === 1 && publicPages.has(parts[0]))) return null;
  const query = new URLSearchParams(search);
  const language = query.get('lang') === 'ru' ? 'ru' : 'ro';
  query.delete('lang');
  const path = `/${language}${parts.length ? '/' + parts.join('/') : ''}`;
  return path + (query.size ? '?' + query.toString() : '');
}
