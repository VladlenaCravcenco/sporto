import { useState, useRef, useEffect } from 'react';
import { supabase, type BrandRow } from '../../lib/supabase';
import { useSupabaseBrands, useBrandProductCounts } from '../hooks/useSupabaseBrands';
import {
  Plus, Pencil, Trash2, Upload, X, Check, Loader2,
  ImageIcon, AlertCircle, Monitor, Smartphone, Globe,
  Search, ChevronDown, ChevronUp, FileText,
} from 'lucide-react';
import { useAdminLang } from '../contexts/AdminLangContext';

// ─── helpers ──────────────────────────────────────────────────────────────────
function toSlug(name: string): string {
  return name.toLowerCase().trim()
    .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');
}

type BrandForm = Omit<BrandRow, 'id' | 'created_at'>;
const EMPTY: BrandForm = {
  name: '', slug: '', active: true, logo_url: null,
  description_ro: '', description_ru: '',
  country_ro: '', country_ru: '', country_flag: '🌍',
  founded: null, segment_ro: '', segment_ru: '',
  tagline_ro: '', tagline_ru: '', website: '',
  hero_image_url: null,
  website_url: null, banner_desktop_url: null, banner_mobile_url: null,
  catalog_pdf: null,
};

// ─── Logo upload ──────────────────────────────────────────────────────────────
function LogoUpload({ value, onChange }: { value: string | null; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setUploading(true); setErr(null);
    const ext = file.name.split('.').pop() ?? 'png';
    const path = `logos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: upErr } = await supabase.storage.from('brand-logos').upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) { setErr(upErr.message); setUploading(false); return; }
    const { data } = supabase.storage.from('brand-logos').getPublicUrl(path);
    onChange(data.publicUrl);
    setUploading(false);
  };

  return (
    <div className="space-y-2">
      <label className="text-[10px] uppercase tracking-widest text-gray-400">Logo PNG/JPG/SVG</label>
      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-200 hover:border-black cursor-pointer flex items-center justify-center bg-gray-50 h-20"
      >
        {uploading ? <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
          : value ? <img src={value} alt="logo" className="max-h-14 max-w-[140px] object-contain" />
          : <div className="flex flex-col items-center gap-1 text-gray-400">
              <ImageIcon className="w-5 h-5" />
              <span className="text-[10px] uppercase tracking-wider">Загрузить лого</span>
            </div>
        }
        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
      </div>
      {err && <p className="text-[10px] text-red-500">{err}</p>}
      {value && (
        <div className="flex gap-2">
          <input type="text" value={value} onChange={e => onChange(e.target.value)}
            placeholder="URL logo"
            className="flex-1 h-8 text-[10px] px-2 border border-gray-200 focus:outline-none focus:border-black bg-white" />
          <button type="button" onClick={() => onChange('')}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 border border-gray-200">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Banner upload ────────────────────────────────────────────────────────────
function BannerUpload({ value, onChange, label, hint }: {
  value: string | null; onChange: (url: string | null) => void; label: string; hint: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setUploading(true); setErr(null);
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `banners/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: upErr } = await supabase.storage.from('brand-banners').upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) { setErr(upErr.message); setUploading(false); return; }
    const { data } = supabase.storage.from('brand-banners').getPublicUrl(path);
    onChange(data.publicUrl);
    setUploading(false);
  };

  return (
    <div className="space-y-1.5">
      <label className="text-[10px] uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
        {label} <span className="normal-case text-gray-300">· {hint}</span>
      </label>
      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-200 hover:border-black cursor-pointer flex items-center justify-center bg-gray-50 overflow-hidden h-16"
      >
        {uploading ? <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
          : value ? <img src={value} alt="banner" className="w-full h-full object-cover" />
          : <div className="flex items-center gap-1.5 text-gray-400">
              <ImageIcon className="w-4 h-4" />
              <span className="text-[10px] uppercase tracking-wider">Загрузить</span>
            </div>
        }
        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
      </div>
      {err && <p className="text-[10px] text-red-500">{err}</p>}
      {value && (
        <div className="flex gap-2">
          <input type="text" value={value} onChange={e => onChange(e.target.value || null)}
            placeholder="URL banner"
            className="flex-1 h-7 text-[10px] px-2 border border-gray-200 focus:outline-none focus:border-black bg-white" />
          <button type="button" onClick={() => onChange(null)}
            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 border border-gray-200">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Field helper ─────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-widest text-gray-400 block mb-1">{label}</label>
      {children}
    </div>
  );
}

const inp = "w-full h-9 px-3 text-xs border border-gray-200 focus:outline-none focus:border-black bg-white";
const ta  = "w-full px-3 py-2 text-xs border border-gray-200 focus:outline-none focus:border-black resize-none bg-white";

// ─── Collapsible section ──────────────────────────────────────────────────────
function Section({ title, children, defaultOpen = true }: {
  title: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-gray-100 pt-3">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-between w-full mb-2"
      >
        <span className="text-[10px] uppercase tracking-widest text-gray-400">{title}</span>
        {open ? <ChevronUp className="w-3 h-3 text-gray-400" /> : <ChevronDown className="w-3 h-3 text-gray-400" />}
      </button>
      {open && <div className="space-y-3">{children}</div>}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function AdminBrands() {
  const { t } = useAdminLang();
  const { brands, loading, error, refetch } = useSupabaseBrands();
  const productCounts = useBrandProductCounts();

  const [editingId, setEditingId]   = useState<string | 'new' | null>(null);
  const [form, setForm]             = useState<BrandForm>(EMPTY);
  const [slugManual, setSlugManual] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [saveErr, setSaveErr]       = useState<string | null>(null);
  const [deleteId, setDeleteId]     = useState<string | null>(null);
  const [deleting, setDeleting]     = useState(false);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sqlCopied, setSqlCopied]   = useState(false);
  const [sqlExpanded, setSqlExpanded] = useState(false);

const SQL_SETUP = `ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS website_url text;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS banner_desktop_url text;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS banner_mobile_url text;
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;
NOTIFY pgrst, 'reload schema';

CREATE TABLE IF NOT EXISTS public.brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE, slug text NOT NULL UNIQUE,
  logo_url text, description_ro text, description_ru text,
  country_ro text, country_ru text, country_flag text DEFAULT '🌍',
  founded integer, segment_ro text, segment_ru text,
  tagline_ro text, tagline_ru text, website text,
  website_url text, banner_desktop_url text, banner_mobile_url text,
  active boolean DEFAULT true,
  catalog_pdf text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow all" ON public.brands FOR ALL USING (true) WITH CHECK (true);`;

  const copySQL = () => {
    navigator.clipboard.writeText(SQL_SETUP).then(() => {
      setSqlCopied(true); setTimeout(() => setSqlCopied(false), 2500);
    });
  };

  useEffect(() => {
    if (!slugManual && editingId === 'new') setForm(f => ({ ...f, slug: toSlug(f.name) }));
  }, [form.name, slugManual, editingId]);

  const openNew = () => { setForm(EMPTY); setSlugManual(false); setSaveErr(null); setEditingId('new'); };
  const openEdit = (brand: BrandRow) => {
    setForm({
      name: brand.name, slug: brand.slug, active: brand.active ?? true, logo_url: brand.logo_url,
      description_ro: brand.description_ro ?? '', description_ru: brand.description_ru ?? '',
      country_ro: brand.country_ro ?? '', country_ru: brand.country_ru ?? '',
      country_flag: brand.country_flag ?? '🌍', founded: brand.founded,
      segment_ro: brand.segment_ro ?? '', segment_ru: brand.segment_ru ?? '',
      tagline_ro: brand.tagline_ro ?? '', tagline_ru: brand.tagline_ru ?? '',
      website: brand.website ?? '', hero_image_url: brand.hero_image_url || null,
      website_url: brand.website_url || null,
      banner_desktop_url: brand.banner_desktop_url || null,
      banner_mobile_url: brand.banner_mobile_url || null,
      catalog_pdf: brand.catalog_pdf || null,
    });
    setSlugManual(true); setSaveErr(null); setEditingId(brand.id);
  };

  const set = (k: keyof BrandForm, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) { setSaveErr('Имя бренда обязательно.'); return; }
    if (!form.slug.trim()) { setSaveErr('Slug обязателен.'); return; }
    setSaving(true); setSaveErr(null);
    const payload = {
      name: form.name.trim(), slug: form.slug.trim(), active: form.active ?? true,
      logo_url: form.logo_url || null,
      description_ro: form.description_ro || null, description_ru: form.description_ru || null,
      country_ro: form.country_ro || null, country_ru: form.country_ru || null,
      country_flag: form.country_flag || '🌍',
      founded: form.founded ? Number(form.founded) : null,
      segment_ro: form.segment_ro || null, segment_ru: form.segment_ru || null,
      tagline_ro: form.tagline_ro || null, tagline_ru: form.tagline_ru || null,
      website: form.website || null, hero_image_url: form.hero_image_url || null,
      website_url: form.website_url || null,
      banner_desktop_url: form.banner_desktop_url || null,
      banner_mobile_url: form.banner_mobile_url || null,
      catalog_pdf: form.catalog_pdf || null,
    };
    const { error: err } = editingId === 'new'
      ? await supabase.from('brands').insert([payload])
      : await supabase.from('brands').update(payload).eq('id', editingId!);
    setSaving(false);
    if (err) setSaveErr(err.message);
    else { setEditingId(null); refetch(); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await supabase.from('brands').delete().eq('id', deleteId);
    setDeleting(false); setDeleteId(null); refetch();
  };

  const toggleBrandActive = async (brand: BrandRow) => {
    const next = !(brand.active ?? true);
    const { error } = await supabase.from('brands').update({ active: next }).eq('id', brand.id);
    if (error) setSaveErr(error.message);
    else refetch();
  };

  const filtered = brands.filter(b => {
    const matchSearch = b.name.toLowerCase().includes(search.toLowerCase());
    const isActive = b.active ?? true;
    const matchStatus = statusFilter === 'all'
      || (statusFilter === 'active' && isActive)
      || (statusFilter === 'inactive' && !isActive);
    return matchSearch && matchStatus;
  });
  const panelOpen = editingId !== null;

  return (
    <div className="min-h-screen bg-gray-50 pb-16 lg:pb-0">

      {/* ══════════════════════════════════
          TOP BAR  (sticky)
          ══════════════════════════════════ */}
      <div className="bg-white border-b border-gray-100 sticky top-12 z-20">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">

          {/* Row 1: title + count + add button */}
          <div className="flex items-center h-11 gap-2">
            <span className="text-sm text-gray-900 flex-shrink-0">{t.brands.title}</span>
            <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 tabular-nums flex-shrink-0">
              {brands.length}
            </span>
            <div className="flex-1" />
            <button
              onClick={openNew}
              className="flex items-center gap-1.5 bg-black text-white text-xs px-3 h-8 hover:bg-gray-800 transition-colors flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.brands.newBrand}</span>
              <span className="sm:hidden">+</span>
            </button>
          </div>

          {/* Row 2: search */}
          <div className="pb-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 pointer-events-none" />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder={t.brands.searchPlaceholder ?? 'Поиск бренда…'}
                className="w-full h-8 pl-9 pr-8 text-xs border border-gray-200 focus:outline-none focus:border-black bg-white"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-black">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="flex border border-gray-200 bg-white w-fit mt-2">
              {(['all', 'active', 'inactive'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 h-8 text-xs transition-colors border-r last:border-0 border-gray-100 ${
                    statusFilter === s ? 'bg-black text-white' : 'text-gray-500 hover:text-black'
                  }`}
                >
                  {s === 'all' ? 'Toate' : s === 'active' ? 'Active' : 'Inactive'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════
          CONTENT
          ══════════════════════════════════ */}
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-4">

        {/* SQL error notice */}
        {(error || saveErr) && (
          <div className="mb-4 border border-orange-200 bg-orange-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-orange-800 mb-2">
                  Таблица <code className="bg-orange-100 px-1">brands</code> не найдена в Supabase.
                </p>
                <div className="flex items-center gap-2 mb-2">
                  <button onClick={copySQL}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 transition-colors ${sqlCopied ? 'bg-green-500 text-white' : 'bg-orange-600 text-white hover:bg-orange-700'}`}>
                    {sqlCopied ? <Check className="w-3 h-3" /> : <Upload className="w-3 h-3" />}
                    {sqlCopied ? 'Скопировано!' : 'Скопировать SQL'}
                  </button>
                  <button onClick={() => setSqlExpanded(v => !v)} className="text-xs text-orange-600 border border-orange-300 px-3 py-1.5 hover:bg-orange-100">
                    {sqlExpanded ? 'Скрыть' : 'SQL'}
                  </button>
                </div>
                {sqlExpanded && (
                  <pre className="text-[10px] bg-white border border-orange-200 p-3 overflow-x-auto text-gray-700 leading-relaxed whitespace-pre-wrap break-all">
                    {SQL_SETUP}
                  </pre>
                )}
                <p className="text-[10px] text-orange-500">Ошибка: <code>{error || saveErr}</code></p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-4">

          {/* ── Brand list ── */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="space-y-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white border border-gray-100 animate-pulse h-14" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white border border-gray-100 py-14 text-center">
                <p className="text-xs text-gray-400">
                  {brands.length === 0 ? (t.brands.noBrands ?? 'Брендов пока нет') : (t.brands.noResults ?? 'Ничего не найдено')}
                </p>
              </div>
            ) : (
              <div className="space-y-px">
                {filtered.map(brand => {
                  const count = productCounts[brand.name] ?? 0;
                  const isEditing = editingId === brand.id;
                  return (
                    <div
                      key={brand.id}
                      className={`flex items-center gap-3 px-3 py-2.5 bg-white border transition-colors ${
                        isEditing ? 'border-black' : 'border-transparent hover:border-gray-200'
                      }`}
                    >
                      {/* Logo */}
                      <div className="w-12 h-8 flex-shrink-0 bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
                        {brand.logo_url
                          ? <img src={brand.logo_url} alt={brand.name} className="max-h-6 max-w-[44px] object-contain" />
                          : <span className="text-[8px] text-gray-300 uppercase tracking-wider text-center px-0.5 leading-tight">
                              {brand.name.slice(0, 6)}
                            </span>
                        }
                      </div>

                      {/* Name + meta */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-900 truncate">{brand.name}</span>
                          {brand.country_flag && <span className="text-xs flex-shrink-0">{brand.country_flag}</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-gray-400 truncate">/{brand.slug}</span>
                          {brand.website && (
                            <span className="hidden sm:flex items-center gap-0.5 text-[10px] text-gray-300">
                              <Globe className="w-2.5 h-2.5" />{brand.website}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Count + active badge */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <div className={`text-[11px] tabular-nums px-2 py-0.5 flex-shrink-0 ${count > 0 ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>
                          {count}
                        </div>
                        <span className={`hidden sm:inline text-[9px] uppercase tracking-wide px-1.5 py-0.5 flex-shrink-0 ${(brand.active ?? true) ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}>
                          {(brand.active ?? true) ? (t.brands.active ?? 'activ') : (t.brands.hidden ?? 'ascuns')}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <button
                          onClick={() => toggleBrandActive(brand)}
                          className={`w-8 h-5 rounded-full transition-colors flex items-center ${(brand.active ?? true) ? 'bg-black' : 'bg-gray-200'}`}
                          title={(brand.active ?? true) ? 'Ascunde de pe site' : 'Arată pe site'}
                        >
                          <span className={`w-3.5 h-3.5 bg-white rounded-full shadow transition-transform mx-0.5 ${(brand.active ?? true) ? 'translate-x-3' : 'translate-x-0'}`} />
                        </button>
                        <button
                          onClick={() => openEdit(brand)}
                          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(brand.id)}
                          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Edit / Create panel ──
              Mobile: fixed drawer from bottom
              Desktop: sticky side panel
          ── */}
          {panelOpen && (
            <>
              {/* Mobile backdrop */}
              <div
                className="lg:hidden fixed inset-0 bg-black/40 z-30"
                onClick={() => setEditingId(null)}
              />

              <div className={`
                fixed lg:relative
                inset-x-0 lg:inset-auto bottom-0 lg:bottom-auto
                z-40 lg:z-auto
                w-full lg:w-[360px] xl:w-96
                max-h-[88vh] lg:max-h-[calc(100vh-7rem)]
                overflow-y-auto
                bg-white
                border-t lg:border border-gray-200
                shadow-2xl lg:shadow-none
                lg:flex-shrink-0 lg:self-start lg:sticky lg:top-28
              `}>

                {/* Drag handle (mobile only) */}
                <div className="lg:hidden flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 bg-gray-200 rounded-full" />
                </div>

                {/* Panel header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <span className="text-xs uppercase tracking-widest text-gray-700">
                    {editingId === 'new' ? (t.brands.newBrand ?? 'Новый бренд') : (t.brands.editBrand ?? 'Редактировать')}
                  </span>
                  <button onClick={() => setEditingId(null)} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-black">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Form body */}
                <div className="px-4 py-4 space-y-4">

                  {/* Logo */}
                  <LogoUpload value={form.logo_url} onChange={url => set('logo_url', url || null)} />

                  {/* Name + Slug */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Field label={`${t.brands.brandName ?? 'Название'} *`}>
                        <input value={form.name} onChange={e => set('name', e.target.value)}
                          placeholder="TECHNOGYM" className={inp} />
                      </Field>
                    </div>
                    <div className="col-span-2">
                      <Field label="Slug (URL) *">
                        <input value={form.slug}
                          onChange={e => { setSlugManual(true); set('slug', toSlug(e.target.value)); }}
                          placeholder="technogym" className={`${inp} font-mono`} />
                        <p className="text-[9px] text-gray-400 mt-0.5">/brands/<strong>{form.slug || '…'}</strong></p>
                      </Field>
                    </div>
                  </div>

                  {/* Descriptions */}
                  <Section title={t.brands.descriptions ?? 'Описание'}>
                    <Field label="Descriere RO">
                      <textarea value={form.description_ro ?? ''} onChange={e => set('description_ro', e.target.value)} rows={2} className={ta} />
                    </Field>
                    <Field label="Описание RU">
                      <textarea value={form.description_ru ?? ''} onChange={e => set('description_ru', e.target.value)} rows={2} className={ta} />
                    </Field>
                  </Section>

                  {/* Country + Founded */}
                  <Section title={t.brands.countryInfo ?? 'Страна / Год'} defaultOpen={false}>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Țara (RO)">
                        <input value={form.country_ro ?? ''} onChange={e => set('country_ro', e.target.value)} placeholder="Italia" className={inp} />
                      </Field>
                      <Field label="Страна (RU)">
                        <input value={form.country_ru ?? ''} onChange={e => set('country_ru', e.target.value)} placeholder="Италия" className={inp} />
                      </Field>
                      <Field label="Flag emoji">
                        <input value={form.country_flag ?? ''} onChange={e => set('country_flag', e.target.value)} placeholder="🇮🇹" className={inp} />
                      </Field>
                      <Field label={t.brands.founded ?? 'Год осн.'}>
                        <input type="number" value={form.founded ?? ''} onChange={e => set('founded', e.target.value ? Number(e.target.value) : null)} placeholder="1983" className={inp} />
                      </Field>
                    </div>
                  </Section>

                  {/* Segment + Website */}
                  <Section title={t.brands.segment ?? 'Сегмент / Сайт'} defaultOpen={false}>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Segment RO">
                        <input value={form.segment_ro ?? ''} onChange={e => set('segment_ro', e.target.value)} placeholder="Premium comercial" className={inp} />
                      </Field>
                      <Field label="Segment RU">
                        <input value={form.segment_ru ?? ''} onChange={e => set('segment_ru', e.target.value)} placeholder="Коммерческий" className={inp} />
                      </Field>
                    </div>
                    <Field label="Website">
                      <input value={form.website ?? ''} onChange={e => set('website', e.target.value)} placeholder="technogym.com" className={inp} />
                    </Field>
                    <Field label="URL Website">
                      <input value={form.website_url ?? ''} onChange={e => set('website_url', e.target.value)} placeholder="https://technogym.com" className={inp} />
                    </Field>
                  </Section>

                  {/* Banners */}
                  <Section title={t.brands.banners ?? 'Баннеры'} defaultOpen={false}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Monitor className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest">Desktop</span>
                    </div>
                    <BannerUpload value={form.banner_desktop_url} onChange={url => set('banner_desktop_url', url)} label="Banner Desktop" hint="1920×480px" />
                    <div className="flex items-center gap-1.5 mt-3 mb-1">
                      <Smartphone className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest">Mobile</span>
                    </div>
                    <BannerUpload value={form.banner_mobile_url} onChange={url => set('banner_mobile_url', url)} label="Banner Mobile" hint="800×600px" />
                  </Section>

                  {/* PDF Catalog */}
                  <Section title="PDF Каталог" defaultOpen={false}>
                    <Field label="URL PDF Каталога">
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={form.catalog_pdf ?? ''}
                          onChange={e => set('catalog_pdf', e.target.value || null)}
                          placeholder="https://example.com/catalog.pdf"
                          className={inp}
                        />
                        <p className="text-[9px] text-gray-400 leading-relaxed">
                          <FileText className="w-2.5 h-2.5 inline mr-0.5" />
                          Если указан PDF — на странице товара появится кнопка скачивания каталога бренда.
                        </p>
                        {form.catalog_pdf && (
                          <a
                            href={form.catalog_pdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[10px] text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            <FileText className="w-3 h-3" />
                            Открыть PDF
                          </a>
                        )}
                      </div>
                    </Field>
                  </Section>

                  {/* Error */}
                  {saveErr && (
                    <div className="flex items-start gap-2 text-red-500 bg-red-50 px-3 py-2">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <p className="text-[10px] leading-relaxed">{saveErr}</p>
                    </div>
                  )}

                  {/* Save */}
                  <button
                    onClick={handleSave} disabled={saving}
                    className="w-full flex items-center justify-center gap-2 bg-black text-white text-xs py-3 hover:bg-gray-800 disabled:opacity-50 transition-colors"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    {saving ? (t.brands.saving ?? 'Сохранение…') : editingId === 'new' ? (t.brands.create ?? 'Создать бренд') : (t.brands.save ?? 'Сохранить')}
                  </button>

                  {/* Extra bottom padding for mobile so Save isn't under nav */}
                  <div className="h-4 lg:h-0" />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Delete modal ── */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-sm p-6 border-t sm:border border-gray-200">
            <h3 className="text-sm text-black mb-2">{t.brands.deleteConfirm ?? 'Удалить бренд?'}</h3>
            <p className="text-xs text-gray-500 mb-5">
              Это действие необратимо. Товары бренда удалены не будут.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete} disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white text-xs py-2.5 hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                {deleting ? '…' : (t.brands.delete ?? 'Удалить')}
              </button>
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 border border-gray-200 text-gray-600 text-xs py-2.5 hover:border-black hover:text-black transition-colors"
              >
                {t.common.cancel ?? 'Отмена'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
