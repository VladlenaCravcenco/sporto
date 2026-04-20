import fs from 'fs';
import path from 'path';

const outputDir = path.join(process.cwd(), 'dist', 'product');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const products = [
  { id: '50', name: { ro: 'Bandă Alergat TRX-1500 Club', ru: 'Беговая Дорожка TRX-1500 Club' }, description: { ro: 'Bandă de alergat semi-comercială cu motor 3.5HP, ideală pentru cluburi și hoteluri.', ru: 'Полукоммерческая беговая дорожка с мотором 3.5HP, идеальна для клубов и отелей.' }, price: 28000, image: 'fitness-treadmill', sku: 'TRX-1500' },
  { id: '51', name: { ro: 'Bicicletă Orizontală BR-3000', ru: 'Горизонтальный Велотренажер BR-3000' }, description: { ro: 'Bicicletă orizontală cu spătar confortabil, rezistență electromagnetică și display avansat.', ru: 'Горизонтальный велотренажер с удобной спинкой, электромагнитным сопротивлением и дисплеем.' }, price: 18000, image: 'fitness-bike', sku: 'BR-3000' },
];

const productImages = {
  'fitness-treadmill': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop',
  'fitness-bike': 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=800&h=600&fit=crop',
};

function buildProductSlug(product) {
  const key = product.sku || product.id;
  return encodeURIComponent(key);
}

function renderProductHtml(product) {
  const imageUrl = productImages[product.image] || 'https://via.placeholder.com/400x300';
  const fullImageUrl = imageUrl;

  return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${product.name.ro} - Sporto</title>
  <meta name="description" content="${product.description.ro}">
  <meta property="og:title" content="${product.name.ro} - Sporto">
  <meta property="og:description" content="${product.description.ro}">
  <meta property="og:image" content="${fullImageUrl}">
  <meta property="og:url" content="https://sporto.md/product/${buildProductSlug(product)}">
  <meta property="og:type" content="product">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="canonical" href="https://sporto.md/product/${buildProductSlug(product)}">
  <script type="application/ld+json">
  ${JSON.stringify(buildProductSchema(product, fullImageUrl))}
  </script>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>`;
}

function buildProductSchema(product, imageUrl) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name.ro,
    "description": product.description.ro,
    "image": [imageUrl],
    "sku": product.sku,
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

function main() {
  for (const product of products) {
    const slug = buildProductSlug(product);
    const html = renderProductHtml(product);
    fs.writeFileSync(path.join(outputDir, `${slug}.html`), html);
  }

  console.log(`Prerendered ${products.length} product pages`);
}

main();