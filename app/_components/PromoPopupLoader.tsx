'use client';

import { lazy, Suspense } from 'react';
import type { PopupData } from '../_lib/popup-data';
import type { Language } from './HeaderPreview';

const Popup = lazy(() => import('./PromoPopupPreview').then(module => ({ default: module.PromoPopupPreview })));

/** Disabled promotions never load the popup or its animation library. */
export function PromoPopupLoader(props: { language: Language; config: PopupData }) {
  if (!props.config.active) return null;
  return <Suspense fallback={null}><Popup {...props} /></Suspense>;
}
