import fs from 'fs/promises';
import path from 'path';
import { createServer } from 'vite';

const SITE_URL = 'https://www.sporto.md';
const ROOT = process.cwd();
const DIST_DIR = path.join(ROOT, 'dist');
const TEMPLATE_PATH = path.join(DIST_DIR, 'index.html');

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildProductSchema(product, url, image, description) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name.ro,
    image: [image],
    description,
    sku: product.sku || product.id,
    url,
    brand: { '@type': 'Brand', name: product.brand || 'Sporto' },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'MDL',
      price: product.price?.toString() || '0',
      availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };
}

function renderProductHtml(template, product, url, imageMap) {
  const title = `${product.name.ro} | SPORTOSFERA`;
  const description = product.description.ro || product.description.ru || `Echipament sportiv ${product.name.ro}`;
  const rawImage = product.image || '';
  const image = imageMap[rawImage] || rawImage || `${SITE_URL}/og-image.jpg`;
  const keywords = `${product.name.ro}, ${product.name.ru}${product.brand ? `, ${product.brand}` : ''}${product.sku ? `, ${product.sku}` : ''}, echipament sportiv Moldova, спортивное оборудование Молдова`;

  const replaceTag = (html, regex, replacement) => html.replace(regex, replacement);

  let html = template;
  html = replaceTag(html, /<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  html = replaceTag(html, /<meta\s+name=["']description["'][\s\S]*?>/i, `<meta name="description" content="${escapeHtml(description)}" />`);
  html = replaceTag(html, /<meta\s+property=["']og:title["'][\s\S]*?>/i, `<meta property="og:title" content="${escapeHtml(title)}" />`);
  html = replaceTag(html, /<meta\s+property=["']og:description["'][\s\S]*?>/i, `<meta property="og:description" content="${escapeHtml(description)}" />`);
  html = replaceTag(html, /<meta\s+property=["']og:image["'][\s\S]*?>/i, `<meta property="og:image" content="${escapeHtml(image)}" />`);
  html = replaceTag(html, /<meta\s+property=["']og:url["'][\s\S]*?>/i, `<meta property="og:url" content="${escapeHtml(url)}" />`);
  html = replaceTag(html, /<meta\s+name=["']twitter:title["'][\s\S]*?>/i, `<meta name="twitter:title" content="${escapeHtml(title)}" />`);
  html = replaceTag(html, /<meta\s+name=["']twitter:description["'][\s\S]*?>/i, `<meta name="twitter:description" content="${escapeHtml(description)}" />`);
  html = replaceTag(html, /<meta\s+name=["']twitter:image["'][\s\S]*?>/i, `<meta name="twitter:image" content="${escapeHtml(image)}" />`);
  html = replaceTag(html, /<link\s+rel=["']canonical["'][\s\S]*?>/i, `<link rel="canonical" href="${escapeHtml(url)}" />`);

  if (!/<meta\s+name=["']keywords["'][\s\S]*?>/i.test(html)) {
    html = html.replace('</head>', `  <meta name="keywords" content="${escapeHtml(keywords)}" />\n</head>`);
  } else {
    html = replaceTag(html, /<meta\s+name=["']keywords["'][\s\S]*?>/i, `<meta name="keywords" content="${escapeHtml(keywords)}" />`);
  }

  const overrides = `  <link rel="alternate" href="${escapeHtml(`${url}?lang=ro`)}" hreflang="ro-MD" />\n  <link rel="alternate" href="${escapeHtml(`${url}?lang=ru`)}" hreflang="ru-MD" />\n  <link rel="alternate" href="${escapeHtml(`${url}?lang=ro`)}" hreflang="x-default" />`;
  html = html.replace('</head>', `${overrides}\n</head>`);

  const schema = buildProductSchema(product, url, image, description);
  const jsonLd = `<script type="application/ld+json">${JSON.stringify(schema)}</script>\n</head>`;
  html = html.replace('</head>', jsonLd);

  return html;
}

async function main() {
  const template = await fs.readFile(TEMPLATE_PATH, 'utf8');
  const server = await createServer({ root: ROOT, server: { middlewareMode: 'ssr' }, appType: 'custom' });

  try {
    const dataModule = await server.ssrLoadModule('/src/app/data/products.ts');
    const urlModule = await server.ssrLoadModule('/src/app/lib/product-url.ts');
    const imagesModule = await server.ssrLoadModule('/src/app/data/images.ts');

    const products = dataModule.products;
    const buildProductPath = urlModule.buildProductPath;
    const imageMap = imagesModule.productImages || {};

    for (const product of products) {
      const productPath = buildProductPath(product);
      const productUrl = `${SITE_URL}${productPath}`;
      const productDir = path.join(DIST_DIR, 'product', productPath.replace('/product/', ''));
      await fs.mkdir(productDir, { recursive: true });
      await fs.writeFile(path.join(productDir, 'index.html'), renderProductHtml(template, product, productUrl, imageMap), 'utf8');
    }

    console.log(`Prerendered ${products.length} product pages into ${DIST_DIR}/product/`);
  } finally {
    await server.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
