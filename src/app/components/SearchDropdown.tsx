import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  Package, ArrowRight, Search, LayoutGrid, ShoppingCart, Check,
  ChevronRight, Loader2, Clock, X, Sparkles, Tag, Phone, TrendingUp, Mic,
} from 'lucide-react';
import { useLanguage, Language } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import type { Product } from '../data/products';
import { useCategories } from '../contexts/CategoriesContext';
import { CONTACTS } from '../../lib/contacts';
import {
  norm, searchProducts, getSuggestions,
  getSearchHistory, addToHistory, removeFromHistory, clearHistory,
  POPULAR_QUERIES,
  type SearchResult,
} from '../../lib/searchEngine';

// ── Props — products приходят снаружи (из Header), грузятся один раз ────────
interface SearchDropdownProps {
  query: string;
  onSelect: () => void;
  onQueryChange?: (q: string) => void;
  /** Список товаров, загруженный в Header при старте приложения */
  products: Product[];
  /** true = данные ещё грузятся */
  loading: boolean;
}

// ── Подсветка совпадений ───────────────────────────────────────────────────────
function Highlight({ text, tokens }: { text: string; tokens: string[] }) {
  if (!tokens.length) return <span className="text-gray-900">{text}</span>;
  const escaped = tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  try {
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) =>
          tokens.some(t => norm(part).includes(t)) ? (
            <span key={i} className="text-black font-semibold">{part}</span>
          ) : (
            <span key={i} className="text-gray-500">{part}</span>
          )
        )}
      </span>
    );
  } catch {
    return <span className="text-gray-900">{text}</span>;
  }
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
          price: product.price,
          image: product.image,
          category: product.category,
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

