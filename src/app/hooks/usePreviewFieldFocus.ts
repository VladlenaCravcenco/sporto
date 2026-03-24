import { useCallback, useEffect, useRef, useState } from 'react';

export function usePreviewFieldFocus() {
  const refs = useRef<Record<string, HTMLElement | null>>({});
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);

  const registerField = useCallback((id: string) => (node: HTMLElement | null) => {
    refs.current[id] = node;
  }, []);

  const focusField = useCallback((id: string) => {
    const node = refs.current[id];
    if (!node) return;

    setActiveFieldId(id);

    if (clearTimer.current) clearTimeout(clearTimer.current);
    clearTimer.current = setTimeout(() => setActiveFieldId(null), 2000);

    node.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const control = node.matches('input, textarea, select')
      ? node
      : node.querySelector<HTMLElement>('input, textarea, select, button');

    control?.focus();
  }, []);

  useEffect(() => () => {
    if (clearTimer.current) clearTimeout(clearTimer.current);
  }, []);

  return { activeFieldId, registerField, focusField };
}
