import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const baseUrl = 'https://sportosfera.md';

  // 🔹 Статические страницы
  const staticPages = [
    { url: '/', priority: 1.0, changefreq: 'weekly' },
    { url: '/catalog', priority: 0.9, changefreq: 'daily' },
    { url: '/turnkey-solutions', priority: 0.8 },
    { url: '/maintenance-service', priority: 0.8 },
    { url: '/about', priority: 0.7 },
    { url: '/contacts', priority: 0.8 },
    { url: '/terms-of-cooperation', priority: 0.4 },
    { url: '/delivery-terms', priority: 0.4 },
    { url: '/privacy-policy', priority: 0.3 },
  ];

  // 🔹 Товары из Supabase
  const { data: products } = await supabase
    .from('products')
    .select('slug, updated_at');

  const staticUrls = staticPages.map(p => `
    <url>
      <loc>${baseUrl}${p.url}</loc>
      <changefreq>${p.changefreq || 'monthly'}</changefreq>
      <priority>${p.priority}</priority>
    </url>
  `).join('');

  const productUrls = (products || []).map(p => `
    <url>
      <loc>${baseUrl}/product/${p.slug}</loc>
      <lastmod>${p.updated_at}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.7</priority>
    </url>
  `).join('');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${productUrls}
</urlset>`;

  return new Response(sitemap, {
    headers: { 'Content-Type': 'text/xml' },
  });
}