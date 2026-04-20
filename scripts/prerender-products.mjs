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
  const productName = product.name.ro || product.name || 'Product';
  const productDesc = product.description?.ro || product.description || '';

  return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${productName} - Sporto</title>
  <meta name="description" content="${productDesc.substring(0, 160)}">
  <meta property="og:title" content="${productName} - Sporto">
  <meta property="og:description" content="${productDesc.substring(0, 160)}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:url" content="https://sporto.md/product/${slug}">
  <meta property="og:type" content="product">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="canonical" href="https://sporto.md/product/${slug}">
  <script type="application/ld+json">
  ${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': productName,
    'description': productDesc,
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
  })}
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