import { Link, useNavigate } from 'react-router';
import { Product } from '../data/products';
import { useLanguage, Language } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { ShoppingCart, Check, Package, ArrowUpRight, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { getBrandByName } from '../data/brands';

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

/** ~80% in stock, deterministic from id */
function getInStock(product: Product): boolean {
  if (product.inStock !== undefined) return product.inStock;
  return Number(product.id) % 5 !== 0;
}

/** Minimum order by price tier */
function getMinOrder(product: Product): number {
  if (product.minOrder !== undefined) return product.minOrder;
  if (product.price >= 10000) return 1;
  if (product.price >= 3000) return 2;
  if (product.price >= 500) return 5;
  return 10;
}

/** Price per set = unit price × min order */
function getPricePerSet(product: Product, minOrder: number): number {
  if (product.pricePerSet !== undefined) return product.pricePerSet;
  return product.price * minOrder;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ProductCard({ product, listView = false, onBrandClick }: ProductCardProps) {
  const { language } = useLanguage();
  const { addToCart, isInCart } = useCart();
  const navigate = useNavigate();
  const inCart = isInCart(product.id);

  const isRu = language === 'ru';
  const sku = getSku(product);
  const inStock = getInStock(product);
  const minOrder = getMinOrder(product);
  const pricePerSet = getPricePerSet(product, minOrder);

  const L = {
    inStock:   isRu ? 'В наличии'  : 'Disponibil',
    onOrder:   isRu ? 'Под заказ'  : 'La comandă',
    minOrder:  isRu ? 'Мин. заказ' : 'Min. comandă',
    unit:      isRu ? 'шт'         : 'buc',
    priceSet:  isRu ? 'Цена за сет' : 'Preț/set',
    addedMsg:  isRu
      ? `"${product.name.ru}" добавен в корзину`
      : `"${product.name.ro}" adăugat în coș`,
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
    });
    toast.success(L.addedMsg);
  };

  return (
    <Link
      to={`/product/${product.id}`}
      className={`group bg-white border border-gray-100 overflow-hidden hover:border-black transition-all duration-200 flex ${listView ? 'flex-row' : 'flex-col'}`}
    >
      {/* ── Image / Wireframe area ── */}
      <div className={`${listView ? 'w-24 flex-shrink-0 self-stretch' : 'aspect-[4/3]'} bg-gray-50 flex items-center justify-center relative overflow-hidden`}>

        {product.image ? (
          /* Real product image */
          <img
            src={product.image}
            alt={product.name[language as Language]}
            className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          /* No image — clean placeholder */
          <>
            <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id={`grid-${product.id}`} width="32" height="32" patternUnits="userSpaceOnUse">
                  <path d="M32 0 L0 0 0 32" fill="none" stroke="#000" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill={`url(#grid-${product.id})`} />
            </svg>
            <Package className="w-7 h-7 text-gray-200 group-hover:text-gray-300 transition-colors relative z-10" />
          </>
        )}

        {/* Stock badge — top left */}
        <div className="absolute top-2 left-2 z-10">
          <span className={`inline-flex items-center gap-1 text-[9px] uppercase tracking-wider px-1.5 py-0.5 ${
            inStock ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'
          }`}>
            <span className={`w-1 h-1 rounded-full ${inStock ? 'bg-white' : 'bg-gray-400'}`} />
            {inStock ? L.inStock : L.onOrder}
          </span>
        </div>

        {/* Sale badge — bottom left (if sale_price exists) */}
        {product.sale_price && (
          <div className="absolute bottom-2 left-2 z-10">
            <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-red-600 text-white">
              <Tag className="w-2.5 h-2.5" />
              {isRu ? 'Акция' : 'Promoție'}
            </span>
          </div>
        )}

        {/* Hover arrow — top right */}
        {!listView && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <ArrowUpRight className="w-3.5 h-3.5 text-gray-400" />
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className={`flex flex-col flex-1 gap-1.5 ${listView ? 'p-2.5' : 'p-3 gap-2'}`}>

        {/* Brand badge — only if known */}
        {product.brand && (() => {
          const matchedBrand = getBrandByName(product.brand);
          if (!matchedBrand) return null;

          if (onBrandClick) {
            return (
              <button
                type="button"
                onClick={e => { e.preventDefault(); e.stopPropagation(); onBrandClick(product.brand!); }}
                className="self-start text-[9px] uppercase tracking-[0.15em] text-gray-400 border border-gray-100 px-1.5 py-0.5 hover:border-black hover:text-black transition-colors"
              >
                {product.brand}
              </button>
            );
          }

          return (
            <button
              type="button"
              onClick={e => { e.preventDefault(); e.stopPropagation(); navigate(`/brands/${matchedBrand.id}`); }}
              className="self-start text-[9px] uppercase tracking-[0.15em] text-gray-400 border border-gray-100 px-1.5 py-0.5 hover:border-black hover:text-black transition-colors"
            >
              {product.brand}
            </button>
          );
        })()}

        {/* Product name */}
        <h3 className={`text-xs text-gray-900 leading-snug flex-1 group-hover:text-black ${listView ? 'line-clamp-2' : 'line-clamp-2'}`}>
          {product.name[language as Language]}
        </h3>

        {/* SKU — hidden in list view */}
        {!listView && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono tracking-wider text-gray-400 truncate">{sku}</span>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-gray-50 group-hover:border-gray-100 transition-colors" />

        {/* Price per set + cart button */}
        <div className="flex items-end justify-between gap-2 mt-auto">
          <div className="min-w-0">
            {!listView && <div className="text-[9px] uppercase tracking-wider text-gray-400 mb-0.5">{L.priceSet}</div>}
            {product.sale_price ? (
              // Акционная цена: старая перечёркнута, новая ярче
              <div className="flex flex-col gap-0.5">
                <div className="flex items-baseline gap-0.5">
                  <span className="text-xs tabular-nums text-gray-400 line-through leading-none">
                    {pricePerSet.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-gray-300">MDL</span>
                </div>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-base tabular-nums text-red-600 font-medium leading-none">
                    {(product.sale_price * minOrder).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-red-500">MDL</span>
                </div>
              </div>
            ) : (
              // Обычная цена
              <div className="flex items-baseline gap-0.5">
                <span className="text-sm tabular-nums text-gray-900 leading-none">
                  {pricePerSet.toLocaleString()}
                </span>
                <span className="text-[10px] text-gray-400">MDL</span>
              </div>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            title={inCart ? (isRu ? 'В корзине' : 'În coș') : (isRu ? 'В корзину' : 'Adaugă în coș')}
            className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 text-xs transition-all border ${
              inCart
                ? 'border-black bg-black text-white'
                : 'border-gray-200 text-gray-400 hover:border-black hover:text-black'
            }`}
          >
            {inCart ? <Check className="w-3 h-3" /> : <ShoppingCart className="w-3 h-3" />}
          </button>
        </div>

      </div>
    </Link>
  );
}