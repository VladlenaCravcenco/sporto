import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data: products, error } = await supabase
    .from('products')
    .select('slug');

  if (error) {
    return new Response('Error fetching products', { status: 500 });
  }

  const baseUrl = 'https://yourdomain.com';

  const urls = products.map(p => `
    <url>
      <loc>${baseUrl}/product/${p.slug}</loc>
    </url>
  `).join('');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url>
  <loc>${baseUrl}</loc>
</url>
${urls}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'text/xml',
    },
  });
}