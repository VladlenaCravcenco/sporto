import { applyAdminProductSearch } from '../../lib/admin-product-search';
import { useSimilarProducts } from '../hooks/useSimilarProducts';
import { useProductSkuStatus } from '../hooks/useProductSkuStatus';
import { checkProductSkus, productSkuError } from '../../lib/product-sku';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { supabase, fetchAllSupabaseRows, type ProductRow } from '../../lib/supabase';
import { useSupabaseBrands } from '../hooks/useSupabaseBrands';
import { useCategories, useCategoriesContext } from '../contexts/CategoriesContext';
import ExcelJS from 'exceljs';
import {
  Search, Plus, X, Trash2, ArrowLeft, RefreshCw,
  ChevronDown, Package, Star, Eye, EyeOff, ExternalLink, AlertCircle,
  ImageIcon, Check, LogOut, Youtube, Tag, Download,
} from 'lucide-react';
import { logoutAdmin } from '../../lib/adminAuth';
import { useAdminLang } from '../contexts/AdminLangContext';
import { buildProductPath } from '../lib/product-url';
import { cacheInvalidate } from '../../lib/queryCache';
import { getAttributeUnit, useProductAttributeDefinitions, type ProductAttributeValue } from '../hooks/useProductAttributes';

interface BrandComboboxProps {
  value: string;
  onChange: (val: string) => void;
  allProductBrands: string[]; // unique brand strings from loaded products
  supabaseBrandNames: string[]; // brand names from the brands table
  lang: 'ro' | 'ru';
}

interface CategoryComboboxProps {
  value: string;
  onChange: (val: string) => void;
  categories: ReturnType<typeof useCategories>;
  onCreate: (name: string) => Promise<string | null>;
  lang: 'ro' | 'ru';
}

interface SubcategoryComboboxProps {
  value: string;
  onChange: (val: string) => void;
  subcategories: Array<{ id: string; name: { ro: string; ru: string } }>;
  disabled?: boolean;
  onCreate: (name: string) => Promise<string | null>;
  lang: 'ro' | 'ru';
}

function generateProductId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `prod_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function formatSupabaseError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object') {
    const value = error as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
    return [value.message, value.details, value.hint, value.code ? `Code: ${value.code}` : null]
      .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
      .join(' · ');
  }
  return String(error);
}

function BrandCombobox({ value, onChange, allProductBrands, supabaseBrandNames, lang }: BrandComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  // Sync internal query when parent value changes (e.g. form reset)
  useEffect(() => { setQuery(value); }, [value]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Build full list: Supabase brands table + brands from existing products (deduped)
  const allOptions = useMemo(() => {
    const set = new Set<string>();
    supabaseBrandNames.forEach(b => set.add(b));
    allProductBrands.forEach(b => { if (b) set.add(b); });
    return Array.from(set).sort();
  }, [allProductBrands, supabaseBrandNames]);

  const q = query.trim().toLowerCase();
  const filtered = allOptions.filter(o => o.toLowerCase().includes(q));
  const isNew = q.length > 0 && !allOptions.some(o => o.toLowerCase() === q);

  const select = (val: string) => {
    setQuery(val);
    onChange(val);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="HMS, Technogym..."
          className="w-full h-9 px-3 pr-8 text-xs border admin-border admin-surface focus:outline-none admin-focus-border transition-colors"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setOpen(o => !o)}
          className="absolute right-2 top-1/2 -translate-y-1/2 admin-muted admin-hover-ink transition-colors"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {query && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => { setQuery(''); onChange(''); setOpen(true); }}
            className="absolute right-7 top-1/2 -translate-y-1/2 admin-muted admin-hover-ink transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-0.5 admin-surface border admin-border shadow-lg max-h-52 overflow-y-auto">

          {isNew && (
            <button
              type="button"
              onMouseDown={() => select(query.trim())}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs admin-hover-surface transition-colors border-b admin-border text-left"
            >
              <Plus className="w-3 h-3 admin-ink flex-shrink-0" />
              <span>
                <span className="admin-muted">{lang === 'ru' ? 'Добавить новый бренд: ' : 'Adaugă brand nou: '}</span>
                <span className="admin-ink">{query.trim()}</span>
              </span>
            </button>
          )}

          {filtered.length > 0 ? (
            filtered.map(opt => {
              return (
                <button
                  key={opt}
                  type="button"
                  onMouseDown={() => select(opt)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs admin-hover-surface transition-colors text-left ${opt === value ? 'admin-canvas' : ''}`}
                >
                  <span className="flex items-center gap-2">
                    {opt === value && <Check className="w-3 h-3 admin-ink flex-shrink-0" />}
                    <span className={opt === value ? 'admin-ink' : 'admin-ink'}>{opt}</span>
                  </span>
                  {supabaseBrandNames.includes(opt) && (
                    <span className="text-xs   admin-muted flex-shrink-0 flex items-center gap-1">
                      <Tag className="w-2.5 h-2.5" />
                      db
                    </span>
                  )}
                </button>
              );
            })
          ) : !isNew ? (
            <div className="px-3 py-3 text-xs admin-muted text-center">{lang === 'ru' ? 'Бренды не найдены' : 'Niciun brand găsit'}</div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function CategoryCombobox({ value, onChange, categories, onCreate, lang }: CategoryComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = categories.find((c) => c.id === value);

  useEffect(() => {
    setQuery(selected?.name[lang] || '');
  }, [selected?.name.ro, selected?.name.ru, lang, value]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const q = query.trim().toLowerCase();
  const filtered = categories.filter((c) =>
    c.name.ro.toLowerCase().includes(q)
    || c.name.ru.toLowerCase().includes(q)
    || c.id.toLowerCase().includes(q)
  );
  const isNew = q.length > 0 && !categories.some((c) =>
    c.name.ro.toLowerCase() === q || c.name.ru.toLowerCase() === q || c.id.toLowerCase() === q
  );

  const select = (id: string) => {
    onChange(id);
    setOpen(false);
  };

  const createAndSelect = async () => {
    const name = query.trim();
    if (!name) return;
    setCreating(true);
    const id = await onCreate(name);
    setCreating(false);
    if (id) {
      onChange(id);
      setOpen(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Cardio, Fitness..."
          className="w-full h-9 px-3 pr-8 text-xs border admin-border admin-surface focus:outline-none admin-focus-border transition-colors"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setOpen(o => !o)}
          className="absolute right-2 top-1/2 -translate-y-1/2 admin-muted admin-hover-ink transition-colors"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {query && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => { setQuery(''); onChange(''); setOpen(true); }}
            className="absolute right-7 top-1/2 -translate-y-1/2 admin-muted admin-hover-ink transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-0.5 admin-surface border admin-border shadow-lg max-h-52 overflow-y-auto">
          {isNew && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={createAndSelect}
              disabled={creating}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs admin-hover-surface transition-colors border-b admin-border text-left disabled:opacity-50"
            >
              <Plus className="w-3 h-3 admin-ink flex-shrink-0" />
              <span>
                <span className="admin-muted">{lang === 'ru' ? 'Добавить категорию: ' : 'Adaugă categorie: '}</span>
                <span className="admin-ink">{query.trim()}</span>
              </span>
            </button>
          )}

          {filtered.length > 0 ? (
            filtered.map(cat => (
              <button
                key={cat.id}
                type="button"
                onMouseDown={() => select(cat.id)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs admin-hover-surface transition-colors text-left ${cat.id === value ? 'admin-canvas' : ''}`}
              >
                <span className="flex items-center gap-2">
                  {cat.id === value && <Check className="w-3 h-3 admin-ink flex-shrink-0" />}
                  <span className={cat.id === value ? 'admin-ink' : 'admin-ink'}>{cat.name[lang]}</span>
                </span>
              </button>
            ))
          ) : !isNew ? (
            <div className="px-3 py-3 text-xs admin-muted text-center">{lang === 'ru' ? 'Категории не найдены' : 'Nicio categorie găsită'}</div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function SubcategoryCombobox({ value, onChange, subcategories, disabled, onCreate, lang }: SubcategoryComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = subcategories.find((s) => s.id === value);

  useEffect(() => {
    setQuery(selected?.name[lang] || '');
  }, [selected?.name.ro, selected?.name.ru, lang, value]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const q = query.trim().toLowerCase();
  const filtered = subcategories.filter((s) =>
    s.name.ro.toLowerCase().includes(q)
    || s.name.ru.toLowerCase().includes(q)
    || s.id.toLowerCase().includes(q)
  );
  const isNew = q.length > 0 && !subcategories.some((s) =>
    s.name.ro.toLowerCase() === q || s.name.ru.toLowerCase() === q || s.id.toLowerCase() === q
  );

  const select = (id: string) => {
    onChange(id);
    setOpen(false);
  };

  const createAndSelect = async () => {
    const name = query.trim();
    if (!name) return;
    setCreating(true);
    const id = await onCreate(name);
    setCreating(false);
    if (id) {
      onChange(id);
      setOpen(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => !disabled && setOpen(true)}
          disabled={disabled}
          placeholder={disabled ? (lang === 'ru' ? 'Сначала выберите категорию' : 'Alege mai întâi categoria') : (lang === 'ru' ? 'Беговые дорожки, гантели...' : 'Benzi, Gantere...')}
          className="w-full h-9 px-3 pr-8 text-xs border admin-border admin-surface focus:outline-none admin-focus-border transition-colors disabled:opacity-40"
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => !disabled && setOpen(o => !o)}
          className="absolute right-2 top-1/2 -translate-y-1/2 admin-muted admin-hover-ink transition-colors disabled:opacity-30"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {query && !disabled && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => { setQuery(''); onChange(''); setOpen(true); }}
            className="absolute right-7 top-1/2 -translate-y-1/2 admin-muted admin-hover-ink transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {open && !disabled && (
        <div className="absolute z-50 top-full left-0 right-0 mt-0.5 admin-surface border admin-border shadow-lg max-h-52 overflow-y-auto">
          {isNew && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={createAndSelect}
              disabled={creating}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs admin-hover-surface transition-colors border-b admin-border text-left disabled:opacity-50"
            >
              <Plus className="w-3 h-3 admin-ink flex-shrink-0" />
              <span>
                <span className="admin-muted">{lang === 'ru' ? 'Добавить подкатегорию: ' : 'Adaugă subcategorie: '}</span>
                <span className="admin-ink">{query.trim()}</span>
              </span>
            </button>
          )}

          {filtered.length > 0 ? (
            filtered.map(sub => (
              <button
                key={sub.id}
                type="button"
                onMouseDown={() => select(sub.id)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs admin-hover-surface transition-colors text-left ${sub.id === value ? 'admin-canvas' : ''}`}
              >
                <span className="flex items-center gap-2">
                  {sub.id === value && <Check className="w-3 h-3 admin-ink flex-shrink-0" />}
                  <span className={sub.id === value ? 'admin-ink' : 'admin-ink'}>{sub.name[lang]}</span>
                </span>
              </button>
            ))
          ) : !isNew ? (
            <div className="px-3 py-3 text-xs admin-muted text-center">{lang === 'ru' ? 'Подкатегории не найдены' : 'Nicio subcategorie găsită'}</div>
          ) : null}
        </div>
      )}
    </div>
  );
}

