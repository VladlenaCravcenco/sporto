import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router';
import { supabase, type ProductRow } from '../../lib/supabase';
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

// ─── Brand Combobox ───────────────────────────────────────────────────────────

interface BrandComboboxProps {
  value: string;
  onChange: (val: string) => void;
  allProductBrands: string[]; // unique brand strings from loaded products
  supabaseBrandNames: string[]; // brand names from the brands table
}

interface CategoryComboboxProps {
  value: string;
  onChange: (val: string) => void;
  categories: ReturnType<typeof useCategories>;
  onCreate: (name: string) => Promise<string | null>;
}

interface SubcategoryComboboxProps {
  value: string;
  onChange: (val: string) => void;
  subcategories: Array<{ id: string; name: { ro: string; ru: string } }>;
  disabled?: boolean;
  onCreate: (name: string) => Promise<string | null>;
}

function generateProductId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `prod_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function BrandCombobox({ value, onChange, allProductBrands, supabaseBrandNames }: BrandComboboxProps) {
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
          className="w-full h-9 px-3 pr-8 text-xs border border-gray-200 bg-white focus:outline-none focus:border-black transition-colors"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setOpen(o => !o)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-black transition-colors"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {query && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => { setQuery(''); onChange(''); setOpen(true); }}
            className="absolute right-7 top-1/2 -translate-y-1/2 text-gray-300 hover:text-black transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-0.5 bg-white border border-gray-200 shadow-lg max-h-52 overflow-y-auto">

          {/* "Add new" option */}
          {isNew && (
            <button
              type="button"
              onMouseDown={() => select(query.trim())}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-gray-50 transition-colors border-b border-gray-100 text-left"
            >
              <Plus className="w-3 h-3 text-black flex-shrink-0" />
              <span>
                <span className="text-gray-400">Adaugă brand nou: </span>
                <span className="text-black">{query.trim()}</span>
              </span>
            </button>
          )}

          {/* Existing options */}
          {filtered.length > 0 ? (
            filtered.map(opt => {
              return (
                <button
                  key={opt}
                  type="button"
                  onMouseDown={() => select(opt)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs hover:bg-gray-50 transition-colors text-left ${opt === value ? 'bg-gray-50' : ''}`}
                >
                  <span className="flex items-center gap-2">
                    {opt === value && <Check className="w-3 h-3 text-black flex-shrink-0" />}
                    <span className={opt === value ? 'text-black' : 'text-gray-700'}>{opt}</span>
                  </span>
                  {supabaseBrandNames.includes(opt) && (
                    <span className="text-[9px] uppercase tracking-wider text-gray-300 flex-shrink-0 flex items-center gap-1">
                      <Tag className="w-2.5 h-2.5" />
                      db
                    </span>
                  )}
                </button>
              );
            })
          ) : !isNew ? (
            <div className="px-3 py-3 text-xs text-gray-400 text-center">Niciun brand găsit</div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function CategoryCombobox({ value, onChange, categories, onCreate }: CategoryComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = categories.find((c) => c.id === value);

  useEffect(() => {
    setQuery(selected?.name.ro || '');
  }, [selected?.name.ro, value]);

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
          className="w-full h-9 px-3 pr-8 text-xs border border-gray-200 bg-white focus:outline-none focus:border-black transition-colors"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setOpen(o => !o)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-black transition-colors"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {query && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => { setQuery(''); onChange(''); setOpen(true); }}
            className="absolute right-7 top-1/2 -translate-y-1/2 text-gray-300 hover:text-black transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-0.5 bg-white border border-gray-200 shadow-lg max-h-52 overflow-y-auto">
          {isNew && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={createAndSelect}
              disabled={creating}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-gray-50 transition-colors border-b border-gray-100 text-left disabled:opacity-50"
            >
              <Plus className="w-3 h-3 text-black flex-shrink-0" />
              <span>
                <span className="text-gray-400">Adaugă categorie: </span>
                <span className="text-black">{query.trim()}</span>
              </span>
            </button>
          )}

          {filtered.length > 0 ? (
            filtered.map(cat => (
              <button
                key={cat.id}
                type="button"
                onMouseDown={() => select(cat.id)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs hover:bg-gray-50 transition-colors text-left ${cat.id === value ? 'bg-gray-50' : ''}`}
              >
                <span className="flex items-center gap-2">
                  {cat.id === value && <Check className="w-3 h-3 text-black flex-shrink-0" />}
                  <span className={cat.id === value ? 'text-black' : 'text-gray-700'}>{cat.name.ro}</span>
                </span>
                <span className="text-[9px] uppercase tracking-wider text-gray-300 flex-shrink-0 font-mono">
                  {cat.id}
                </span>
              </button>
            ))
          ) : !isNew ? (
            <div className="px-3 py-3 text-xs text-gray-400 text-center">Nicio categorie găsită</div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function SubcategoryCombobox({ value, onChange, subcategories, disabled, onCreate }: SubcategoryComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = subcategories.find((s) => s.id === value);

  useEffect(() => {
    setQuery(selected?.name.ro || '');
  }, [selected?.name.ro, value]);

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
          placeholder={disabled ? 'Alege mai întâi categoria' : 'Benzi, Gantere...'}
          className="w-full h-9 px-3 pr-8 text-xs border border-gray-200 bg-white focus:outline-none focus:border-black transition-colors disabled:opacity-40"
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => !disabled && setOpen(o => !o)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-black transition-colors disabled:opacity-30"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {query && !disabled && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => { setQuery(''); onChange(''); setOpen(true); }}
            className="absolute right-7 top-1/2 -translate-y-1/2 text-gray-300 hover:text-black transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {open && !disabled && (
        <div className="absolute z-50 top-full left-0 right-0 mt-0.5 bg-white border border-gray-200 shadow-lg max-h-52 overflow-y-auto">
          {isNew && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={createAndSelect}
              disabled={creating}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-gray-50 transition-colors border-b border-gray-100 text-left disabled:opacity-50"
            >
              <Plus className="w-3 h-3 text-black flex-shrink-0" />
              <span>
                <span className="text-gray-400">Adaugă subcategorie: </span>
                <span className="text-black">{query.trim()}</span>
              </span>
            </button>
          )}

          {filtered.length > 0 ? (
            filtered.map(sub => (
              <button
                key={sub.id}
                type="button"
                onMouseDown={() => select(sub.id)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs hover:bg-gray-50 transition-colors text-left ${sub.id === value ? 'bg-gray-50' : ''}`}
              >
                <span className="flex items-center gap-2">
                  {sub.id === value && <Check className="w-3 h-3 text-black flex-shrink-0" />}
                  <span className={sub.id === value ? 'text-black' : 'text-gray-700'}>{sub.name.ro}</span>
                </span>
                <span className="text-[9px] uppercase tracking-wider text-gray-300 flex-shrink-0 font-mono">
                  {sub.id}
                </span>
              </button>
            ))
          ) : !isNew ? (
            <div className="px-3 py-3 text-xs text-gray-400 text-center">Nicio subcategorie găsită</div>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type SortKey = 'name_ro' | 'price' | 'qty' | 'id';

const EMPTY_FORM: Partial<ProductRow> = {
  name_ro: '', name_ru: '',
  description_ro: '', description_ru: '',
  category: '', subcategory: '',
  price: 0, sku: '', brand: '',
  unit: 'BUC.', qty: 0,
  image_url: '', images: [], youtube_url: '', active: true, featured: false,
};

function toSlug(value: string) {
  const slug = value.toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[șş]/g, 's').replace(/[țţ]/g, 't')
    .replace(/[ăâ]/g, 'a').replace(/[î]/g, 'i')
    .replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return slug;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function catLabel(categories: ReturnType<typeof useCategories>, id: string) {
  return categories.find(c => c.id === id)?.name.ro ?? id;
}
function subcatLabel(categories: ReturnType<typeof useCategories>, catId: string, subId: string) {
  return categories.find(c => c.id === catId)?.subcategories.find(s => s.id === subId)?.name.ro ?? subId;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminProducts() {
  const { t } = useAdminLang();
  const { allCategories: categories, refetchCategories } = useCategoriesContext();
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [subcatFilter, setSubcatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name_ro');
  const [sortAsc, setSortAsc] = useState(true);

  // Edit panel
  const [panelOpen, setPanelOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<ProductRow>>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null); // which slot is uploading
  const [gallery, setGallery] = useState<string[]>([]); // up to 4 image URLs
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [storageNote, setStorageNote] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadSlotRef = useRef<number>(0); // which slot triggered the file picker
  const navigate = useNavigate();

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  // ─── Load ─────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name_ro', { ascending: true });
    if (error) { showToast(error.message, false); }
    else { setRows(data as ProductRow[]); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel('admin-products-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => { load(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  // ─── Export to Excel ──────────────────────────────────────────────────────────
  const [exporting, setExporting] = useState(false);

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      // Data to export based on current filters
      const dataToExport = rows.filter(p => {
        const q = search.toLowerCase();
        const matchQ = !q
          || p.name_ro.toLowerCase().includes(q)
          || (p.name_ru ?? '').toLowerCase().includes(q)
          || (p.sku ?? '').toLowerCase().includes(q)
          || (p.brand ?? '').toLowerCase().includes(q)
          || p.id.includes(q);
        const matchCat = !catFilter || p.category === catFilter;
        const matchStatus = statusFilter === 'all'
          || (statusFilter === 'active' && p.active)
          || (statusFilter === 'inactive' && !p.active);
        return matchQ && matchCat && matchStatus;
      });

      console.log('Export data:', {
        total: rows.length,
        filtered: dataToExport.length,
        catFilter,
        search,
        statusFilter
      });

      if (dataToExport.length === 0) {
        showToast('Niciun produs de exportat cu filtrele curente', false);
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
        { header: 'Foto', key: 'image', width: 12 },
        { header: 'Denumire', key: 'name_ro', width: 30 },
        { header: 'SKU', key: 'sku', width: 12 },
        { header: 'Brand', key: 'brand', width: 15 },
        { header: 'Categorie', key: 'category', width: 18 },
        { header: 'Subcategorie', key: 'subcategory', width: 18 },
        { header: 'Preț (MDL)', key: 'price', width: 12 },
        { header: 'Preț promo', key: 'sale_price', width: 12 },
        { header: 'Stoc', key: 'qty', width: 8 },
        { header: 'Status', key: 'active', width: 10 },
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
          active: product.active ? 'Activ' : 'Inactiv',
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
      const fileName = `Catalog_Sporto_${categoryName}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);

      showToast(`✓ Exportat ${dataToExport.length} produse în Excel cu imagini!`);
    } catch (error) {
      console.error('Export error:', error);
      showToast('Eroare la exportul în Excel', false);
    }
    setExporting(false);
  };

  // ─── Open panel ───────────────────────────────────────────────────────────────
  const openNew = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setGallery([]);
    setPanelOpen(true);
  };

  const openEdit = (row: ProductRow) => {
    setEditId(row.id);
    setForm({ ...row });
    // Populate gallery from images[] or fall back to image_url
    const imgs = row.images?.length ? row.images : (row.image_url ? [row.image_url] : []);
    setGallery(imgs);
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setEditId(null);
    setForm(EMPTY_FORM);
    setGallery([]);
  };

  // ─── Image upload ─────────────────────────────────────────────────────────────
  const handleFileUpload = async (file: File, slot: number) => {
    if (!file.type.startsWith('image/')) { showToast('Selectați un fișier imagine', false); return; }
    if (file.size > 5 * 1024 * 1024) { showToast('Imaginea trebuie să fie mai mică de 5 MB', false); return; }

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
        showToast('Bucket "product-images" nu există.', false);
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
    showToast(slot === 0 ? 'Imaginea principală a fost încărcată!' : `Imaginea ${slot + 1} a fost încărcată!`);
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

  // ─── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name_ro?.trim()) { showToast('Introduceți numele produsului', false); return; }
    if (!form.category) { showToast('Selectați categoria', false); return; }

    setSaving(true);
    const cleanGallery = gallery.filter(Boolean);
    const payload: Partial<ProductRow> = {
      name_ro: form.name_ro?.trim(),
      name_ru: form.name_ru?.trim() || form.name_ro?.trim(),
      description_ro: form.description_ro?.trim() || null,
      description_ru: form.description_ru?.trim() || null,
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
    };

    if (editId) {
      // Update
      const { error } = await supabase.from('products').update(payload).eq('id', editId);
      if (error) { showToast(error.message, false); }
      else {
        setRows(r => r.map(p => p.id === editId ? { ...p, ...payload } as ProductRow : p));
        showToast('Produsul a fost actualizat!');
        closePanel();
      }
    } else {
      // Insert
      const insertPayload: ProductRow = {
        id: generateProductId(),
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
        image_url: payload.image_url || null,
        images: payload.images || [],
        youtube_url: payload.youtube_url || null,
        featured: payload.featured ?? false,
        active: payload.active ?? true,
      };
      const { data, error } = await supabase.from('products').insert(insertPayload).select().single();
      if (error) { showToast(error.message, false); }
      else {
        setRows(r => [...r, data as ProductRow]);
        showToast('Produs nou adăugat!');
        closePanel();
      }
    }
    setSaving(false);
  };

  // ─── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!editId) return;
    if (!confirm('Ești sigur? Produsul va fi șters definitiv.')) return;
    setDeleting(true);
    const { error } = await supabase.from('products').delete().eq('id', editId);
    if (error) { showToast(error.message, false); }
    else {
      setRows(r => r.filter(p => p.id !== editId));
      showToast('Produs șters.');
      closePanel();
    }
    setDeleting(false);
  };

  // ─── Quick toggle active ───────────────────────────────────────────────────
  const handleLogout = () => {
    logoutAdmin();
    navigate('/admin/login', { replace: true });
  };

  const toggleActive = async (row: ProductRow, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !row.active;
    const { error } = await supabase.from('products').update({ active: next }).eq('id', row.id);
    if (!error) {
      setRows(r => r.map(p => p.id === row.id ? { ...p, active: next } : p));
    }
  };

  // ─── Filter + sort ────────────────────────────────────────────────────────
  const categoryFilterQuery = catFilter.trim().toLowerCase();
  const brandFilterQuery = brandFilter.trim().toLowerCase();
  const subcategoryFilterQuery = subcatFilter.trim().toLowerCase();

  const filtered = rows
    .filter(p => {
      const q = search.toLowerCase();
      const matchQ = !q
        || p.name_ro.toLowerCase().includes(q)
        || (p.name_ru ?? '').toLowerCase().includes(q)
        || (p.sku ?? '').toLowerCase().includes(q)
        || (p.brand ?? '').toLowerCase().includes(q)
        || p.id.includes(q);
      const categoryName = catLabel(categories, p.category).toLowerCase();
      const subcategoryName = p.subcategory
        ? subcatLabel(categories, p.category, p.subcategory).toLowerCase()
        : '';
      const brandName = (p.brand ?? '').toLowerCase();
      const matchCat = !categoryFilterQuery
        || p.category.toLowerCase().includes(categoryFilterQuery)
        || categoryName.includes(categoryFilterQuery);
      const matchBrand = !brandFilterQuery || brandName.includes(brandFilterQuery);
      const matchSubcategory = !subcategoryFilterQuery
        || (p.subcategory ?? '').toLowerCase().includes(subcategoryFilterQuery)
        || subcategoryName.includes(subcategoryFilterQuery);
      const matchStatus = statusFilter === 'all'
        || (statusFilter === 'active' && p.active)
        || (statusFilter === 'inactive' && !p.active);
      return matchQ && matchCat && matchBrand && matchSubcategory && matchStatus;
    })
    .sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortAsc ? cmp : -cmp;
    });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(true); }
  };

  const SortArrow = ({ k }: { k: SortKey }) =>
    sortKey === k ? <span className="ml-0.5">{sortAsc ? '↑' : '↓'}</span> : null;

  const selectedCatSubs = categories.find(c => c.id === form.category)?.subcategories ?? [];
  const allCategoryOptions = useMemo(
    () => categories.map((c) => ({ value: c.id, label: c.name.ro })),
    [categories]
  );
  const allSubcategoryOptions = useMemo(
    () => categories.flatMap((category) =>
      category.subcategories.map((subcategory) => ({
        value: subcategory.id,
        label: subcategory.name.ro,
        categoryId: category.id,
      }))
    ),
    [categories]
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
    showToast('Categorie nouă creată');
    return slug;
  };

  const createSubcategory = async (name: string): Promise<string | null> => {
    if (!form.category) {
      showToast('Selectați mai întâi categoria', false);
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
    showToast('Subcategoria a fost creată');
    return slug;
  };

  // ─── Unique brand list from loaded products ──────────────────────────────
  const allProductBrands = useMemo(() =>
    [...new Set(rows.map(r => r.brand).filter(Boolean) as string[])],
    [rows]
  );

  // ─── Brand names from the brands table ───────────────────────────────────
  const { brands: supabaseBrands } = useSupabaseBrands();
  const supabaseBrandNames = useMemo(
    () => supabaseBrands.map(b => b.name),
    [supabaseBrands]
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── Top bar ── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-12 gap-4">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-900">Produse</span>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 tabular-nums">{rows.length}</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={load} disabled={loading} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-black transition-colors">
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Reîncarcă</span>
              </button>
              <button
                onClick={handleExportExcel}
                disabled={exporting || rows.length === 0}
                className="flex items-center gap-2 border border-gray-200 text-gray-700 hover:border-black hover:text-black px-4 py-2 text-xs uppercase tracking-wider transition-colors disabled:opacity-40"
              >
                {exporting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Export...
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    Exportă Excel
                  </>
                )}
              </button>
              <button
                onClick={openNew}
                className="flex items-center gap-2 bg-black text-white px-4 py-2 text-xs uppercase tracking-wider hover:bg-gray-800 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Produs nou
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex-1">

        {/* ── Filters ── */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Caută după nume, cod, SKU, brand..."
              className="w-full h-9 pl-9 pr-8 text-xs border border-gray-200 bg-white placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-black">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="relative min-w-[180px]">
            <input
              type="text"
              list="admin-products-category-filter"
              value={catFilter}
              onChange={e => setCatFilter(e.target.value)}
              placeholder="Categorie..."
              className="w-full h-9 px-3 pr-8 text-xs border border-gray-200 bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
            />
            {catFilter && (
              <button onClick={() => setCatFilter('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-black">
                <X className="w-3 h-3" />
              </button>
            )}
            <datalist id="admin-products-category-filter">
              {allCategoryOptions.map((category) => (
                <option key={category.value} value={category.label} />
              ))}
            </datalist>
          </div>

          <div className="relative min-w-[180px]">
            <input
              type="text"
              list="admin-products-brand-filter"
              value={brandFilter}
              onChange={e => setBrandFilter(e.target.value)}
              placeholder="Brand..."
              className="w-full h-9 px-3 pr-8 text-xs border border-gray-200 bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
            />
            {brandFilter && (
              <button onClick={() => setBrandFilter('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-black">
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

          <div className="relative min-w-[200px]">
            <input
              type="text"
              list="admin-products-subcategory-filter"
              value={subcatFilter}
              onChange={e => setSubcatFilter(e.target.value)}
              placeholder="Subcategorie..."
              className="w-full h-9 px-3 pr-8 text-xs border border-gray-200 bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
            />
            {subcatFilter && (
              <button onClick={() => setSubcatFilter('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-black">
                <X className="w-3 h-3" />
              </button>
            )}
            <datalist id="admin-products-subcategory-filter">
              {allSubcategoryOptions
                .filter((subcategory) => !categoryFilterQuery || subcategory.categoryId.toLowerCase().includes(categoryFilterQuery) || subcategory.label.toLowerCase().includes(categoryFilterQuery))
                .map((subcategory) => (
                  <option key={`${subcategory.categoryId}-${subcategory.value}`} value={subcategory.label} />
                ))}
            </datalist>
          </div>

          <div className="flex border border-gray-200 bg-white">
            {(['all', 'active', 'inactive'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 h-9 text-xs transition-colors border-r last:border-0 border-gray-100 ${
                  statusFilter === s ? 'bg-black text-white' : 'text-gray-500 hover:text-black'
                }`}
              >
                {s === 'all' ? 'Toate' : s === 'active' ? 'Active' : 'Inactive'}
              </button>
            ))}
          </div>

          <div className="text-xs text-gray-400 flex items-center ml-auto">
            {filtered.length} din {rows.length}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-white border border-gray-100 overflow-hidden">
          {/* Head */}
          <div className="hidden lg:grid grid-cols-[56px_2fr_1fr_90px_90px_70px_70px_44px] gap-3 px-4 py-2.5 border-b border-gray-100 bg-gray-50 text-[10px] uppercase tracking-widest text-gray-400">
            <div />
            <button onClick={() => toggleSort('name_ro')} className="text-left hover:text-black transition-colors flex items-center">Produs <SortArrow k="name_ro" /></button>
            <div>Categorie</div>
            <button onClick={() => toggleSort('price')} className="text-right hover:text-black transition-colors flex items-center justify-end">Preț MDL <SortArrow k="price" /></button>
            <button onClick={() => toggleSort('qty')} className="text-center hover:text-black transition-colors flex items-center justify-center">Stoc <SortArrow k="qty" /></button>
            <div className="text-center">Activ</div>
            <div className="text-center">Rec.</div>
            <div />
          </div>

          {loading ? (
            <div className="divide-y divide-gray-50">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3 animate-pulse">
                  <div className="w-10 h-10 bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-100 w-1/3" />
                    <div className="h-2.5 bg-gray-50 w-1/5" />
                  </div>
                  <div className="h-3 w-20 bg-gray-100" />
                  <div className="h-3 w-16 bg-gray-100" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <Package className="w-8 h-8 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Niciun produs găsit</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map(row => (
                <div
                  key={row.id}
                  onClick={() => openEdit(row)}
                  className="grid grid-cols-[56px_1fr] lg:grid-cols-[56px_2fr_1fr_90px_90px_70px_70px_44px] gap-3 items-center px-4 py-3 cursor-pointer hover:bg-gray-50/70 transition-colors group"
                >
                  {/* Thumb */}
                  <div className="w-10 h-10 bg-gray-100 flex-shrink-0 overflow-hidden">
                    {row.image_url
                      ? <img src={row.image_url} alt="" className="w-full h-full object-cover" />
                      : <Package className="w-4 h-4 text-gray-300 m-3" />
                    }
                  </div>

                  {/* Name */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {!row.active && <span className="w-1.5 h-1.5 bg-gray-300 rounded-full flex-shrink-0" />}
                      {row.featured && <Star className="w-3 h-3 text-gray-400 fill-gray-200 flex-shrink-0" />}
                      <span className="text-xs text-gray-900 truncate group-hover:text-black">{row.name_ro}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {row.sku && <span className="text-[10px] text-gray-400 font-mono">{row.sku}</span>}
                      {row.brand && <span className="text-[10px] text-gray-400">{row.brand}</span>}
                      <span className="text-[10px] text-gray-300 font-mono">#{row.id}</span>
                    </div>
                  </div>

                  {/* Category — hidden on small */}
                  <div className="hidden lg:block text-xs text-gray-400 truncate">{catLabel(categories, row.category)}</div>

                  {/* Price */}
                  <div className="hidden lg:block text-xs text-gray-700 text-right tabular-nums font-mono">
                    {Number(row.price).toLocaleString()}
                  </div>

                  {/* Qty */}
                  <div className={`hidden lg:block text-xs text-center tabular-nums font-mono ${
                    Number(row.qty) === 0 ? 'text-red-400' : Number(row.qty) < 5 ? 'text-amber-500' : 'text-gray-700'
                  }`}>
                    {row.qty ?? '—'}
                  </div>

                  {/* Active toggle */}
                  <div className="hidden lg:flex justify-center">
                    <button
                      onClick={e => toggleActive(row, e)}
                      className={`w-8 h-5 rounded-full transition-colors flex items-center ${row.active ? 'bg-black' : 'bg-gray-200'}`}
                    >
                      <span className={`w-3.5 h-3.5 bg-white rounded-full shadow transition-transform mx-0.5 ${row.active ? 'translate-x-3' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Featured */}
                  <div className="hidden lg:flex justify-center">
                    {row.featured && <Star className="w-3.5 h-3.5 text-gray-400 fill-gray-200" />}
                  </div>

                  {/* Arrow */}
                  <div className="hidden lg:flex justify-center text-gray-200 group-hover:text-gray-500 transition-colors">
                    <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ══ EDIT PANEL (slide-in from right) ══════════════════════════════════ */}
      {/* Overlay */}
      {panelOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 backdrop-blur-[1px]"
          onClick={closePanel}
        />
      )}

      {/* Panel */}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-[560px] bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${panelOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Panel header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-sm text-gray-900">
              {editId ? 'Editare produs' : 'Produs nou'}
            </h2>
            {editId && <p className="text-[10px] text-gray-400 font-mono mt-0.5">#{editId}</p>}
          </div>
          <div className="flex items-center gap-2">
            {editId && (
              <a href={`/product/${editId}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-black transition-colors px-2 py-1.5 border border-gray-100 hover:border-gray-300"
              >
                <ExternalLink className="w-3 h-3" />
                <span className="hidden sm:inline">Pagina produsului</span>
              </a>
            )}
            <button onClick={closePanel} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-black transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Panel body — scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">

            {/* ── Images — 4 slots ── */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] uppercase tracking-widest text-gray-400">
                  Imagini <span className="text-gray-300 normal-case tracking-normal">(max 4 · prima = principală)</span>
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
                        <div className="relative w-full h-full border border-gray-200 overflow-hidden group">
                          <img src={url} alt="" className="w-full h-full object-contain bg-gray-50" />
                          {/* Principal badge */}
                          {slot === 0 && (
                            <span className="absolute top-1.5 left-1.5 text-[9px] uppercase tracking-widest bg-black text-white px-1.5 py-0.5">
                              Principal
                            </span>
                          )}
                          {/* Paste hint */}
                          <span className="absolute bottom-1.5 right-1.5 text-[9px] bg-black/50 text-white px-1.5 py-0.5 opacity-0 group-focus:opacity-100 transition-opacity pointer-events-none">
                            Ctrl+V
                          </span>
                          {/* Overlay actions */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() => { uploadSlotRef.current = slot; fileInputRef.current?.click(); }}
                              className="w-7 h-7 bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                              title="Înlocuiește"
                            >
                              <ImageIcon className="w-3.5 h-3.5 text-gray-700" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeGalleryImage(slot)}
                              className="w-7 h-7 bg-white/90 flex items-center justify-center hover:bg-red-50 transition-colors"
                              title="Elimină"
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
                              ? 'border-gray-200 bg-gray-50'
                              : 'border-gray-200 hover:border-black hover:bg-gray-50/50 cursor-pointer'
                          }`}
                        >
                          {isUploading ? (
                            <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
                          ) : (
                            <>
                              <Plus className="w-4 h-4 text-gray-300" />
                              <span className="text-[10px] text-gray-400">
                                {slot === 0 ? 'Principală' : `Foto ${slot + 1}`}
                              </span>
                              <span className="text-[9px] text-gray-300 mt-0.5">
                                или Ctrl+V
                              </span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Single hidden file input */}
              <input
                ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) handleFileUpload(f, uploadSlotRef.current);
                  e.target.value = '';
                }}
              />

              {/* Storage note */}
              {storageNote && (
                <div className="mt-3 bg-amber-50 border border-amber-200 p-3 flex gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-[10px] text-amber-700 leading-relaxed">
                    <strong>Creați bucket-ul în Supabase:</strong><br />
                    Supabase Dashboard → Storage → New bucket<br />
                    Name: <code className="bg-amber-100 px-1">product-images</code> · Public: <strong>ON</strong><br />
                    Apoi adăugați policy: <code className="bg-amber-100 px-1">allow all operations for anon</code>
                  </div>
                </div>
              )}
            </div>

            {/* ── Names ── */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-[10px] uppercase tracking-widest text-gray-400 mb-1.5 block">
                  Denumire RO <span className="text-red-400">*</span>
                </label>
                <input
                  type="text" value={form.name_ro ?? ''}
                  onChange={e => setForm(f => ({ ...f, name_ro: e.target.value }))}
                  className="w-full h-9 px-3 text-xs border border-gray-200 bg-white focus:outline-none focus:border-black transition-colors"
                  placeholder="Denumire în română"
                />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] uppercase tracking-widest text-gray-400 mb-1.5 block">Denumire RU</label>
                <input
                  type="text" value={form.name_ru ?? ''}
                  onChange={e => setForm(f => ({ ...f, name_ru: e.target.value }))}
                  className="w-full h-9 px-3 text-xs border border-gray-200 bg-white focus:outline-none focus:border-black transition-colors"
                  placeholder="Название на русском"
                />
              </div>
            </div>

            {/* ── Category ── */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-400 mb-1.5 block">
                  Categorie <span className="text-red-400">*</span>
                </label>
                <CategoryCombobox
                  value={form.category ?? ''}
                  onChange={(val) => setForm(f => ({ ...f, category: val, subcategory: '' }))}
                  categories={categories}
                  onCreate={createCategory}
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-400 mb-1.5 block">Subcategorie</label>
                <SubcategoryCombobox
                  value={form.subcategory ?? ''}
                  onChange={(val) => setForm(f => ({ ...f, subcategory: val }))}
                  subcategories={selectedCatSubs}
                  disabled={!form.category}
                  onCreate={createSubcategory}
                />
              </div>
            </div>

            {/* ── Price / unit / qty ── */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-400 mb-1.5 block">Preț MDL</label>
                <input
                  type="number" min="0" step="0.01" value={form.price ?? 0}
                  onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                  className="w-full h-9 px-3 text-xs border border-gray-200 bg-white focus:outline-none focus:border-black transition-colors font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-400 mb-1.5 block">Unitate</label>
                <select
                  value={form.unit ?? 'BUC.'}
                  onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                  className="w-full h-9 px-3 text-xs border border-gray-200 bg-white focus:outline-none focus:border-black transition-colors"
                >
                  {['BUC.', 'set', 'pereche', 'kg', 'pcs'].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-400 mb-1.5 block">
                  Stoc (buc)
                </label>
                <input
                  type="number" min="0" step="1" value={form.qty ?? 0}
                  onChange={e => setForm(f => ({ ...f, qty: Number(e.target.value) }))}
                  className={`w-full h-9 px-3 text-xs border bg-white focus:outline-none focus:border-black transition-colors font-mono ${
                    Number(form.qty) === 0 ? 'border-red-200 text-red-500' : 'border-gray-200'
                  }`}
                />
              </div>
            </div>

            {/* ── Sale Price (акционная цена) ── */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-gray-400 mb-1.5 block flex items-center gap-2">
                <Tag className="w-3 h-3" />
                Preț promoțional (opțional)
              </label>
              <input
                type="number" min="0" step="0.01" 
                value={form.sale_price ?? ''}
                onChange={e => setForm(f => ({ ...f, sale_price: e.target.value ? Number(e.target.value) : null }))}
                placeholder="Lasă gol dacă nu e promoție"
                className="w-full h-9 px-3 text-xs border border-red-200 bg-red-50/30 focus:outline-none focus:border-red-500 transition-colors font-mono placeholder:text-gray-400"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Dacă este completat, prețul vechi va fi tăiat și va apărea badge-ul "PROMOȚIE"
              </p>
            </div>

            {/* ── SKU / Brand ── */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-400 mb-1.5 block">SKU / Cod articol</label>
                <input
                  type="text" value={form.sku ?? ''}
                  onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                  placeholder="17-47-121"
                  className="w-full h-9 px-3 text-xs border border-gray-200 bg-white focus:outline-none focus:border-black transition-colors font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-400 mb-1.5 block">Brand</label>
                <BrandCombobox
                  value={form.brand ?? ''}
                  onChange={val => setForm(f => ({ ...f, brand: val }))}
                  allProductBrands={allProductBrands}
                  supabaseBrandNames={supabaseBrandNames}
                />
              </div>
            </div>

            {/* ── Descriptions ── */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-gray-400 mb-1.5 block">Descriere RO</label>
              <textarea
                value={form.description_ro ?? ''}
                onChange={e => setForm(f => ({ ...f, description_ro: e.target.value }))}
                rows={3}
                placeholder="Descriere detaliată a produsului în română..."
                className="w-full px-3 py-2 text-xs border border-gray-200 bg-white focus:outline-none focus:border-black transition-colors resize-none"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-gray-400 mb-1.5 block">Descriere RU</label>
              <textarea
                value={form.description_ru ?? ''}
                onChange={e => setForm(f => ({ ...f, description_ru: e.target.value }))}
                rows={3}
                placeholder="Подробное описание на русском..."
                className="w-full px-3 py-2 text-xs border border-gray-200 bg-white focus:outline-none focus:border-black transition-colors resize-none"
              />
            </div>

            {/* ── Toggles ── */}
            <div className="flex gap-6">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, active: !f.active }))}
                  className={`w-10 h-6 rounded-full transition-colors flex items-center ${form.active ? 'bg-black' : 'bg-gray-200'}`}
                >
                  <span className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${form.active ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
                <div>
                  <div className="text-xs text-gray-900 flex items-center gap-1">
                    {form.active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-gray-400" />}
                    {form.active ? 'Activ (vizibil)' : 'Inactiv (ascuns)'}
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, featured: !f.featured }))}
                  className={`w-10 h-6 rounded-full transition-colors flex items-center ${form.featured ? 'bg-black' : 'bg-gray-200'}`}
                >
                  <span className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-1 ${form.featured ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
                <div className="text-xs text-gray-900 flex items-center gap-1">
                  <Star className={`w-3 h-3 ${form.featured ? 'fill-gray-400 text-gray-400' : 'text-gray-400'}`} />
                  {form.featured ? 'Recomandat pe pagina principală' : 'Nu este recomandat'}
                </div>
              </label>
            </div>

            {/* ── YouTube URL ── */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-gray-400 mb-1.5 block">URL YouTube</label>
              <input
                type="text" value={form.youtube_url ?? ''}
                onChange={e => setForm(f => ({ ...f, youtube_url: e.target.value }))}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full h-9 px-3 text-xs border border-gray-200 bg-white focus:outline-none focus:border-black transition-colors font-mono"
              />
            </div>

            {/* Bottom spacer */}
            <div className="h-4" />
          </div>
        </div>

        {/* Panel footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white flex-shrink-0 gap-3">
          {editId ? (
            <button
              onClick={handleDelete}
              disabled={deleting || saving}
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {deleting ? 'Se șterge...' : 'Șterge produsul'}
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button
              onClick={closePanel}
              className="px-4 py-2 text-xs text-gray-500 border border-gray-200 hover:border-gray-400 hover:text-black transition-colors"
            >
              Anulează
            </button>
            <button
              onClick={handleSave}
              disabled={saving || uploadingSlot !== null}
              className="flex items-center gap-2 px-5 py-2 bg-black text-white text-xs uppercase tracking-wider hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {saving ? 'Salvare...' : 'Salvează'}
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[60] flex items-center gap-2 px-4 py-3 text-xs text-white shadow-xl transition-all ${
          toast.ok ? 'bg-black' : 'bg-red-600'
        }`}>
          {toast.ok ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
