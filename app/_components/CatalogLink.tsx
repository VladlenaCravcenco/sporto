'use client';
import Link from 'next/link';
import { saveCatalogPosition } from './catalog-scroll';
import type { ComponentProps } from 'react';
export function CatalogLink(props: ComponentProps<typeof Link>) {
  return <Link {...props} prefetch={false} onClick={event => {
    props.onClick?.(event);
    if (!event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
      && (!props.target || props.target === '_self') && typeof props.href === 'string' && /^\/(ro|ru)\/product\//.test(props.href)) {
      saveCatalogPosition(props.href, event.currentTarget);
    }
  }} />;
}
