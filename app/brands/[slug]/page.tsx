import { notFound, permanentRedirect } from 'next/navigation';
import { getBrand } from '../../_lib/brand-data';
import { validatePublicRoute } from '../../_lib/public-route-preflight';

export default async function LegacyBrand({params,searchParams}: {
  params: Promise<{slug:string}>;
  searchParams: Promise<Record<string,string|string[]|undefined>>;
}) {
  const [{slug},values]=await Promise.all([params,searchParams]);
  const brand=await getBrand(slug);
  if (!brand) notFound();
  const language=values.lang==='ru'?'ru':'ro';
  const query=new URLSearchParams();
  for (const [name,value] of Object.entries(values)) {
    if (name==='lang' || value===undefined) continue;
    for (const item of Array.isArray(value)?value:[value]) query.append(name,item);
  }
  const pathname=`/${language}/brands/${encodeURIComponent(brand.slug)}`;
  // Validate pagination/catalog before redirecting; removed brands remain genuine 404s.
  await validatePublicRoute(pathname,query.toString(),language);
  permanentRedirect(pathname+(query.size?'?'+query:''));
}
