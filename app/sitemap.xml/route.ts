import sitemap from '../_lib/sitemap-data';
import { sitemapXml } from '../_lib/sitemap-xml';

export const dynamic = 'force-dynamic';
export async function GET() {
  // Fail with 500 if any source fails; never return a partial successful sitemap.
  const entries = await sitemap();
  return new Response(sitemapXml(entries), { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=0, s-maxage=300' } });
}