// ── Значок типа совпадения ─────────────────────────────────────────────────────
function MatchBadge({ type }: { type: string }) {
  if (type === 'fuzzy')
    return <span className="text-[9px] px-1 py-px bg-amber-50 text-amber-500 border border-amber-200">~опечатка</span>;
  if (type === 'synonym')
    return <span className="text-[9px] px-1 py-px bg-blue-50 text-blue-500 border border-blue-200">синоним</span>;
  if (type === 'concept')
    return <span className="text-[9px] px-1 py-px bg-purple-50 text-purple-500 border border-purple-200">по смыслу</span>;
  return null;
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Главный компонент ─────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
export function SearchDropdown({
  query, onSelect, onQueryChange, products, loading,
}: SearchDropdownProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const lang = language as Language;
  const categories = useCategories();
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<string[]>([]);

  const L = (ro: string, ru: string) => lang === 'ro' ? ro : ru;
  const isEmptyQuery = query.trim().length === 0;

  // Обновляем историю при каждом изменении запроса
  useEffect(() => { setHistory(getSearchHistory()); }, [query]);

  const removeHistoryItem = useCallback((q: string) => {
    removeFromHistory(q); setHistory(getSearchHistory());
  }, []);
  const clearAllHistory = useCallback(() => { clearHistory(); setHistory([]); }, []);

  // ── Результаты поиска ──────────────────────────────────────────────────────
  const results: SearchResult | null = useMemo(() => {
    if (isEmptyQuery || !products.length) return null;
    return searchProducts(products, query, lang, 8);
  }, [query, products, lang, isEmptyQuery]);

  // ── Совпадения по категориям ───────────────────────────────────────────────
  const catMatches = useMemo(() => {
    if (isEmptyQuery || !results) return [];
    const other: Language = lang === 'ro' ? 'ru' : 'ro';
    const all = [...results.rawTokens, ...results.expandedTokens.withSynonyms];
    return categories.filter(cat => {
      const n  = norm(cat.name[lang]);
      const no = norm(cat.name[other]);
      return all.some(t => n.includes(t) || no.includes(t));
    }).slice(0, 2);
  }, [results, categories, lang, isEmptyQuery]);

  // ── Подсказки при 0 результатах ───────────────────────────────────────────
  const suggestions = useMemo(() => {
    if (!results || results.total > 0 || !results.rawTokens.length) return [];
    return getSuggestions(products, results.rawTokens, lang);
  }, [results, products, lang]);

  const totalRows = catMatches.length + (results?.hits.length ?? 0);

  // ── Навигация клавишами ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault(); setActiveIdx(i => (i + 1) % (totalRows + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault(); setActiveIdx(i => i <= 0 ? totalRows : i - 1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeIdx === totalRows || activeIdx === -1) {
          goTo(`/catalog?search=${encodeURIComponent(query.trim())}`);
        } else if (activeIdx < catMatches.length) {
          goTo(`/catalog?category=${catMatches[activeIdx].id}`);
        } else {
          const prod = results?.hits[activeIdx - catMatches.length]?.product;
          if (prod) goTo(`/product/${prod.id}`);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeIdx, totalRows, catMatches, results, query]);

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
          <span className="text-xs text-gray-400">{L('Se caută...', 'Загрузка каталога...')}</span>
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

  // ── Нет результатов ────────────────────────────────────────────────────────
  if (results && results.total === 0) {
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

          {suggestions.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">
                {L('Încercați:', 'Попробуйте:')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map(s => (
                  <button key={s} onMouseDown={e => e.preventDefault()} onClick={() => suggest(s)}
                    className="text-xs px-2.5 py-1 border border-gray-300 text-gray-700 hover:border-black hover:text-black transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

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

  if (!results) return null;

  // ── Результаты ────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef}
      className="absolute left-0 right-0 bg-white border border-gray-200 shadow-2xl z-[999] overflow-hidden flex flex-col"
      style={{ top: '100%', maxHeight: 540 }}>

      {/* Фильтр цены */}
      {results.priceRange && (
        <div className="px-4 py-1.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2 flex-shrink-0">
          <Tag className="w-3 h-3 text-gray-400" />
          <span className="text-[10px] text-gray-500">
            {results.priceRange.min !== undefined && results.priceRange.max !== undefined
              ? `${results.priceRange.min.toLocaleString()} – ${results.priceRange.max.toLocaleString()} MDL`
              : results.priceRange.max !== undefined
                ? `${L('până la', 'до')} ${results.priceRange.max.toLocaleString()} MDL`
                : `${L('de la', 'от')} ${results.priceRange.min!.toLocaleString()} MDL`}
          </span>
        </div>
      )}

      {/* Тип поиска */}
      {(results.hasFuzzy || results.hasSynonym || results.hasConcept) && (
        <div className="px-4 py-1.5 bg-gradient-to-r from-violet-50 to-transparent border-b border-violet-100 flex items-center gap-2 flex-shrink-0">
          <Sparkles className="w-3 h-3 text-violet-400 flex-shrink-0" />
          <span className="text-[10px] text-violet-500">
            {results.hasConcept
              ? L('Rezultate după sensul cererii', 'Результаты по смыслу запроса')
              : results.hasSynonym
                ? L('Incluse sinonime și variante', 'Включены синонимы и варианты')
                : L('Căutare aproximativă — greșelile de tipar luate în calcul', 'Нечёткий поиск — опечатки учтены')}
          </span>
        </div>
      )}

      {/* Категории */}
      {catMatches.length > 0 && (
        <div className="border-b border-gray-100 flex-shrink-0">
          <div className="px-4 pt-3 pb-1">
            <span className="text-[9px] uppercase tracking-[0.18em] text-gray-400">
              {L('Categorii', 'Категории')}
            </span>
          </div>
          {catMatches.map((cat, i) => (
            <div key={cat.id} data-idx={i}
              onMouseDown={e => e.preventDefault()}
              onClick={() => goTo(`/catalog?category=${cat.id}`)}
              onMouseEnter={() => setActiveIdx(i)}
              className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${activeIdx === i ? 'bg-black' : 'hover:bg-gray-50'}`}>
              <div className={`w-8 h-8 flex items-center justify-center flex-shrink-0 ${activeIdx === i ? 'bg-white/10' : 'bg-gray-100'}`}>
                <LayoutGrid className={`w-3.5 h-3.5 ${activeIdx === i ? 'text-white' : 'text-gray-500'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs ${activeIdx === i ? 'text-white' : 'text-gray-900'}`}>{cat.name[lang]}</p>
                <p className={`text-[10px] mt-0.5 text-gray-400`}>
                  {cat.subcategories.length} {L('subcategorii', 'подкатегорий')}
                </p>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 ${activeIdx === i ? 'text-gray-400' : 'text-gray-300'}`} />
            </div>
          ))}
        </div>
      )}

      {/* Товары */}
      {results.hits.length > 0 && (
        <div className="overflow-y-auto flex-1" style={{ scrollbarWidth: 'thin' }}>
          <div className="px-4 pt-3 pb-1 flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-[0.18em] text-gray-400">
              {L('Produse', 'Товары')}
            </span>
            {results.total > results.hits.length && (
              <span className="text-[10px] text-gray-400">
                {results.hits.length} {L('din', 'из')} {results.total}
              </span>
            )}
          </div>

          {results.hits.map(({ product, matchType }, i) => {
            const idx = catMatches.length + i;
            const catLabel = categories.find(c => c.id === product.category)?.name[lang] ?? '';
            const isActive = activeIdx === idx;
            return (
              <div key={product.id} data-idx={idx}
                onMouseDown={e => e.preventDefault()}
                onClick={() => goTo(`/product/${product.id}`)}
                onMouseEnter={() => setActiveIdx(idx)}
                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${isActive ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
                <Thumb product={product} />
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-xs leading-snug line-clamp-1">
                      <Highlight text={product.name[lang]} tokens={results.rawTokens} />
                    </p>
                    {matchType !== 'exact' && <MatchBadge type={matchType} />}
                  </div>
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
                    <span className="text-xs tabular-nums text-gray-900">{product.price.toLocaleString()}</span>
                    <span className="text-[10px] text-gray-400 ml-0.5">MDL</span>
                  </div>
                  <QuickAdd product={product} />
                </div>
              </div>
            );
          })}

          {/* Бренды-чипы */}
          {results.matchedBrands.length > 1 && (
            <div className="px-4 py-2.5 border-t border-gray-100 flex items-center gap-2 flex-wrap">
              <span className="text-[9px] uppercase tracking-wider text-gray-400">
                {L('Branduri:', 'Бренды:')}
              </span>
              {results.matchedBrands.map(brand => (
                <button key={brand}
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => goTo(`/catalog?brand=${encodeURIComponent(brand)}`)}
                  className="text-[10px] px-2 py-0.5 border border-gray-200 text-gray-600 hover:border-black hover:text-black transition-colors">
                  {brand}
                </button>
              ))}
            </div>
          )}
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
        <span className={`flex items-center gap-1.5 text-xs ${activeIdx === totalRows ? 'text-gray-300' : 'text-gray-400'}`}>
          <span className="tabular-nums">{results.total}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
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
