import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  Package, ArrowRight, Search, ShoppingCart, Check,
  Loader2, Clock, X, Phone, TrendingUp, Mic,
} from 'lucide-react';
import { useLanguage, Language } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import type { Product } from '../data/products';
import { useCategories } from '../contexts/CategoriesContext';
import { CONTACTS } from '../../lib/contacts';
import { getCurrentPrice, hasSalePrice } from '../lib/productPricing';
import { getSearchHistory, addToHistory, removeFromHistory, clearHistory, POPULAR_QUERIES } from '../../lib/searchEngine';
import { buildProductPath } from '../lib/product-url';
import { supabase, type ProductRow } from '../../lib/supabase';
import { rowToProduct } from '../hooks/useSupabaseProducts';

interface SearchDropdownProps {
  query: string;
  onSelect: () => void;
  onQueryChange?: (q: string) => void;
}

interface SearchHit {
  product: Product;
}

function sanitizeSearchTerm(raw: string): string {
  return raw.trim().replace(/[,%()]/g, ' ');
}

// ── Миниатюра товара ───────────────────────────────────────────────────────────
function Thumb({ product }: { product: Product }) {
  const [imgErr, setImgErr] = useState(false);
  const src = product.image || (product.images?.[0] ?? '');
  if (src && !imgErr) {
    return (
      <div className="w-11 h-11 flex-shrink-0 border border-gray-100 overflow-hidden bg-gray-50">
        <img src={src} alt="" onError={() => setImgErr(true)} className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div className="w-11 h-11 flex-shrink-0 border border-gray-100 bg-gray-50 flex items-center justify-center">
      <Package className="w-4 h-4 text-gray-300" />
    </div>
  );
}

// ── Кнопка «Добавить в корзину» ───────────────────────────────────────────────
function QuickAdd({ product }: { product: Product }) {
  const { addToCart, isInCart } = useCart();
  const inCart = isInCart(product.id);
  return (
    <button
      type="button"
      onMouseDown={e => e.stopPropagation()}
      onClick={e => {
        e.preventDefault(); e.stopPropagation();
        addToCart({
          id: product.id,
          name: product.name,
          price: getCurrentPrice(product),
          image: product.image,
          category: product.category,
          sku: product.sku || undefined,
        });
      }}
      className={`flex-shrink-0 w-7 h-7 flex items-center justify-center border transition-all ${
        inCart
          ? 'bg-black border-black text-white'
          : 'border-gray-200 text-gray-400 hover:border-black hover:text-black bg-white'
      }`}
    >
      {inCart ? <Check className="w-3 h-3" /> : <ShoppingCart className="w-3 h-3" />}
    </button>
  );
}

export function SearchDropdown({
  query, onSelect, onQueryChange,
}: SearchDropdownProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const lang = language as Language;
  const categories = useCategories();
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [results, setResults] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);

  const L = (ro: string, ru: string) => lang === 'ro' ? ro : ru;
  const isEmptyQuery = query.trim().length === 0;

  // Обновляем историю при каждом изменении запроса
  useEffect(() => { setHistory(getSearchHistory()); }, [query]);

  const removeHistoryItem = useCallback((q: string) => {
    removeFromHistory(q); setHistory(getSearchHistory());
  }, []);
  const clearAllHistory = useCallback(() => { clearHistory(); setHistory([]); }, []);

  useEffect(() => {
    let cancelled = false;

    if (isEmptyQuery || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    (async () => {
      const term = sanitizeSearchTerm(query);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .or(`sku.ilike.%${term}%,id.ilike.%${term}%`)
        .order('qty', { ascending: false, nullsFirst: false })
        .order('id', { ascending: true })
        .limit(8);

      if (cancelled) return;
      if (error) {
        setResults([]);
      } else {
        setResults(((data as ProductRow[]) ?? []).map((row) => ({ product: rowToProduct(row) })));
      }
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [isEmptyQuery, query]);

  const totalRows = results.length;

  // ── Навигация клавишами ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault(); setActiveIdx(i => (i + 1) % (totalRows + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault(); setActiveIdx(i => i <= 0 ? totalRows : i - 1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeIdx === totalRows || activeIdx === -1 || results.length === 0) {
          goTo(`/catalog?search=${encodeURIComponent(query.trim())}`);
        } else {
          const prod = results[activeIdx]?.product;
          if (prod) goTo(buildProductPath(prod, lang));
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeIdx, totalRows, results, query, lang]);

  useEffect(() => { setActiveIdx(-1); }, [query]);

  useEffect(() => {
    if (activeIdx >= 0 && containerRef.current) {
      const el = containerRef.current.querySelector(`[data-idx="${activeIdx}"]`) as HTMLElement;
      el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [activeIdx]);

  const goTo = (url: string) => {
    if (query.trim().length >= 2) addToHistory(query.trim());
    navigate(url);
    onSelect();
  };

  const suggest = (q: string) => { onQueryChange?.(q); };

  // ── Загрузка: products ещё не пришли ──────────────────────────────────────
  if (loading && !isEmptyQuery) {
    return (
      <div className="absolute left-0 right-0 bg-white border border-gray-200 shadow-2xl z-[999]"
        style={{ top: '100%' }}>
        <div className="flex items-center gap-3 px-4 py-5">
          <Loader2 className="w-4 h-4 text-gray-300 animate-spin" />
          <span className="text-xs text-gray-400">{L('Se caută după SKU...', 'Поиск по SKU...')}</span>
        </div>
      </div>
    );
  }

  // ── Пустой запрос: история + популярные ──────────────────────────────────
  if (isEmptyQuery) {
    const popular = POPULAR_QUERIES[lang];
    return (
      <div className="absolute left-0 right-0 bg-white border border-gray-200 shadow-2xl z-[999] overflow-hidden"
        style={{ top: '100%', maxHeight: 480 }}>

        {/* История */}
        {history.length > 0 && (
          <>
            <div className="px-4 pt-3 pb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="text-[9px] uppercase tracking-[0.18em] text-gray-400">
                  {L('Recente', 'Недавние')}
                </span>
              </div>
              <button onMouseDown={e => e.preventDefault()} onClick={clearAllHistory}
                className="text-[10px] text-gray-300 hover:text-black transition-colors">
                {L('Șterge tot', 'Очистить')}
              </button>
            </div>
            {history.map(q => (
              <div key={q}
                onMouseDown={e => e.preventDefault()}
                onClick={() => suggest(q)}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer group transition-colors">
                <Clock className="w-3 h-3 text-gray-300 flex-shrink-0" />
                <span className="flex-1 text-xs text-gray-600 truncate">{q}</span>
                <button
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); removeHistoryItem(q); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5">
                  <X className="w-3 h-3 text-gray-300 hover:text-black" />
                </button>
              </div>
            ))}
            <div className="border-t border-gray-100 my-0" />
          </>
        )}

        {/* Популярные */}
        <div className="px-4 pt-3 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-3 h-3 text-gray-400" />
            <span className="text-[9px] uppercase tracking-[0.18em] text-gray-400">
              {L('Populare', 'Популярные')}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {popular.map(q => (
              <button key={q} onMouseDown={e => e.preventDefault()} onClick={() => suggest(q)}
                className="text-xs px-2.5 py-1 border border-gray-200 text-gray-600 hover:border-black hover:text-black transition-colors">
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isEmptyQuery && query.trim().length < 2) {
    return (
      <div className="absolute left-0 right-0 bg-white border border-gray-200 shadow-2xl z-[999]"
        style={{ top: '100%' }}>
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <Search className="w-4 h-4 text-gray-300 flex-shrink-0" />
            <span className="text-xs text-gray-500">
              {L('Introduceți minimum 2 caractere din SKU sau cod.', 'Введите минимум 2 символа SKU или кода.')}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!loading && !isEmptyQuery && results.length === 0) {
    return (
      <div className="absolute left-0 right-0 bg-white border border-gray-200 shadow-2xl z-[999]"
        style={{ top: '100%' }}>
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <Search className="w-4 h-4 text-gray-300 flex-shrink-0" />
            <span className="text-xs text-gray-500">
              {L('Niciun rezultat pentru ', 'Нет результатов для ')}
              <span className="text-gray-900">«{query}»</span>
            </span>
          </div>

          <div className="mb-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">
              {L('Categorii populare:', 'Популярные категории:')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {categories.slice(0, 5).map(cat => (
                <button key={cat.id} onMouseDown={e => e.preventDefault()}
                  onClick={() => goTo(`/catalog?category=${cat.id}`)}
                  className="text-[10px] px-2 py-0.5 border border-gray-200 text-gray-600 hover:border-black transition-colors">
                  {cat.name[lang]}
                </button>
              ))}
            </div>
          </div>

          <a href={`tel:${CONTACTS.phone}`}
            className="flex items-center gap-2 text-[10px] text-gray-400 hover:text-black transition-colors">
            <Phone className="w-3 h-3" />
            {L('Nu găsiți? Sunați-ne: ', 'Не нашли? Позвоните нам: ')}
            <span className="font-mono">{CONTACTS.phoneDisplay}</span>
          </a>
        </div>
      </div>
    );
  }

  // ── Результаты ────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef}
      className="absolute left-0 right-0 bg-white border border-gray-200 shadow-2xl z-[999] overflow-hidden flex flex-col"
      style={{ top: '100%', maxHeight: 540 }}>

      {/* Товары */}
      {results.length > 0 && (
        <div className="overflow-y-auto flex-1" style={{ scrollbarWidth: 'thin' }}>
          <div className="px-4 pt-3 pb-1 flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-[0.18em] text-gray-400">
              {L('Produse', 'Товары')}
            </span>
            <span className="text-[10px] text-gray-400">{results.length}</span>
          </div>

          {results.map(({ product }, i) => {
            const idx = i;
            const catLabel = categories.find(c => c.id === product.category)?.name[lang] ?? '';
            const isActive = activeIdx === idx;
            return (
              <div key={product.id} data-idx={idx}
                onMouseDown={e => e.preventDefault()}
                onClick={() => goTo(buildProductPath(product, lang))}
                onMouseEnter={() => setActiveIdx(idx)}
                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${isActive ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
                <Thumb product={product} />
                <div className="flex-1 min-w-0 pr-1">
                  <p className="text-xs leading-snug line-clamp-1 text-gray-900">{product.name[lang]}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {product.brand && (
                      <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-px">{product.brand}</span>
                    )}
                    {product.sku && (
                      <span className="text-[10px] text-gray-400 font-mono">#{product.sku}</span>
                    )}
                    {!product.brand && !product.sku && (
                      <span className="text-[10px] text-gray-400">{catLabel}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    {hasSalePrice(product) ? (
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] tabular-nums text-gray-400 line-through">
                          {product.price.toLocaleString()} <span className="text-gray-300">MDL</span>
                        </span>
                        <span className="text-xs tabular-nums text-red-600">
                          {getCurrentPrice(product).toLocaleString()} <span className="text-[10px] text-red-500">MDL</span>
                        </span>
                      </div>
                    ) : (
                      <>
                        <span className="text-xs tabular-nums text-gray-900">{getCurrentPrice(product).toLocaleString()}</span>
                        <span className="text-[10px] text-gray-400 ml-0.5">MDL</span>
                      </>
                    )}
                  </div>
                  <QuickAdd product={product} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Все результаты */}
      <div data-idx={totalRows}
        onMouseDown={e => e.preventDefault()}
        onClick={() => goTo(`/catalog?search=${encodeURIComponent(query.trim())}`)}
        onMouseEnter={() => setActiveIdx(totalRows)}
        className={`flex items-center justify-between px-4 py-3 cursor-pointer border-t border-gray-100 transition-colors flex-shrink-0 ${
          activeIdx === totalRows ? 'bg-black' : 'bg-gray-50 hover:bg-gray-100'
        }`}>
        <span className={`flex items-center gap-2 text-xs ${activeIdx === totalRows ? 'text-white' : 'text-gray-700'}`}>
          <Search className="w-3.5 h-3.5" />
          {L('Toate rezultatele pentru', 'Все результаты по')}{' '}
          <span className={activeIdx === totalRows ? 'text-gray-300' : 'text-black'}>«{query}»</span>
        </span>
        <ArrowRight className={`w-3.5 h-3.5 ${activeIdx === totalRows ? 'text-gray-300' : 'text-gray-400'}`} />
      </div>
    </div>
  );
}

// ── Голосовой поиск ────────────────────────────────────────────────────────────
interface VoiceSearchButtonProps {
  onResult: (text: string) => void;
  lang: Language;
}

export function VoiceSearchButton({ onResult, lang }: VoiceSearchButtonProps) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(!!(
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition
    ));
  }, []);

  if (!supported) return null;

  const start = () => {
    const WinRef = window as unknown as Record<string, unknown>;
    const SR = (WinRef.SpeechRecognition || WinRef.webkitSpeechRecognition) as new () => SpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.lang = lang === 'ro' ? 'ro-RO' : 'ru-RU';
    r.interimResults = false;
    r.maxAlternatives = 1;
    r.onstart = () => setListening(true);
    r.onend   = () => setListening(false);
    r.onerror = () => setListening(false);
    r.onresult = (e: SpeechRecognitionEvent) => {
      const text = e.results[0][0].transcript;
      if (text) onResult(text);
    };
    r.start();
  };

  return (
    <button type="button" onClick={start}
      title={lang === 'ro' ? 'Căutare vocală' : 'Голосовой поиск'}
      className={`absolute flex items-center justify-center transition-colors ${
        listening ? 'text-red-500 animate-pulse' : 'text-gray-300 hover:text-black'
      }`}
      style={{ right: 42, top: 0, bottom: 0, width: 32 }}>
      <Mic className="w-3.5 h-3.5" />
    </button>
  );
}