type SortKey = 'name_ro' | 'price' | 'qty' | 'id';
const PAGE_SIZE = 50;

const EMPTY_FORM: Partial<ProductRow> = {
  name_ro: '', name_ru: '',
  description_ro: '', description_ru: '',
  seo_description_ro: '', seo_description_ru: '',
  seo_keywords_ro: '', seo_keywords_ru: '',
  category: '', subcategory: '',
  price: 0, sku: '', brand: '',
  unit: 'BUC.', qty: 0,
  image_url: '', images: [], youtube_url: '', active: true, featured: false, has_warranty: false,
};

function toSlug(value: string) {
  const slug = value.toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[șş]/g, 's').replace(/[țţ]/g, 't')
    .replace(/[ăâ]/g, 'a').replace(/[î]/g, 'i')
    .replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return slug;
}

function catLabel(categories: ReturnType<typeof useCategories>, id: string) {
  return categories.find(c => c.id === id)?.name.ro ?? id;
}
function subcatLabel(categories: ReturnType<typeof useCategories>, catId: string, subId: string) {
  return categories.find(c => c.id === catId)?.subcategories.find(s => s.id === subId)?.name.ro ?? subId;
}

function applyAdminProductFilters(
  query: any,
  params: {
    search: string;
    category: string;
    brand: string;
    subcategory: string;
    status: 'all' | 'active' | 'inactive';
    sortKey: SortKey;
    sortAsc: boolean;
  },
) {
  let next = query;
  const brand = params.brand.trim();

  next = applyAdminProductSearch(next, params.search);
  if (params.category.trim()) next = next.eq('category', params.category.trim());
  if (brand) next = next.ilike('brand', `%${brand}%`);
  if (params.subcategory.trim()) next = next.eq('subcategory', params.subcategory.trim());
  if (params.status === 'active') next = next.eq('active', true);
  if (params.status === 'inactive') next = next.eq('active', false);

  return next.order(params.sortKey, { ascending: params.sortAsc });
}

