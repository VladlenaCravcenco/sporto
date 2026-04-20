import fs from 'fs';
import path from 'path';
import https from 'https';

const outputDir = path.join(process.cwd(), 'dist', 'product');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const projectUrl = 'jlqoqbfadjjpvhkiyfxb';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsbXFvcWJmYWRqanB2aGtpeWZ4YiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzA1OTYwNzQ3LCJleHAiOjE4NjM3Mjc3NDd9.4r_Y88HZCwReFT9p8SFwSU6cOshDqU_EF2DqnVyY5Rk';

let products = [];

function makeSupabaseRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = `${projectUrl}.supabase.co`;
    const requestOptions = {
      hostname: url,
      port: 443,
      path: `/rest/v1${path}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`,
        'apikey': anonKey,
      },
      ...options,
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          } else {
            resolve(JSON.parse(data));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000);
    req.end();
  });
}

function buildProductSlug(product) {
  const key = product.sku || String(product.id);
  return encodeURIComponent(key);
}

function renderProductHtml(product) {
  const imageUrl = product.image_url || 'https://via.placeholder.com/400x300';
  const fullImageUrl = imageUrl;
  const slug = buildProductSlug(product);

  return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${product.name_ro} - Sporto</title>
  <meta name="description" content="${product.description_ro || ''}">
  <meta property="og:title" content="${product.name_ro} - Sporto">
  <meta property="og:description" content="${product.description_ro || ''}">
  <meta property="og:image" content="${fullImageUrl}">
  <meta property="og:url" content="https://sporto.md/product/${slug}">
  <meta property="og:type" content="product">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="canonical" href="https://sporto.md/product/${slug}">
  <script type="application/ld+json">
  ${JSON.stringify(buildProductSchema(product, fullImageUrl, slug))}
  </script>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>`;
}

function buildProductSchema(product, imageUrl, slug) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name_ro,
    "description": product.description_ro || '',
    "image": [imageUrl],
    "sku": product.sku || slug,
    "brand": {
      "@type": "Brand",
      "name": "Sporto"
    },
    "offers": {
      "@type": "Offer",
      "price": product.price,
      "priceCurrency": "MDL",
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": "Sporto"
      }
    }
  };
}

async function fetchProducts() {
  try {
    const query = '/products?select=*&active=eq.true&limit=1000';
    const data = await makeSupabaseRequest(query);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('Fetch products from Supabase failed:', err.message);
    console.warn('Using local fallback products...');
    // Fallback для локального тестирования
    return [
      { 
        id: '50', 
        sku: 'TRX-1500',
        name_ro: 'Bandă Alergat TRX-1500 Club', 
        name_ru: 'Беговая Дорожка TRX-1500 Club',
        description_ro: 'Bandă de alergat semi-comercială cu motor 3.5HP, ideală pentru cluburi și hoteluri.', 
        description_ru: 'Полукоммерческая беговая дорожка с мотором 3.5HP, идеальна для клубов и отелей.',
        price: 28000, 
        image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop',
        active: true
      },
      { 
        id: '51', 
        sku: 'BR-3000',
        name_ro: 'Bicicletă Orizontală BR-3000', 
        name_ru: 'Горизонтальный Велотренажер BR-3000',
        description_ro: 'Bicicletă orizontală cu spătar confortabil, rezistență electromagnetică și display avansat.', 
        description_ru: 'Горизонтальный велотренажер с удобной спинкой, электромагнитным сопротивлением и дисплеем.',
        price: 18000, 
        image_url: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=800&h=600&fit=crop',
        active: true
      },
    ];
  }
}

async function main() {
  products = await fetchProducts();
  
  if (products.length === 0) {
    console.warn('No products fetched from Supabase. Prerender skipped.');
    return;
  }

  for (const product of products) {
    const slug = buildProductSlug(product);
    const html = renderProductHtml(product);
    try {
      fs.writeFileSync(path.join(outputDir, `${slug}.html`), html);
    } catch (err) {
      console.error(`Failed to write ${slug}.html:`, err.message);
    }
  }

  console.log(`Prerendered ${products.length} product pages into ${outputDir}/`);
}

main().catch(console.error);