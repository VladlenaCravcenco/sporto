'use client';

import { useLayoutEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { readCatalogPosition } from './catalog-scroll';

export function CatalogScrollRestoration() {
  const pathname = usePathname();
  const query = useSearchParams().toString();
  useLayoutEffect(() => {
    const position = readCatalogPosition();
    if (!position) return;
    let stopped = false;
    const stop = () => { stopped = true; };
    const restore = () => {
      if (stopped) return;
      const anchor = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-product-card] a[href]'))
        .find(link => link.getAttribute('href') === position.product);
      const y = anchor ? window.scrollY + anchor.getBoundingClientRect().top - position.offset : position.y;
      window.scrollTo({ left: position.x, top: Math.max(0, y), behavior: 'instant' });
    };
    for (const event of ['wheel', 'touchstart', 'pointerdown', 'keydown']) window.addEventListener(event, stop, { passive: true });
    const frame = requestAnimationFrame(restore);
    // Route rendering and Next's native scroll handling can finish on different frames.
    const timers = [80, 250].map(delay => window.setTimeout(restore, delay));
    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      timers.forEach(clearTimeout);
      for (const event of ['wheel', 'touchstart', 'pointerdown', 'keydown']) window.removeEventListener(event, stop);
    };
  }, [pathname, query]);
  return null;
}