export function AdminProducts() {
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const { t, lang } = useAdminLang();
  const l = (ro: string, ru: string) => (lang === 'ru' ? ru : ro);
  const { allCategories: categories, refetchCategories } = useCategoriesContext();
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const listRequest = useRef(0);
  const [catFilter, setCatFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [subcatFilter, setSubcatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name_ro');
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const latestListQuery = useRef('');
  latestListQuery.current = JSON.stringify([search, catFilter, brandFilter, subcatFilter, statusFilter, sortKey, sortAsc, page]);

  // Edit panel
  const [panelOpen, setPanelOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<ProductRow>>(EMPTY_FORM);
  const similarity = useSimilarProducts({ id: editId, sku: form.sku, name_ro: form.name_ro, name_ru: form.name_ru }, panelOpen);
  const skuStatus = useProductSkuStatus(form.sku || '', editId, panelOpen);
  const location = useLocation();
  const linkedProductId = new URLSearchParams(location.search).get('product');
  const [saving, setSaving] = useState(false);
  const saveInFlight = useRef(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null); // which slot is uploading
  const [gallery, setGallery] = useState<string[]>([]); // up to 4 image URLs
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [storageNote, setStorageNote] = useState(false);
  const [attributeValues, setAttributeValues] = useState<Record<string, string | boolean>>({});
  const [attributeTextValues, setAttributeTextValues] = useState<Record<string, { ro: string; ru: string }>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadSlotRef = useRef<number>(0); // which slot triggered the file picker
  const navigate = useNavigate();
  const { attributes: categoryAttributes } = useProductAttributeDefinitions(form.category || undefined);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const invalidateProductCaches = useCallback(() => {
    cacheInvalidate('products:');
    cacheInvalidate('brands:active');
    cacheInvalidate('brands:counts');
  }, []);

  const load = useCallback(async () => {
    const queryKey = JSON.stringify([search, catFilter, brandFilter, subcatFilter, statusFilter, sortKey, sortAsc, page]);
    if (queryKey !== latestListQuery.current) return;
    const requestId = ++listRequest.current;
    const isCurrent = () => requestId === listRequest.current && queryKey === latestListQuery.current;
    setLoading(true);
    try {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const query = applyAdminProductFilters(
        supabase
          .from('products')
          .select('*', { count: 'exact' }),
        {
          search,
          category: catFilter,
          brand: brandFilter,
          subcategory: subcatFilter,
          status: statusFilter,
          sortKey,
          sortAsc,
        },
      );
      const { data, count, error } = await query.range(from, to);
      if (!isCurrent()) return;
      if (error) throw error;
      setRows((data as ProductRow[]) ?? []);
      setTotalCount(count ?? 0);
    } catch (error) {
      if (!isCurrent()) return;
      setRows([]);
      setTotalCount(0);
      showToast(error instanceof Error ? error.message : 'Failed to load products', false);
    }
    if (isCurrent()) setLoading(false);
  }, [page, search, catFilter, brandFilter, subcatFilter, statusFilter, sortKey, sortAsc]);

  useEffect(() => {
    const timer = setTimeout(() => { void load(); }, 250);
    return () => { clearTimeout(timer); listRequest.current++; };
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, catFilter, brandFilter, subcatFilter, statusFilter, sortKey, sortAsc]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    if (!loading && page > maxPage) {
      setPage(maxPage);
    }
  }, [loading, page, totalCount]);

  useEffect(() => {
    const channel = supabase
      .channel('admin-products-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => { load(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const [exporting, setExporting] = useState(false);

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const dataToExport = await fetchAllSupabaseRows<ProductRow>((from, to) => {
        const query = applyAdminProductFilters(
          supabase.from('products').select('*'),
          {
            search,
            category: catFilter,
            brand: brandFilter,
            subcategory: subcatFilter,
            status: statusFilter,
            sortKey,
            sortAsc,
          },
        );
        return query.range(from, to);
      });

      console.log('Export data:', {
        total: totalCount,
        filtered: dataToExport.length,
        catFilter,
        search,
        statusFilter
      });

      if (dataToExport.length === 0) {
        showToast(l('Niciun produs de exportat cu filtrele curente', 'Нет товаров для экспорта с текущими фильтрами'), false);
        setExporting(false);
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Produse', {
        pageSetup: { 
          fitToPage: true,
          fitToWidth: 1,
          orientation: 'landscape'
        }
      });

      // Define columns
      worksheet.columns = [
        { header: l('Foto', 'Фото'), key: 'image', width: 12 },
        { header: l('Denumire', 'Название'), key: 'name_ro', width: 30 },
        { header: 'SKU', key: 'sku', width: 12 },
        { header: l('Brand', 'Бренд'), key: 'brand', width: 15 },
        { header: l('Categorie', 'Категория'), key: 'category', width: 18 },
        { header: l('Subcategorie', 'Подкатегория'), key: 'subcategory', width: 18 },
        { header: l('Preț (MDL)', 'Цена (MDL)'), key: 'price', width: 12 },
        { header: l('Preț promo', 'Акц. цена'), key: 'sale_price', width: 12 },
        { header: l('Stoc', 'Остаток'), key: 'qty', width: 8 },
        { header: l('Status', 'Статус'), key: 'active', width: 10 },
      ];

      // Style header row
      const headerRow = worksheet.getRow(1);
      headerRow.height = 30;
      headerRow.font = { 
        bold: true, 
        color: { argb: 'FFFFFFFF' },
        size: 11
      };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF000000' }
      };
      headerRow.alignment = { 
        vertical: 'middle', 
        horizontal: 'center' 
      };

      // Helper function to convert image URL to base64
      const getImageBuffer = async (url: string): Promise<ArrayBuffer | null> => {
        try {
          const response = await fetch(url, { 
            mode: 'cors',
            credentials: 'omit'
          });
          if (!response.ok) {
            console.warn('Failed to fetch image:', url);
            return null;
          }
          const blob = await response.blob();
          return await blob.arrayBuffer();
        } catch (error) {
          console.warn('Error fetching image:', url, error);
          return null;
        }
      };

      // Add data rows with images
      for (let i = 0; i < dataToExport.length; i++) {
        const product = dataToExport[i];
        const rowIndex = i + 2;

        // Add row data
        const row = worksheet.addRow({
          image: '',
          name_ro: product.name_ro || '-',
          sku: product.sku || '-',
          brand: product.brand || '-',
          category: catLabel(categories, product.category),
          subcategory: product.subcategory ? subcatLabel(categories, product.category, product.subcategory) : '-',
          price: product.price || 0,
          sale_price: product.sale_price || '-',
          qty: product.qty || 0,
          active: product.active ? l('Activ', 'Активен') : l('Inactiv', 'Неактивен'),
        });

        // Set row height for images
        row.height = 70;

        // Style cells
        row.alignment = { vertical: 'middle', horizontal: 'left' };

        // Price formatting
        const priceCell = row.getCell('price');
        priceCell.numFmt = '#,##0.00" MDL"';
        priceCell.alignment = { vertical: 'middle', horizontal: 'right' };
        priceCell.font = { bold: true };

        // Sale price formatting (red if exists)
        const salePriceCell = row.getCell('sale_price');
        if (product.sale_price) {
          salePriceCell.numFmt = '#,##0.00" MDL"';
          salePriceCell.font = { bold: true, color: { argb: 'FFDC2626' } };
          salePriceCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFEF2F2' }
          };
        }
        salePriceCell.alignment = { vertical: 'middle', horizontal: 'right' };

        // Stock formatting (red if 0, orange if <5)
        const qtyCell = row.getCell('qty');
        const qty = product.qty ?? 0;
        qtyCell.alignment = { vertical: 'middle', horizontal: 'center' };
        qtyCell.font = { bold: true };
        if (qty === 0) {
          qtyCell.font.color = { argb: 'FFDC2626' };
          qtyCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFEF2F2' }
          };
        } else if (qty < 5) {
          qtyCell.font.color = { argb: 'FFF59E0B' };
          qtyCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFBEB' }
          };
        }

        // Status formatting
        const statusCell = row.getCell('active');
        statusCell.alignment = { vertical: 'middle', horizontal: 'center' };
        statusCell.font = { bold: true };
        if (product.active) {
          statusCell.font.color = { argb: 'FF16A34A' };
          statusCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF0FDF4' }
          };
        } else {
          statusCell.font.color = { argb: 'FF9CA3AF' };
          statusCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF9FAFB' }
          };
        }

        // Add borders to all cells
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
            right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
          };
        });

        // Zebra striping
        if (i % 2 === 1) {
          row.eachCell((cell, colNumber) => {
            if (colNumber > 1) {
              const currentFill = cell.fill;
              if (!currentFill || (currentFill as ExcelJS.FillPattern).type !== 'pattern') {
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FFF9FAFB' }
                };
              }
            }
          });
        }

        // Add product image
        const imageUrl = product.image_url || (product.images && product.images[0]);
        if (imageUrl) {
          try {
            const imageBuffer = await getImageBuffer(imageUrl);

            if (imageBuffer) {
              const isJpeg = imageUrl.toLowerCase().includes('.jpg') || imageUrl.toLowerCase().includes('.jpeg');
              const extension = isJpeg ? 'jpeg' : 'png';

              const imageId = workbook.addImage({
                buffer: imageBuffer,
                extension: extension,
              });

              worksheet.addImage(imageId, {
                tl: { col: 0.1, row: rowIndex - 1 + 0.1 } as any,
                br: { col: 0.9, row: rowIndex - 0.1 } as any,
                editAs: 'oneCell'
              });
            }
          } catch (err) {
            console.warn(`Failed to add image for product ${product.id}:`, err);
          }
        }

        if (i % 10 === 0) {
          console.log(`Processed ${i + 1}/${dataToExport.length} products`);
        }
      }

      // Freeze header row
      worksheet.views = [
        { state: 'frozen', xSplit: 0, ySplit: 1 }
      ];

      // Generate file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });

      const categoryName = catFilter 
        ? categories.find(c => c.id === catFilter)?.name.ro.replace(/\s+/g, '-') || 'Selectate' 
        : 'Toate';
      const fileName = `${lang === 'ru' ? 'Каталог_Sporto' : 'Catalog_Sporto'}_${categoryName}_${new Date().toISOString().split('T')[0]}.xlsx`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);

      showToast(l(`✓ Exportat ${dataToExport.length} produse în Excel cu imagini!`, `✓ Экспортировано ${dataToExport.length} товаров в Excel с изображениями!`));
    } catch (error) {
      console.error('Export error:', error);
      showToast(l('Eroare la exportul în Excel', 'Ошибка экспорта в Excel'), false);
    }
    setExporting(false);
  };

  const openNew = () => {
    setEditId(null);
    setForm({ ...EMPTY_FORM, id: generateProductId() });
    setGallery([]);
    setAttributeValues({});
    setAttributeTextValues({});
    setPanelOpen(true);
  };

  const openEdit = async (row: ProductRow) => {
    setEditId(row.id);
    setForm({ ...row });
    // Populate gallery from images[] or fall back to image_url
    const imgs = row.images?.length ? row.images : (row.image_url ? [row.image_url] : []);
    setGallery(imgs);
    const { data, error: attributeValuesError } = await supabase.from('product_attribute_values').select('*').eq('product_id', row.id);
    if (attributeValuesError) {
      showToast(
        `${l('Caracteristicile produsului nu au putut fi încărcate', 'Не удалось загрузить характеристики товара')}: ${attributeValuesError.message}`,
        false,
      );
    }
    const values = ((data as ProductAttributeValue[] | null) ?? []).reduce<Record<string, string | boolean>>((result, value) => {
      result[value.attribute_id] = value.numeric_value != null
        ? String(value.numeric_value)
        : value.boolean_value != null
        ? value.boolean_value
        : (value.text_value ?? '');
      return result;
    }, {});
    const textValues = ((data as ProductAttributeValue[] | null) ?? []).reduce<Record<string, { ro: string; ru: string }>>((result, value) => {
      if (value.text_value_ro != null || value.text_value_ru != null) {
        result[value.attribute_id] = {
          ro: value.text_value_ro ?? value.text_value ?? '',
          ru: value.text_value_ru ?? value.text_value ?? '',
        };
      }
      return result;
    }, {});
    setAttributeValues(values);
    setAttributeTextValues(textValues);
    setPanelOpen(true);
  };

  // Links from a conflict open a separate tab, keeping the current draft intact.
  useEffect(() => {
    if (!linkedProductId) return;
    let current = true;
    void (async () => {
      const { data, error } = await supabase.from('products').select('*').eq('id', linkedProductId).maybeSingle();
      if (!current) return;
      if (error || !data) {
        showToast(l('Produsul nu a putut fi deschis.', 'Не удалось открыть карточку товара.'), false);
        return;
      }
      await openEdit(data as ProductRow);
    })().catch(() => {
      if (current) showToast(l('Produsul nu a putut fi deschis.', 'Не удалось открыть карточку товара.'), false);
    });
    return () => { current = false; };
  }, [linkedProductId]);

  const closePanel = () => {
    setPanelOpen(false);
    setEditId(null);
    setForm(EMPTY_FORM);
    setGallery([]);
    setAttributeValues({});
    setAttributeTextValues({});
  };

  const saveAttributeValues = async (productId: string) => {
    if (categoryAttributes.length === 0) return;
    const filled = categoryAttributes.flatMap<Pick<ProductAttributeValue, 'product_id' | 'attribute_id'> & Partial<ProductAttributeValue>>((attribute) => {
      const value = attributeValues[attribute.id];
      const localizedText = attributeTextValues[attribute.id] ?? { ro: '', ru: '' };
      if (attribute.value_type === 'text' && !localizedText.ro.trim() && !localizedText.ru.trim()) return [];
      if (attribute.value_type !== 'text' && (value === '' || value == null)) return [];
      const base = {
        product_id: productId,
        attribute_id: attribute.id,
      };
      if (attribute.value_type === 'text') {
        return [{
          ...base,
          text_value_ro: localizedText.ro.trim() || null,
          text_value_ru: localizedText.ru.trim() || null,
        }];
      }
      return [{
        ...base,
        numeric_value: attribute.value_type === 'number' ? Number(value) : null,
        text_value: attribute.value_type === 'select' ? String(value).trim() : null,
        boolean_value: attribute.value_type === 'boolean' ? Boolean(value) : null,
      }];
    });

    for (const value of filled) {
      const { error } = await supabase
        .from('product_attribute_values')
        .upsert(value, { onConflict: 'product_id,attribute_id' });
      if (error) throw error;
    }

    const filledIds = new Set(filled.map((value) => value.attribute_id));
    const clearedIds = categoryAttributes
      .map((attribute) => attribute.id)
      .filter((attributeId) => !filledIds.has(attributeId));
    if (clearedIds.length > 0) {
      const { error } = await supabase
        .from('product_attribute_values')
        .delete()
        .eq('product_id', productId)
        .in('attribute_id', clearedIds);
      if (error) throw error;
    }
  };

  const handleFileUpload = async (file: File, slot: number) => {
    if (!file.type.startsWith('image/')) { showToast(l('Selectați un fișier imagine', 'Выберите файл изображения'), false); return; }
    if (file.size > 5 * 1024 * 1024) { showToast(l('Imaginea trebuie să fie mai mică de 5 MB', 'Изображение должно быть меньше 5 MB'), false); return; }

    setUploadingSlot(slot);
    const ext = file.name.split('.').pop();
    const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(path, file, { cacheControl: '31536000', upsert: false });

    if (error) {
      setUploadingSlot(null);
      if (error.message.includes('Bucket not found') || error.message.includes('bucket')) {
        setStorageNote(true);
        showToast(l('Bucket "product-images" nu există.', 'Bucket "product-images" не существует.'), false);
      } else {
        showToast(error.message, false);
      }
      return;
    }

    const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(data.path);
    const url = urlData.publicUrl;

    setGallery(prev => {
      const next = [...prev];
      next[slot] = url;
      return next;
    });
    setUploadingSlot(null);
    showToast(slot === 0
      ? l('Imaginea principală a fost încărcată!', 'Главное изображение загружено!')
      : l(`Imaginea ${slot + 1} a fost încărcată!`, `Изображение ${slot + 1} загружено!`));
  };

  const removeGalleryImage = (slot: number) => {
    setGallery(prev => {
      const next = [...prev];
      next.splice(slot, 1);
      return next;
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file, uploadSlotRef.current);
  };

  const handleSave = async () => {
    if (saveInFlight.current) return;
    if (!form.name_ro?.trim()) { showToast(l('Introduceți numele produsului', 'Введите название товара'), false); return; }
    if (!form.category) { showToast(l('Selectați categoria', 'Выберите категорию'), false); return; }

    saveInFlight.current = true;
    setSaving(true);
    try {
    try {
      await checkProductSkus(supabase, [{ id: editId || undefined, sku: form.sku }]);
    } catch (error) {
      showToast(productSkuError(error, l('ro', 'ru') as 'ro' | 'ru'), false);
      setSaving(false);
      return;
    }
    const cleanGallery = gallery.filter(Boolean);
    const payload: Partial<ProductRow> = {
      name_ro: form.name_ro?.trim(),
      name_ru: form.name_ru?.trim() || form.name_ro?.trim(),
      description_ro: form.description_ro?.trim() || null,
      description_ru: form.description_ru?.trim() || null,
      seo_description_ro: form.seo_description_ro?.trim() || null,
      seo_description_ru: form.seo_description_ru?.trim() || null,
      seo_keywords_ro: form.seo_keywords_ro?.trim() || null,
      seo_keywords_ru: form.seo_keywords_ru?.trim() || null,
      category: form.category,
      subcategory: form.subcategory || null,
      price: Number(form.price) || 0,
      sale_price: form.sale_price ? Number(form.sale_price) : null,
      sku: form.sku?.trim() || null,
      brand: form.brand?.trim() || null,
      unit: form.unit || 'BUC.',
      qty: Number(form.qty) || 0,
      image_url: cleanGallery[0] || null,   // first image = main
      images: cleanGallery,                  // full gallery
      youtube_url: form.youtube_url?.trim() || null,
      active: form.active ?? true,
      featured: form.featured ?? false,
      has_warranty: form.has_warranty ?? false,
    };

    if (editId) {
      // Update
      const { error } = await supabase.from('products').update(payload).eq('id', editId);
      if (error) { showToast(productSkuError(error, l('ro', 'ru') as 'ro' | 'ru'), false); }
      else {
        try {
          await saveAttributeValues(editId);
        } catch (attributeError) {
          showToast(
            `${l('Produsul a fost salvat, dar caracteristicile nu au fost salvate', 'Товар сохранён, но характеристики не сохранились')}: ${
              formatSupabaseError(attributeError)
            }`,
            false,
          );
          setSaving(false);
          return;
        }
        invalidateProductCaches();
        await load();
        showToast('Produsul a fost actualizat!');
        closePanel();
      }
    } else {
      // Insert
      const insertPayload: ProductRow = {
        id: form.id || generateProductId(),
        name_ro: payload.name_ro || '',
        name_ru: payload.name_ru || null,
        sku: payload.sku || null,
        brand: payload.brand || null,
        category: payload.category || '',
        subcategory: payload.subcategory || null,
        price: payload.price || 0,
        sale_price: payload.sale_price || null,
        unit: payload.unit || null,
        qty: payload.qty || 0,
        description_ro: payload.description_ro || null,
        description_ru: payload.description_ru || null,
        seo_description_ro: payload.seo_description_ro || null,
        seo_description_ru: payload.seo_description_ru || null,
        seo_keywords_ro: payload.seo_keywords_ro || null,
        seo_keywords_ru: payload.seo_keywords_ru || null,
        image_url: payload.image_url || null,
        images: payload.images || [],
        youtube_url: payload.youtube_url || null,
        has_warranty: payload.has_warranty ?? false,
        featured: payload.featured ?? false,
        active: payload.active ?? true,
      };
      const { data, error } = await supabase.from('products').insert(insertPayload).select().single();
      if (error) { showToast(productSkuError(error, l('ro', 'ru') as 'ro' | 'ru'), false); }
      else {
        // The product exists even if saving attributes or refreshing the list fails.
        // A retry must update this ID, never insert another product.
        setEditId(data.id);
        setForm(current => ({ ...current, id: data.id }));
        try {
          await saveAttributeValues(data.id);
        } catch (attributeError) {
          showToast(
            `${l('Produsul a fost creat, dar caracteristicile nu au fost salvate', 'Товар создан, но характеристики не сохранились')}: ${
              formatSupabaseError(attributeError)
            }`,
            false,
          );
          setSaving(false);
          return;
        }
        invalidateProductCaches();
        setPage(1);
        await load();
        showToast(l('Produs nou adăugat!', 'Новый товар добавлен!'));
        closePanel();
      }
    }
    } catch (error) {
      showToast(productSkuError(error, lang), false);
    } finally {
      saveInFlight.current = false;
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editId) return;
    if (!confirm(l('Ești sigur? Produsul va fi șters definitiv.', 'Вы уверены? Товар будет удалён навсегда.'))) return;
    setDeleting(true);
    const { error } = await supabase.from('products').delete().eq('id', editId);
    if (error) { showToast(productSkuError(error, l('ro', 'ru') as 'ro' | 'ru'), false); }
    else {
      invalidateProductCaches();
      await load();
      showToast(l('Produs șters.', 'Товар удалён.'));
      closePanel();
    }
    setDeleting(false);
  };

  const handleLogout = async () => {
    await logoutAdmin();
    navigate('/admin/login', { replace: true });
  };

  const toggleActive = async (row: ProductRow, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !row.active;
    const { error } = await supabase.from('products').update({ active: next }).eq('id', row.id);
    if (!error) {
      invalidateProductCaches();
      await load();
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(true); }
  };

  const SortArrow = ({ k }: { k: SortKey }) =>
    sortKey === k ? <span className="ml-0.5">{sortAsc ? '↑' : '↓'}</span> : null;

  const selectedCatSubs = categories.find(c => c.id === form.category)?.subcategories ?? [];
  const allCategoryOptions = useMemo(
    () => categories.map((c) => ({ value: c.id, label: c.name[lang] })),
    [categories, lang]
  );
  const allSubcategoryOptions = useMemo(
    () => categories.flatMap((category) =>
      category.subcategories.map((subcategory) => ({
        value: subcategory.id,
        label: subcategory.name[lang],
        categoryId: category.id,
      }))
    ),
    [categories, lang]
  );

  const createCategory = async (name: string): Promise<string | null> => {
    const baseSlug = toSlug(name);
    const slug = baseSlug || `category-${Date.now()}`;
    const exists = categories.some(c => c.id === slug);
    if (exists) {
      return slug;
    }

    const { error } = await supabase.from('categories').insert([{
      slug,
      name_ro: name.trim(),
      name_ru: name.trim(),
      description_ro: null,
      description_ru: null,
      sort_order: categories.length,
    }]);

    if (error) {
      showToast(error.message, false);
      return null;
    }

    await refetchCategories();
    showToast(l('Categorie nouă creată', 'Новая категория создана'));
    return slug;
  };

  const createSubcategory = async (name: string): Promise<string | null> => {
    if (!form.category) {
      showToast(l('Selectați mai întâi categoria', 'Сначала выберите категорию'), false);
      return null;
    }

    const baseSlug = toSlug(name);
    const slug = baseSlug || `subcategory-${Date.now()}`;
    const exists = selectedCatSubs.some(s => s.id === slug);
    if (exists) {
      return slug;
    }

    const { error } = await supabase.from('subcategories').insert([{
      category_slug: form.category,
      slug,
      name_ro: name.trim(),
      name_ru: name.trim(),
      sort_order: selectedCatSubs.length,
    }]);

    if (error) {
      showToast(error.message, false);
      return null;
    }

    await refetchCategories();
    showToast(l('Subcategoria a fost creată', 'Подкатегория создана'));
    return slug;
  };

  const allProductBrands = useMemo(() =>
    [...new Set(rows.map(r => r.brand).filter(Boolean) as string[])],
    [rows]
  );

  const { brands: supabaseBrands } = useSupabaseBrands();
  const supabaseBrandNames = useMemo(
    () => supabaseBrands.map(b => b.name),
    [supabaseBrands]
  );

  return (
    <div className="min-h-screen admin-canvas flex flex-col">

      <div className="admin-page-toolbar admin-surface border-b admin-border sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap sm:flex-nowrap items-center min-h-12 py-2 sm:py-0 gap-3 sm:gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <Package className="w-4 h-4 admin-muted" />
              <span className="text-sm admin-ink truncate">{t.products.title}</span>
              <span className="text-xs admin-muted-surface admin-muted px-2 py-0.5 tabular-nums flex-shrink-0">{totalCount}</span>
            </div>
            <div className="w-full sm:w-auto sm:ml-auto flex items-center justify-between sm:justify-end gap-2">
              <button onClick={load} disabled={loading} className="flex items-center gap-1.5 text-xs admin-muted admin-hover-ink transition-colors flex-shrink-0">
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{t.common.refresh}</span>
              </button>
              <button
                onClick={handleExportExcel}
                disabled={exporting || totalCount === 0}
                className="flex items-center justify-center gap-2 border admin-border admin-ink admin-hover-border admin-hover-ink px-3 sm:px-4 py-2 text-xs sm:text-xs   sm:tracking-wider transition-colors disabled:opacity-40 min-w-0"
              >
                {exporting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span className="truncate">{l('Export...', 'Экспорт...')}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{l('Exportă Excel', 'Экспорт Excel')}</span>
                    <span className="sm:hidden">{l('Excel', 'Excel')}</span>
                  </>
                )}
              </button>
              <button
                onClick={openNew}
                className="flex items-center justify-center gap-2 admin-solid admin-on-solid px-3 sm:px-4 py-2 text-xs sm:text-xs   sm:tracking-wider admin-hover-solid transition-colors min-w-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.products.newBtn}</span>
                <span className="sm:hidden">{l('Nou', 'Новый')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-page-body max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 flex-1">

        <button type="button" className="admin-filter-toggle" aria-expanded={filtersExpanded} aria-controls="admin-product-filters" onClick={() => setFiltersExpanded(value => !value)}>
          {lang === 'ru' ? (filtersExpanded ? 'Скрыть фильтры' : 'Показать фильтры') : (filtersExpanded ? 'Ascunde filtrele' : 'Arată filtrele')}
        </button>
        <div id="admin-product-filters" data-expanded={filtersExpanded} className="admin-product-filters grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[minmax(180px,1.2fr)_repeat(4,minmax(100px,1fr))_auto] gap-2 mb-4">
          <div className="relative min-w-0 sm:col-span-2 xl:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 admin-muted" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder={l('Caută după SKU sau cod...', 'Поиск по SKU или коду...')}
              className="w-full h-9 pl-9 pr-8 text-xs border admin-border admin-surface admin-placeholder focus:outline-none admin-focus-border transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 admin-muted admin-hover-ink">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="relative min-w-0">
            <select
              value={catFilter}
              onChange={e => {
                setCatFilter(e.target.value);
                setSubcatFilter('');
              }}
              className="w-full h-9 px-3 text-xs border admin-border admin-surface admin-ink focus:outline-none admin-focus-border transition-colors"
            >
              <option value="">{l('Toate categoriile', 'Все категории')}</option>
              {allCategoryOptions.map((category) => (
                <option key={category.value} value={category.value}>{category.label}</option>
              ))}
            </select>
          </div>

          <div className="relative min-w-0">
            <input
              type="text"
              list="admin-products-brand-filter"
              value={brandFilter}
              onChange={e => setBrandFilter(e.target.value)}
              placeholder={l('Brand...', 'Бренд...')}
              className="w-full h-9 px-3 pr-8 text-xs border admin-border admin-surface admin-ink admin-placeholder focus:outline-none admin-focus-border transition-colors"
            />
            {brandFilter && (
              <button onClick={() => setBrandFilter('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 admin-muted admin-hover-ink">
                <X className="w-3 h-3" />
              </button>
            )}
            <datalist id="admin-products-brand-filter">
              {[...supabaseBrandNames, ...allProductBrands.filter((brand) => !supabaseBrandNames.includes(brand))]
                .sort((a, b) => a.localeCompare(b))
                .map((brand) => (
                  <option key={brand} value={brand} />
                ))}
            </datalist>
          </div>

          <div className="relative min-w-0">
            <select
              value={subcatFilter}
              onChange={e => setSubcatFilter(e.target.value)}
              className="w-full h-9 px-3 text-xs border admin-border admin-surface admin-ink focus:outline-none admin-focus-border transition-colors"
            >
              <option value="">{l('Toate subcategoriile', 'Все подкатегории')}</option>
              {allSubcategoryOptions
                .filter((subcategory) => !catFilter.trim() || subcategory.categoryId === catFilter.trim())
                .map((subcategory) => (
                  <option key={`${subcategory.categoryId}-${subcategory.value}`} value={subcategory.value}>{subcategory.label}</option>
                ))}
            </select>
          </div>

          <div className="flex border admin-border admin-surface min-w-0">
            {(['all', 'active', 'inactive'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`flex-1 px-2 sm:px-3 h-9 text-[11px] sm:text-xs transition-colors border-r last:border-0 admin-border whitespace-nowrap ${
                  statusFilter === s ? 'admin-solid admin-on-solid' : 'admin-muted admin-hover-ink'
                }`}
              >
                {s === 'all' ? l('Toate', 'Все') : s === 'active' ? l('Active', 'Активные') : l('Inactive', 'Неактивные')}
              </button>
            ))}
          </div>

          <div className="text-xs admin-muted flex items-center justify-end xl:justify-start">
            {rows.length} {l('din', 'из')} {totalCount}
          </div>
        </div>

        <div className="admin-surface border admin-border overflow-hidden">

          <div className="admin-product-table-head hidden lg:grid grid-cols-[44px_minmax(160px,2fr)_minmax(90px,1fr)_80px_55px_50px_50px_24px] gap-3 px-4 py-2.5 border-b admin-border admin-canvas text-xs   admin-muted">
            <div />
            <button onClick={() => toggleSort('name_ro')} className="text-left admin-hover-ink transition-colors flex items-center">{t.products.colProduct} <SortArrow k="name_ro" /></button>
            <div>{t.products.colCategory}</div>
            <button onClick={() => toggleSort('price')} className="text-right admin-hover-ink transition-colors flex items-center justify-end">{t.products.colPrice} <SortArrow k="price" /></button>
            <button onClick={() => toggleSort('qty')} className="text-center admin-hover-ink transition-colors flex items-center justify-center">{t.products.colStock} <SortArrow k="qty" /></button>
            <div className="text-center">{t.products.colActive}</div>
            <div className="text-center">{t.products.colFeatured}</div>
            <div />
          </div>

          {loading ? (
            <div className="divide-y divide-gray-50">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3 animate-pulse">
                  <div className="w-10 h-10 admin-muted-surface flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 admin-muted-surface w-1/3" />
                    <div className="h-2.5 admin-canvas w-1/5" />
                  </div>
                  <div className="h-3 w-20 admin-muted-surface" />
                  <div className="h-3 w-16 admin-muted-surface" />
                </div>
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="py-20 text-center">
              <Package className="w-8 h-8 text-gray-200 mx-auto mb-3" />
              <p className="text-sm admin-muted">{t.products.noData}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {rows.map(row => (
                <div
                  key={row.id}
                  onClick={() => openEdit(row)}
                  className="grid grid-cols-[48px_minmax(0,1fr)] lg:grid-cols-[44px_minmax(160px,2fr)_minmax(90px,1fr)_80px_55px_50px_50px_24px] gap-x-3 gap-y-2 items-start lg:items-center px-3 sm:px-4 py-2 cursor-pointer hover:bg-gray-50/70 transition-colors group"
                >

                  <div className="w-12 h-12 lg:w-10 lg:h-10 admin-muted-surface flex-shrink-0 overflow-hidden">
                    {row.image_url
                      ? <img src={row.image_url} alt="" className="w-full h-full object-cover" />
                      : <Package className="w-4 h-4 admin-muted m-4 lg:m-3" />
                    }
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      {!row.active && <span className="w-1.5 h-1.5 bg-gray-300 rounded-full flex-shrink-0" />}
                      {row.featured && <Star className="w-3 h-3 admin-muted fill-gray-200 flex-shrink-0" />}
                      <span className="text-xs admin-ink truncate group-hover:text-black">{row.name_ro}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                      {row.sku && <span className="text-xs admin-muted font-mono break-all">{row.sku}</span>}
                      {row.brand && <span className="text-xs admin-muted truncate">{row.brand}</span>}
                    </div>
                    <div className="lg:hidden flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                      <span className="text-xs admin-muted truncate max-w-full">{catLabel(categories, row.category)}</span>
                      <span className="text-xs admin-ink font-mono">{Number(row.price).toLocaleString()} MDL</span>
                      <span className={`text-xs font-mono ${
                        Number(row.qty) === 0 ? 'text-red-400' : Number(row.qty) < 5 ? 'text-amber-500' : 'admin-ink'
                      }`}>
                        {l('Stoc', 'Сток')}: {row.qty ?? '—'}
                      </span>
                    </div>
                    <div className="lg:hidden flex items-center gap-3 mt-2">
                      <button
                        onClick={e => toggleActive(row, e)}
                        className={`w-8 h-5 rounded-full transition-colors flex items-center ${row.active ? 'admin-solid' : 'admin-muted-surface'}`}
                        aria-label={row.active ? l('Dezactivează', 'Деактивировать') : l('Activează', 'Активировать')}
                      >
                        <span className={`w-3.5 h-3.5 admin-surface rounded-full shadow transition-transform mx-0.5 ${row.active ? 'translate-x-3' : 'translate-x-0'}`} />
                      </button>
                      <span className="text-xs admin-muted">
                        {row.active ? l('Activ', 'Активен') : l('Inactiv', 'Неактивен')}
                      </span>
                    </div>
                  </div>

                  <div className="hidden lg:block text-xs admin-muted truncate">{catLabel(categories, row.category)}</div>

                  <div className="hidden lg:block text-xs admin-ink text-right tabular-nums font-mono">
                    {Number(row.price).toLocaleString()}
                  </div>

                  <div className={`hidden lg:block text-xs text-center tabular-nums font-mono ${
                    Number(row.qty) === 0 ? 'text-red-400' : Number(row.qty) < 5 ? 'text-amber-500' : 'admin-ink'
                  }`}>
                    {row.qty ?? '—'}
                  </div>

                  <div className="hidden lg:flex justify-center">
                    <button
                      onClick={e => toggleActive(row, e)}
                      className={`w-8 h-5 rounded-full transition-colors flex items-center ${row.active ? 'admin-solid' : 'admin-muted-surface'}`}
                    >
                      <span className={`w-3.5 h-3.5 admin-surface rounded-full shadow transition-transform mx-0.5 ${row.active ? 'translate-x-3' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="hidden lg:flex justify-center">
                    {row.featured && <Star className="w-3.5 h-3.5 admin-muted fill-gray-200" />}
                  </div>

                  <div className="hidden lg:flex justify-center text-gray-200 group-hover:text-gray-500 transition-colors">
                    <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {totalCount > PAGE_SIZE && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 gap-3 text-xs admin-muted">
            <span>
              {lang === 'ro'
                ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, totalCount)} din ${totalCount}`
                : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, totalCount)} из ${totalCount}`}
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1 || loading}
                className="flex-1 sm:flex-none px-3 h-8 border admin-border admin-muted admin-hover-border admin-hover-ink transition-colors disabled:opacity-30"
              >
                {l('Înapoi', 'Назад')}
              </button>
              <span className="tabular-nums admin-muted min-w-[56px] text-center">
                {page} / {Math.max(1, Math.ceil(totalCount / PAGE_SIZE))}
              </span>
              <button
                onClick={() => setPage((current) => current + 1)}
                disabled={page >= Math.ceil(totalCount / PAGE_SIZE) || loading}
                className="flex-1 sm:flex-none px-3 h-8 border admin-border admin-muted admin-hover-border admin-hover-ink transition-colors disabled:opacity-30"
              >
                {l('Înainte', 'Дальше')}
              </button>
            </div>
          </div>
        )}
      </div>

      {panelOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 backdrop-blur-[1px]"
          onClick={closePanel}
        />
      )}

      <div className={`fixed top-0 right-0 h-full w-full sm:w-[560px] admin-surface shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${panelOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        <div className="flex items-start sm:items-center justify-between px-4 sm:px-6 py-4 border-b admin-border flex-shrink-0 gap-3">
          <div className="min-w-0">
            <h2 className="text-sm admin-ink">
              {editId ? t.products.editTitle : t.products.newTitle}
            </h2>
            {editId && <p className="text-xs admin-muted font-mono mt-0.5">#{editId}</p>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {editId && (
              <a
                href={buildProductPath({
                  id: editId,
                  name: {
                    ro: form.name_ro || editId,
                    ru: form.name_ru || form.name_ro || editId,
                  },
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs admin-muted admin-hover-ink transition-colors px-2 py-1.5 border admin-border hover:border-gray-300"
              >
                <ExternalLink className="w-3 h-3" />
                <span className="hidden sm:inline">{t.products.pageProduct}</span>
              </a>
            )}
            <button onClick={closePanel} className="w-8 h-8 flex items-center justify-center admin-muted admin-hover-ink transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs   admin-muted">
                  {l('Imagini', 'Изображения')} <span className="admin-muted normal-case tracking-normal">({l('max 4 · prima = principală', 'макс 4 · первое = главное')})</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 4 }).map((_, slot) => {
                  const url = gallery[slot];
                  const isUploading = uploadingSlot === slot;

                  const handleSlotPaste = (e: React.ClipboardEvent) => {
                    const imgItem = Array.from(e.clipboardData?.items || []).find(i => i.type.startsWith('image/'));
                    if (imgItem) {
                      const file = imgItem.getAsFile();
                      if (file) handleFileUpload(file, slot);
                    }
                  };

                  return (
                    <div
                      key={slot}
                      className="relative aspect-square outline-none"
                      tabIndex={0}
                      onPaste={handleSlotPaste}
                    >
                      {url ? (
                        // Filled slot
                        <div className="relative w-full h-full border admin-border overflow-hidden group">
                          <img src={url} alt="" className="w-full h-full object-contain admin-canvas" />

                          {slot === 0 && (
                            <span className="absolute top-1.5 left-1.5 text-xs   admin-solid admin-on-solid px-1.5 py-0.5">
                              {l('Principală', 'Главное')}
                            </span>
                          )}

                          <span className="absolute bottom-1.5 right-1.5 text-xs bg-black/50 admin-on-solid px-1.5 py-0.5 opacity-0 group-focus:opacity-100 transition-opacity pointer-events-none">
                            Ctrl+V
                          </span>

                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() => { uploadSlotRef.current = slot; fileInputRef.current?.click(); }}
                              className="w-7 h-7 bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                              title={l('Înlocuiește', 'Заменить')}
                            >
                              <ImageIcon className="w-3.5 h-3.5 admin-ink" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeGalleryImage(slot)}
                              className="w-7 h-7 bg-white/90 flex items-center justify-center hover:bg-red-50 transition-colors"
                              title={l('Elimină', 'Удалить')}
                            >
                              <X className="w-3.5 h-3.5 text-red-500" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Empty slot
                        <button
                          type="button"
                          disabled={isUploading}
                          onClick={() => {
                            uploadSlotRef.current = slot;
                            fileInputRef.current?.click();
                          }}
                          className={`w-full h-full border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors ${
                            isUploading
                              ? 'admin-border admin-canvas'
                              : 'admin-border admin-hover-border hover:bg-gray-50/50 cursor-pointer'
                          }`}
                        >
                          {isUploading ? (
                            <RefreshCw className="w-5 h-5 admin-muted animate-spin" />
                          ) : (
                            <>
                              <Plus className="w-4 h-4 admin-muted" />
                              <span className="text-xs admin-muted">
                                {slot === 0 ? l('Principală', 'Главное') : l(`Foto ${slot + 1}`, `Фото ${slot + 1}`)}
                              </span>
                              <span className="text-xs admin-muted mt-0.5">
                                {l('sau Ctrl+V', 'или Ctrl+V')}
                              </span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <input
                ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) handleFileUpload(f, uploadSlotRef.current);
                  e.target.value = '';
                }}
              />

              {storageNote && (
                <div className="mt-3 bg-amber-50 border border-amber-200 p-3 flex gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-700 leading-relaxed">
                    <strong>{l('Creați bucket-ul în Supabase:', 'Создайте bucket в Supabase:')}</strong><br />
                    Supabase Dashboard → Storage → New bucket<br />
                    Name: <code className="bg-amber-100 px-1">product-images</code> · Public: <strong>ON</strong><br />
                    {l('Apoi adăugați policy: ', 'Затем добавьте policy: ')}<code className="bg-amber-100 px-1">allow all operations for anon</code>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs   admin-muted mb-1.5 block">
                  {t.products.nameRoLabel} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text" value={form.name_ro ?? ''}
                  onChange={e => setForm(f => ({ ...f, name_ro: e.target.value }))}
                  className="w-full h-9 px-3 text-xs border admin-border admin-surface focus:outline-none admin-focus-border transition-colors"
                  placeholder={t.products.namePlaceholder}
                />
              </div>
              <div className="col-span-1 sm:col-span-2">
                <label className="text-xs   admin-muted mb-1.5 block">{t.products.nameRuLabel}</label>
                <input
                  type="text" value={form.name_ru ?? ''}
                  onChange={e => setForm(f => ({ ...f, name_ru: e.target.value }))}
                  className="w-full h-9 px-3 text-xs border admin-border admin-surface focus:outline-none admin-focus-border transition-colors"
                  placeholder={t.products.nameRuPlaceholder}
                />
              </div>
            </div>

            {similarity.matches.length > 0 && <aside aria-label={l('Produse similare', 'Похожие товары')} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-gray-900">
              <p className="font-medium">{l('Este posibil ca acest produs să existe deja', 'Возможно, этот товар уже существует')}</p>
              <p className="mt-1 text-xs text-gray-600">{l('Comparați modelul, culoarea și dimensiunea. Dacă este un produs diferit, puteți continua salvarea.', 'Сравните модель, цвет и размер. Если это другой вариант товара, можно продолжить сохранение.')}</p>
              <div className="mt-3 space-y-2">
                {similarity.matches.slice(0, 5).map(product => <a key={product.id} href={`/admin/products?product=${encodeURIComponent(product.id)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded border border-amber-100 bg-white p-2 hover:border-amber-400">
                  {product.image_url ? <img src={product.image_url} alt="" loading="lazy" className="h-14 w-14 shrink-0 object-contain" /> : <Package className="h-14 w-14 shrink-0 p-3 text-gray-400" />}
                  <div className="min-w-0"><p className="text-xs font-medium break-words">{lang === 'ru' ? product.name_ru || product.name_ro : product.name_ro || product.name_ru}</p>
                    <p className="mt-1 text-xs text-gray-500">{product.sku || '—'}{product.brand ? ` · ${product.brand}` : ''}{!product.active ? l(' · ascuns', ' · скрыт') : ''}</p>
                    <p className="mt-1 text-xs text-gray-600">{product.reason === 'name' ? l('Denumire identică', 'Совпадает название') : product.reason === 'sku' ? l('SKU similar', 'Похожий артикул') : l('Model sau denumire similară', 'Похожая модель или название')} · {l('Deschide fișa ↗', 'Открыть карточку ↗')}</p>
                  </div>
                </a>)}
              </div>
              {similarity.matches.length > 5 && <p className="mt-2 text-xs">{l('Alte produse similare:', 'Ещё похожих карточек:')} {similarity.matches.length - 5}</p>}
            </aside>}
            {similarity.status === 'error' && <p role="status" className="text-xs admin-muted">{l('Nu s-au putut verifica produsele similare.', 'Не удалось проверить похожие товары.')} <button type="button" onClick={similarity.retry} className="underline">{l('Reîncearcă', 'Повторить')}</button></p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs   admin-muted mb-1.5 block">
                  {t.common.category} <span className="text-red-400">*</span>
                </label>
                <CategoryCombobox
                  value={form.category ?? ''}
                  onChange={(val) => setForm(f => ({ ...f, category: val, subcategory: '' }))}
                  categories={categories}
                  onCreate={createCategory}
                  lang={lang}
                />
              </div>
              <div>
                <label className="text-xs   admin-muted mb-1.5 block">{t.products.subcategory}</label>
                <SubcategoryCombobox
                  value={form.subcategory ?? ''}
                  onChange={(val) => setForm(f => ({ ...f, subcategory: val }))}
                  subcategories={selectedCatSubs}
                  disabled={!form.category}
                  onCreate={createSubcategory}
                  lang={lang}
                />
              </div>
            </div>

            {form.category && categoryAttributes.length > 0 && (
              <div className="border admin-border admin-canvas p-4">
                <div className="mb-3">
                  <p className="text-xs admin-ink">{l('Caracteristici produs', 'Характеристики товара')}</p>
                  <p className="text-xs admin-muted mt-0.5">
                    {l('Aceste valori apar în pagina produsului și în filtrele categoriei.', 'Эти значения появятся на странице товара и в фильтрах категории.')}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categoryAttributes.map((attribute) => (
                    <label key={attribute.id} className={`text-xs   admin-muted ${attribute.value_type === 'text' ? 'sm:col-span-2' : ''}`}>
                      {lang === 'ru' ? attribute.name_ru : attribute.name_ro}
                      {getAttributeUnit(attribute, lang) ? ` (${getAttributeUnit(attribute, lang)})` : ''}
                      {attribute.value_type === 'boolean' ? (
                        <select
                          value={attributeValues[attribute.id] === '' || attributeValues[attribute.id] == null ? '' : String(attributeValues[attribute.id])}
                          onChange={(event) => setAttributeValues((values) => ({
                            ...values,
                            [attribute.id]: event.target.value === '' ? '' : event.target.value === 'true',
                          }))}
                          className="mt-1 w-full h-9 px-3 text-xs border admin-border admin-surface"
                        >
                          <option value="">{l('Nespecificat', 'Не указано')}</option>
                          <option value="true">{l('Da', 'Да')}</option>
                          <option value="false">{l('Nu', 'Нет')}</option>
                        </select>
                      ) : attribute.value_type === 'select' ? (
                        <select
                          value={String(attributeValues[attribute.id] ?? '')}
                          onChange={(event) => setAttributeValues((values) => ({ ...values, [attribute.id]: event.target.value }))}
                          className="mt-1 w-full h-9 px-3 text-xs border admin-border admin-surface"
                        >
                          <option value="">{l('Selectați valoarea', 'Выберите значение')}</option>
                          {(attribute.options ?? []).map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : attribute.value_type === 'text' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                          <textarea
                            value={attributeTextValues[attribute.id]?.ro ?? ''}
                            onChange={(event) => setAttributeTextValues((values) => ({
                              ...values,
                              [attribute.id]: { ro: event.target.value, ru: values[attribute.id]?.ru ?? '' },
                            }))}
                            rows={4}
                            placeholder="Descriere RO"
                            className="w-full px-3 py-2 text-xs normal-case tracking-normal border admin-border admin-surface resize-y focus:outline-none admin-focus-border"
                          />
                          <textarea
                            value={attributeTextValues[attribute.id]?.ru ?? ''}
                            onChange={(event) => setAttributeTextValues((values) => ({
                              ...values,
                              [attribute.id]: { ro: values[attribute.id]?.ro ?? '', ru: event.target.value },
                            }))}
                            rows={4}
                            placeholder="Описание RU"
                            className="w-full px-3 py-2 text-xs normal-case tracking-normal border admin-border admin-surface resize-y focus:outline-none admin-focus-border"
                          />
                        </div>
                      ) : (
                        <input
                          type={attribute.value_type === 'number' ? 'number' : 'text'}
                          step={attribute.value_type === 'number' ? 'any' : undefined}
                          placeholder={
                            attribute.value_type === 'number'
                              ? l('De ex.: 120', 'Например: 120')
                              : attribute.value_type === 'select'
                              ? l('De ex.: Oțel', 'Например: Сталь')
                              : l('De ex.: Motor cu curent alternativ', 'Например: Двигатель переменного тока')
                          }
                          value={String(attributeValues[attribute.id] ?? '')}
                          onChange={(event) => setAttributeValues((values) => ({ ...values, [attribute.id]: event.target.value }))}
                          className="mt-1 w-full h-9 px-3 text-xs border admin-border admin-surface focus:outline-none admin-focus-border"
                        />
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs   admin-muted mb-1.5 block">{t.products.priceMdl}</label>
                <input
                  type="number" min="0" step="0.01" value={form.price ?? 0}
                  onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                  className="w-full h-9 px-3 text-xs border admin-border admin-surface focus:outline-none admin-focus-border transition-colors font-mono"
                />
              </div>
              <div>
                <label className="text-xs   admin-muted mb-1.5 block">{t.products.unit}</label>
                <select
                  value={form.unit ?? 'BUC.'}
                  onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                  className="w-full h-9 px-3 text-xs border admin-border admin-surface focus:outline-none admin-focus-border transition-colors"
                >
                  {['BUC.', 'set', 'pereche', 'kg', 'pcs'].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs   admin-muted mb-1.5 block">
                  {t.products.stockQty}
                </label>
                <input
                  type="number" min="0" step="1" value={form.qty ?? 0}
                  onChange={e => setForm(f => ({ ...f, qty: Number(e.target.value) }))}
                  className={`w-full h-9 px-3 text-xs border admin-surface focus:outline-none admin-focus-border transition-colors font-mono ${
                    Number(form.qty) === 0 ? 'border-red-200 text-red-500' : 'admin-border'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="text-xs   admin-muted mb-1.5 flex items-center gap-2">
                <Tag className="w-3 h-3" />
                {l('Preț promoțional (opțional)', 'Акционная цена (необязательно)')}
              </label>
              <input
                type="number" min="0" step="0.01" 
                value={form.sale_price ?? ''}
                onChange={e => setForm(f => ({ ...f, sale_price: e.target.value ? Number(e.target.value) : null }))}
                placeholder={l('Lasă gol dacă nu e promoție', 'Оставьте пустым, если акции нет')}
                className="w-full h-9 px-3 text-xs border border-red-200 bg-red-50/30 focus:outline-none focus:border-red-500 transition-colors font-mono placeholder:text-gray-400"
              />
              <p className="text-xs admin-muted mt-1">
                {l('Dacă este completat, prețul vechi va fi tăiat și va apărea badge-ul "PROMOȚIE"', 'Если заполнено, старая цена будет зачёркнута и появится бейдж "АКЦИЯ"')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="product-sku" className="text-xs   admin-muted mb-1.5 block">{t.products.sku}</label>
                <input
                  id="product-sku"
                  type="text" value={form.sku ?? ''}
                  aria-describedby="product-sku-status"
                  aria-invalid={skuStatus.status === 'conflict'}
                  onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                  placeholder="17-47-121"
                  className="w-full h-9 px-3 text-xs border admin-border admin-surface focus:outline-none admin-focus-border transition-colors font-mono"
                />
                <div id="product-sku-status" role="status" aria-live="polite" className={`mt-1.5 text-xs ${skuStatus.status === 'conflict' ? 'text-red-600' : 'admin-muted'}`}>
                  {skuStatus.status === 'checking' && l('Se verifică SKU…', 'Проверяем артикул…')}
                  {skuStatus.status === 'available' && l('SKU disponibil.', 'Артикул свободен.')}
                  {skuStatus.status === 'conflict' && l('Acest SKU este deja atribuit. Introduceți alt SKU; datele completate rămân în formular.', 'Этот артикул уже занят. Укажите другой — заполненные данные останутся в форме.')}
                  {skuStatus.status === 'legacy' && l('Acest SKU se repetă în catalog. Puteți salva modificările cu SKU existent sau introduceți un SKU liber.', 'Этот артикул уже повторяется в каталоге. Можно сохранить изменения с прежним артикулом или указать свободный.')}
                  {skuStatus.status === 'error' && l('Nu s-a putut verifica SKU. Va fi verificat din nou la salvare.', 'Не удалось проверить артикул. Повторим проверку при сохранении.')}
                  {skuStatus.matches.map(match => <a key={match.id} href={`/admin/products?product=${encodeURIComponent(match.id)}`} target="_blank" rel="noopener noreferrer" className="mt-1 block underline">
                    {lang === 'ru' ? match.name_ru || match.name_ro : match.name_ro}{!match.active && ` (${l('ascuns', 'скрыт')})`}
                  </a>)}
                </div>
              </div>
              <div>
                <label className="text-xs   admin-muted mb-1.5 block">{t.common.brand}</label>
                <BrandCombobox
                  value={form.brand ?? ''}
                  onChange={val => setForm(f => ({ ...f, brand: val }))}
                  allProductBrands={allProductBrands}
                  supabaseBrandNames={supabaseBrandNames}
                  lang={lang}
                />
              </div>
            </div>

            <div>
              <label className="text-xs   admin-muted mb-1.5 block">{t.products.descRoLabel}</label>
              <textarea
                value={form.description_ro ?? ''}
                onChange={e => setForm(f => ({ ...f, description_ro: e.target.value }))}
                rows={3}
                placeholder={t.products.descRoPlaceholder}
                className="w-full px-3 py-2 text-xs border admin-border admin-surface focus:outline-none admin-focus-border transition-colors resize-none"
              />
            </div>
            <div>
              <label className="text-xs   admin-muted mb-1.5 block">{t.products.descRuLabel}</label>
              <textarea
                value={form.description_ru ?? ''}
                onChange={e => setForm(f => ({ ...f, description_ru: e.target.value }))}
                rows={3}
                placeholder={t.products.descRuPlaceholder}
                className="w-full px-3 py-2 text-xs border admin-border admin-surface focus:outline-none admin-focus-border transition-colors resize-none"
              />
            </div>

            <div>
              <label className="text-xs   admin-muted mb-1.5 block">{t.products.seoDescRoLabel}</label>
              <textarea
                value={form.seo_description_ro ?? ''}
                onChange={e => setForm(f => ({ ...f, seo_description_ro: e.target.value }))}
                rows={2}
                placeholder={t.products.seoDescRoPlaceholder}
                className="w-full px-3 py-2 text-xs border admin-border admin-surface focus:outline-none admin-focus-border transition-colors resize-none"
              />
            </div>
            <div>
              <label className="text-xs   admin-muted mb-1.5 block">{t.products.seoDescRuLabel}</label>
              <textarea
                value={form.seo_description_ru ?? ''}
                onChange={e => setForm(f => ({ ...f, seo_description_ru: e.target.value }))}
                rows={2}
                placeholder={t.products.seoDescRuPlaceholder}
                className="w-full px-3 py-2 text-xs border admin-border admin-surface focus:outline-none admin-focus-border transition-colors resize-none"
              />
            </div>

            <div>
              <label className="text-xs   admin-muted mb-1.5 block">{t.products.seoKeywordsRoLabel}</label>
              <input
                type="text"
                value={form.seo_keywords_ro ?? ''}
                onChange={e => setForm(f => ({ ...f, seo_keywords_ro: e.target.value }))}
                placeholder={t.products.seoKeywordsRoPlaceholder}
                className="w-full h-9 px-3 text-xs border admin-border admin-surface focus:outline-none admin-focus-border transition-colors"
              />
            </div>
            <div>
              <label className="text-xs   admin-muted mb-1.5 block">{t.products.seoKeywordsRuLabel}</label>
              <input
                type="text"
                value={form.seo_keywords_ru ?? ''}
                onChange={e => setForm(f => ({ ...f, seo_keywords_ru: e.target.value }))}
                placeholder={t.products.seoKeywordsRuPlaceholder}
                className="w-full h-9 px-3 text-xs border admin-border admin-surface focus:outline-none admin-focus-border transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
              <label className="flex items-center gap-3 cursor-pointer select-none min-w-0">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, active: !f.active }))}
                  className={`w-10 h-6 rounded-full transition-colors flex items-center ${form.active ? 'admin-solid' : 'admin-muted-surface'}`}
                >
                  <span className={`w-4 h-4 admin-surface rounded-full shadow transition-transform mx-1 ${form.active ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
                <div>
                  <div className="text-xs admin-ink flex items-center gap-1">
                    {form.active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 admin-muted" />}
                    {form.active ? t.products.activeLabel : t.products.inactiveLabel}
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none min-w-0">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, featured: !f.featured }))}
                  className={`w-10 h-6 rounded-full transition-colors flex items-center ${form.featured ? 'admin-solid' : 'admin-muted-surface'}`}
                >
                  <span className={`w-4 h-4 admin-surface rounded-full shadow transition-transform mx-1 ${form.featured ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
                <div className="text-xs admin-ink flex items-center gap-1">
                  <Star className={`w-3 h-3 ${form.featured ? 'fill-gray-400 admin-muted' : 'admin-muted'}`} />
                  {form.featured ? t.products.featuredLabel : t.products.notFeaturedLabel}
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none min-w-0">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, has_warranty: !f.has_warranty }))}
                  className={`w-10 h-6 rounded-full transition-colors flex items-center ${form.has_warranty ? 'admin-solid' : 'admin-muted-surface'}`}
                >
                  <span className={`w-4 h-4 admin-surface rounded-full shadow transition-transform mx-1 ${form.has_warranty ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
                <div className="text-xs admin-ink">
                  {form.has_warranty ? l('Cu garanție', 'С гарантией') : l('Fără garanție', 'Без гарантии')}
                </div>
              </label>
            </div>

            <div>
              <label className="text-xs   admin-muted mb-1.5 block">URL YouTube</label>
              <input
                type="text" value={form.youtube_url ?? ''}
                onChange={e => setForm(f => ({ ...f, youtube_url: e.target.value }))}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full h-9 px-3 text-xs border admin-border admin-surface focus:outline-none admin-focus-border transition-colors font-mono"
              />
            </div>

            <div className="h-4" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-4 border-t admin-border admin-surface flex-shrink-0 gap-3">
          {editId ? (
            <button
              onClick={handleDelete}
              disabled={deleting || saving}
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-40 order-2 sm:order-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {deleting ? l('Se șterge...', 'Удаление...') : t.products.deleteProduct}
            </button>
          ) : <div />}

          <div className="flex items-center gap-2 w-full sm:w-auto order-1 sm:order-2">
            <button
              onClick={closePanel}
              className="flex-1 sm:flex-none px-4 py-2 text-xs admin-muted border admin-border hover:border-gray-400 admin-hover-ink transition-colors"
            >
              {t.common.cancel}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || uploadingSlot !== null || skuStatus.status === 'conflict'}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 admin-solid admin-on-solid text-xs   admin-hover-solid transition-colors disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {saving ? t.common.saving : t.common.save}
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div className={`fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-[60] flex items-center gap-2 px-4 py-3 text-xs admin-on-solid shadow-xl transition-all ${
          toast.ok ? 'admin-solid' : 'bg-red-600'
        }`}>
          {toast.ok ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
