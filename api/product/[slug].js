import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

function buildProductSlug(product) {
  const key = product.sku || String(product.id)
  return encodeURIComponent(key)
}

function getProductImage(product) {
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    return product.images[0]
  }
  if (product.image) {
    return `https://via.placeholder.com/400x300?text=${encodeURIComponent(product.name?.ro || 'Product')}`
  }
  return 'https://via.placeholder.com/400x300'
}

function renderProductHtml(product, lang = 'ro') {
  const slug = buildProductSlug(product)
  const imageUrl = getProductImage(product)
  const productName = product.name?.[lang] || product.name || 'Product'
  const productDesc = product.description?.[lang] || product.description || ''

  return `<!DOCTYPE html>
<html lang="${lang}">
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
</html>`
}

export default async function handler(req, res) {
  const { slug } = req.query

  if (!slug) {
    return res.status(400).json({ error: 'Product slug is required' })
  }

  try {
    // Try to find product by SKU first, then by ID
    let { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('sku', slug)
      .single()

    if (!product) {
      // Try to find by ID if SKU not found
      const productId = parseInt(slug)
      if (!isNaN(productId)) {
        const { data: productById, error: idError } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single()

        if (productById) {
          product = productById
        }
      }
    }

    if (!product) {
      // Generate placeholder page for SEO if product not found
      const placeholderProduct = {
        id: slug,
        sku: slug,
        name: { ro: `Produs ${slug}`, ru: `Продукт ${slug}` },
        description: { ro: `Descriere produs ${slug}`, ru: `Описание продукта ${slug}` },
        price: 0,
        image: null,
        images: [],
        featured: false,
        category: 'uncategorized',
        specifications: { ro: {}, ru: {} }
      }
      product = placeholderProduct
    }

    // Determine language from request headers or default to Romanian
    const acceptLanguage = req.headers['accept-language'] || 'ro'
    const lang = acceptLanguage.includes('ru') ? 'ru' : 'ro'

    const html = renderProductHtml(product, lang)

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'public, max-age=3600') // Cache for 1 hour
    res.status(200).send(html)

  } catch (error) {
    console.error('Error fetching product:', error)

    // Return a basic HTML page for SEO even on error
    const errorHtml = `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sporto - Produse Sportive</title>
  <meta name="description" content="Sporto - echipamente și accesorii sportive profesionale">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>`

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.status(200).send(errorHtml)
  }
}