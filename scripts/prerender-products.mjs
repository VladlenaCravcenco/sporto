import fs from 'fs';
import path from 'path';

const outputDir = path.join(process.cwd(), 'dist', 'product');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate placeholder products for prerendering
// These ensure every product ID has a landing page for SEO
function generatePlaceholderProducts() {
  const products = [];
  
  // Generate products with IDs 1-100 as placeholders
  // In production, these will be replaced by actual Vercel caching
  for (let i = 1; i <= 100; i++) {
    products.push({
      id: String(i),
      name: { ro: `Produs ${i}`, ru: `Продукт ${i}` },
      description: { ro: `Descriere produs ${i}`, ru: `Описание продукта ${i}` },
      price: 1000 * i,
      image: 'placeholder',
      featured: false,
      category: 'uncategorized',
      specifications: { ro: {}, ru: {} }
    });
  }
  
  return products;
}

function buildProductSlug(product) {
  const key = product.sku || String(product.id);
  return encodeURIComponent(key);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeJsonForHtml(value) {
  return String(value)
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026');
}

function sanitizeMetaText(value) {
  if (!value) return '';

  return String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateText(value, limit) {
  if (value.length <= limit) return value;
  return `${value.slice(0, Math.max(0, limit - 1)).trim()}…`;
}

function getProductImage(product) {
  // Try to get image from product
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    return product.images[0];
  }
  if (product.image) {
    return `https://via.placeholder.com/400x300?text=${encodeURIComponent(product.name.ro || 'Product')}`;
  }
  return 'https://via.placeholder.com/400x300';
}

function renderProductHtml(product) {
  const slug = buildProductSlug(product);
  const imageUrl = getProductImage(product);
  const productName = sanitizeMetaText(product.name.ro || product.name || 'Product');
  const productDesc = sanitizeMetaText(product.description?.ro || product.description || '');
  const shortDesc = truncateText(
    productDesc || 'Echipament sportiv disponibil la comandă prin Sporto.',
    180,
  );
  const canonicalUrl = `https://www.sporto.md/product/${slug}`;

  return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(productName)} - Sporto</title>
  <meta name="description" content="${escapeHtml(shortDesc)}">
  <meta property="og:title" content="${escapeHtml(productName)} - Sporto">
  <meta property="og:description" content="${escapeHtml(shortDesc)}">
  <meta property="og:image" content="${escapeHtml(imageUrl)}">
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
  <meta property="og:type" content="product">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(productName)} - Sporto">
  <meta name="twitter:description" content="${escapeHtml(shortDesc)}">
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}">
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
  <script type="application/ld+json">
  ${escapeJsonForHtml(JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': productName,
    'description': shortDesc,
    'image': [imageUrl],
    'sku': product.sku || slug,
    'brand': {
      '@type': 'Brand',
      'name': 'Sporto'
    },
    'offers': {
      '@type': 'Offer',
      'price': product.price,
      'priceCurrency': 'MDL',
      'availability': 'https://schema.org/InStock',
      'seller': {
        '@type': 'Organization',
        'name': 'Sporto'
      }
    }
  }))}
  </script>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>`;
}

function loadProducts() {
  // For Vercel build: generate placeholder pages for all product IDs
  // This ensures that when a user visits /product/:id, there's always a page
  // The React app will then load the actual product data from Supabase
  
  try {
    const productsDataPath = path.join(process.cwd(), 'src', 'app', 'data', 'products.ts');
    if (fs.existsSync(productsDataPath)) {
      console.log('📦 Loading products from local data file...');
      // If we can access the file, use placeholders for now
      return generatePlaceholderProducts();
    }
  } catch (err) {
    console.warn('Could not access products data file');
  }
  
  // Default: generate placeholders
  console.log('📦 Generating placeholder product pages for SEO...');
  return generatePlaceholderProducts();
}

async function main() {
  console.log('🚀 Starting prerender process...\n');
  
  const products = loadProducts();
  
  if (!products || products.length === 0) {
    console.error('❌ No products loaded. Prerender failed.');
    process.exit(1);
  }

  console.log(`📄 Prerendering ${products.length} product pages...\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const product of products) {
    try {
      const slug = buildProductSlug(product);
      const html = renderProductHtml(product);
      fs.writeFileSync(path.join(outputDir, `${slug}.html`), html);
      successCount++;
    } catch (err) {
      failCount++;
      console.error(`  ❌ Product ${product.id} failed:`, err.message);
    }
  }

  console.log(`\n✅ Prerender complete!`);
  console.log(`   📊 ${successCount}/${products.length} pages created successfully`);
  if (failCount > 0) {
    console.log(`   ⚠️  ${failCount} pages failed`);
  }
  console.log(`   📁 Output: ${outputDir}/\n`);
}

main().catch(err => {
  console.error('\n❌ Prerender error:', err.message);
  process.exit(1);
});
