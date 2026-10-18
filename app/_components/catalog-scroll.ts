export const CATALOG_SCROLL_KEY = 'sportoCatalogScroll';
export interface CatalogScrollPosition { url: string; x: number; y: number; product: string; offset: number }
export function saveCatalogPosition(productHref: string, anchor: HTMLAnchorElement) {
  if (!/^\/(ro|ru)\/(catalog|brands\/[^/]+)\/?$/.test(window.location.pathname)) return;
  try {
    const position: CatalogScrollPosition = {
      url: window.location.pathname + window.location.search,
      x: window.scrollX, y: window.scrollY, product: productHref,
      offset: anchor.getBoundingClientRect().top,
    };
    // Preserve Next.js's own navigation state.
    window.history.replaceState({ ...window.history.state, [CATALOG_SCROLL_KEY]: position }, '');
  } catch { /* Native browser restoration remains available. */ }
}
export function readCatalogPosition(): CatalogScrollPosition | null {
  const value = window.history.state?.[CATALOG_SCROLL_KEY];
  if (!value || value.url !== window.location.pathname + window.location.search
    || !Number.isFinite(value.x) || !Number.isFinite(value.y) || value.y < 0
    || typeof value.product !== 'string' || !Number.isFinite(value.offset)) return null;
  return value;
}
