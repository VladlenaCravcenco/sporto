import type { ReactNode } from 'react';
import { ProductCardCartAction } from './ProductCardCartAction';
import { ArrowUpRight, Package, ShieldCheck, Tag } from 'lucide-react';

export interface CardProduct {
  id: string; name_ro: string; name_ru?: string | null; brand?: string | null;
  category?: string | null; sku?: string | null; image_url?: string | null; qty?: number | null;
  price: number; sale_price?: number | null; has_warranty?: boolean | null;
}

function formatPrice(value: number, language: 'ro' | 'ru') {
  return new Intl.NumberFormat(language === 'ru' ? 'ru-MD' : 'ro-MD', {
    maximumFractionDigits: 2,
  }).format(value);
}

export function ProductCardView({ product, language, href, actions, brandControl, listView = false }: {
  product: CardProduct; language: 'ro' | 'ru'; href: string;
  actions?: ReactNode; brandControl?: ReactNode; listView?: boolean;
}) {
  const name = language === 'ru' ? product.name_ru || product.name_ro : product.name_ro;
  const inStock = (product.qty ?? 0) > 0;
  const onSale = product.sale_price != null && product.sale_price > 0 && product.sale_price < product.price;
  const currentPrice = onSale ? product.sale_price as number : product.price;

  return (
    <article
      data-product-card
      className="group flex min-w-0 flex-col overflow-hidden rounded-[5px] border border-gray-100 bg-white transition duration-300 hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-[0_14px_34px_rgba(15,23,42,0.10)]"
    >
      <a href={href} className={`flex flex-1 min-w-0 ${listView ? "flex-row" : "flex-col"}`} >
      <div className={`relative flex items-center justify-center overflow-hidden bg-white ${listView ? "w-32 shrink-0" : "aspect-[4/3]"}`}>
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={name}
            loading="lazy"
            className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <Package className="h-8 w-8 text-gray-200" aria-hidden="true" />
        )}

        <span className={`absolute left-1.5 top-1.5 sm:left-3 sm:top-3 rounded-[3px] px-2 py-1 text-[11px] font-medium ${inStock ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'}`}>
          {inStock
            ? (language === 'ro' ? 'Disponibil' : 'В наличии')
            : (language === 'ro' ? 'Nu este în stoc' : 'Нет в наличии')}
        </span>

        {product.has_warranty && (
          <span className="absolute right-1.5 bottom-1.5 sm:bottom-auto sm:right-3 sm:top-3 inline-flex items-center gap-1 rounded-[3px] border border-gray-200 bg-white px-2 py-1 text-[11px] font-medium text-gray-700 shadow-sm">
            <ShieldCheck className="h-3 w-3 text-red-600" aria-hidden="true" />
            {language === 'ro' ? 'Garanție' : 'Гарантия'}
          </span>
        )}

        {onSale && (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-[3px] bg-red-600 px-2 py-1 text-[11px] font-medium text-white">
            <Tag className="h-3 w-3" aria-hidden="true" />
            {language === 'ro' ? 'Promoție' : 'Акция'}
          </span>
        )}

        <ArrowUpRight className="absolute bottom-3 right-3 h-4 w-4 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
      </div>

      <div className="flex flex-1 flex-col gap-2 border-t border-gray-100 p-2 sm:p-4">
        {product.brand && <p className="text-xs font-medium text-gray-500">{product.brand}</p>}
        <h2 className="line-clamp-2 min-h-11 text-xs sm:text-[15px] font-medium leading-[1.45] text-gray-900">{name}</h2>
        <p className="text-xs text-gray-400">{product.sku || `ART-${product.id}`}</p>
        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 sm:gap-x-3 gap-y-1 border-t border-gray-100 pt-3">
          <p className={`whitespace-nowrap text-xl sm:text-2xl font-semibold ${onSale ? 'text-red-600' : 'text-gray-900'}`}>
            {formatPrice(currentPrice, language)} <span className="text-sm font-normal">MDL</span>
          </p>
          {onSale && <p className="whitespace-nowrap text-sm text-gray-400 line-through">{formatPrice(product.price, language)} MDL</p>}
        </div>
      </div>
      </a>
      {<div className="flex flex-wrap items-center justify-between gap-2 px-2 pb-2 sm:px-4 sm:pb-4">{brandControl}<div className="ml-auto flex justify-end">{actions ?? <ProductCardCartAction product={product} language={language} />}</div></div>}
    </article>
  );
}

