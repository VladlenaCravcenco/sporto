import { ProductCardView } from './ProductCardView';
import { useHref, useNavigate } from 'react-router';
import { Product } from '../data/products';
import { useLanguage } from '../contexts/LanguageContext';
import { getBrandByName } from '../data/brands';
import { getCurrentPrice, hasSalePrice } from '../lib/productPricing';
import { isProductInStock } from '../lib/productStock';
import { buildProductPath } from '../lib/product-url';

interface ProductCardProps {
  product: Product;
  listView?: boolean;
  onBrandClick?: (brandName: string) => void;
}

// ── B2B helpers ────────────────────────────────────────────────────────────────

/** Extract model code from name (e.g. "TRX-3000") or fall back to ART-XXXX */
function getSku(product: Product): string {
  if (product.sku) return product.sku;
  const match = product.name.ro.match(/[A-Z]{1,4}-\d+/);
  if (match) return match[0];
  return `ART-${String(product.id).padStart(4, '0')}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ProductCard({ product, listView = false, onBrandClick }: ProductCardProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const sku = getSku(product);
  const inStock = isProductInStock(product);
  const currentPrice = getCurrentPrice(product);
  const showSalePrice = hasSalePrice(product);

  const matchedBrand = product.brand ? getBrandByName(product.brand) : null;
  const href = useHref(buildProductPath(product, language));
  return <ProductCardView
    href={href}
    language={language}
    listView={listView}
    product={{ id: product.id, name_ro: product.name.ro, name_ru: product.name.ru,
      category: product.category, image_url: product.image, brand: product.brand, sku,
      price: product.price, sale_price: showSalePrice ? currentPrice : null,
      qty: inStock ? 1 : 0, has_warranty: product.hasWarranty }}
    brandControl={product.brand && (onBrandClick || matchedBrand) ? (
      <button type="button" className="text-xs text-gray-500 hover:text-black" onClick={() => {
        if (onBrandClick) onBrandClick(product.brand!);
        else if (matchedBrand) navigate(`/brands/${matchedBrand.id}`);
      }}>{product.brand}</button>
    ) : null}
  />;
}
