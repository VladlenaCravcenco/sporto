import { createContext, useContext } from 'react';
import type { FaqItem } from '../../lib/faq';

/** Request-scoped initial content; never seed module-global browser caches on the server. */
export interface PublicPageInitialData {
  content: Record<string, Record<string, unknown> | null>;
  faq?: FaqItem[];
  catalogCount?: number | null;
  settings?: Record<string, string>;
}
export const PublicPageDataContext = createContext<PublicPageInitialData | null>(null);
export const usePublicPageData = () => useContext(PublicPageDataContext);
