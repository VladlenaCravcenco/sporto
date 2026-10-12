'use client';
import Link from 'next/link';
import type { ComponentProps } from 'react';
export function CatalogLink(props: ComponentProps<typeof Link>) {
  return <Link {...props} prefetch={false} />;
}
