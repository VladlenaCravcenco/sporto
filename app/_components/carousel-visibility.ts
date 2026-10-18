/** Start autoplay only for a visible element in a visible tab. No polling. */
export function observeCarouselVisibility(element: HTMLElement, onChange: (active: boolean) => void) {
  let intersecting = !('IntersectionObserver' in window);
  let lastActive = false;
  let disposed = false;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const sync = () => {
    if (disposed) return;
    const active = intersecting && document.visibilityState === 'visible' && !motion.matches;
    if (active === lastActive) return;
    lastActive = active;
    onChange(active);
  };
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    intersecting = entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= 0.01);
    sync();
  }, { threshold: 0.01 }) : null;
  observer?.observe(element);
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', sync);
  sync();
  return () => {
    disposed = true;
    observer?.disconnect();
    document.removeEventListener('visibilitychange', sync);
    motion.removeEventListener('change', sync);
    if (lastActive) onChange(false);
  };
}
