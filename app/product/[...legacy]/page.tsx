import { notFound, permanentRedirect } from 'next/navigation';
import { getProductDetail } from '../../_lib/product-data';
import { productPath, productSlug } from '../../_lib/product-url';

/** Old product URLs may contain an ID or SKU, and infer Russian from the old slug. */
export default async function LegacyProduct({params, searchParams}: {
  params: Promise<{legacy: string[]}>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{legacy}, query] = await Promise.all([params, searchParams]);
  if (legacy.length < 1 || legacy.length > 2) notFound();
  const identifier = legacy[legacy.length - 1].split('--').pop()!;
  const data = await getProductDetail(identifier, identifier);
  if (!data) notFound();
  const explicit = typeof query.lang === 'string' && ['ro','ru'].includes(query.lang) ? query.lang : null;
  const candidates = [data.product, ...(data.redirectSource ? [data.redirectSource] : [])];
  const inferredRu = legacy.length === 2 && candidates.some(product => legacy[0] === productSlug(product, 'ru') && legacy[0] !== productSlug(product, 'ro'));
  const language = explicit || (inferredRu ? 'ru' : 'ro');
  const retained = new URLSearchParams();
  // Retain attribution parameters without carrying a legacy language or arbitrary route parameters.
  for (const [key,value] of Object.entries(query)) if ((key.startsWith('utm_') || ['gclid','fbclid'].includes(key)) && typeof value === 'string') retained.set(key,value);
  permanentRedirect(productPath(data.product, language as 'ro' | 'ru') + (retained.size ? '?' + retained : ''));
}
