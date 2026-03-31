import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { categories as staticCategories } from '../data/products';
import { useCategoriesContext } from '../contexts/CategoriesContext';
import {
  Plus, Pencil, Trash2, X, Check, Loader2,
  ChevronDown, ChevronRight, AlertCircle, Upload,
  FolderOpen, Folder, Tag, RefreshCw,
} from 'lucide-react';
import { useAdminLang } from '../contexts/AdminLangContext';
import {
  categoryIconOptions,
  getCategoryIcon,
} from '../lib/category-icons';

// ─── Types ────────────────────────────────────────────────────────────────────
interface CatRow {
  id: string;
  slug: string;
  active?: boolean;
  name_ro: string;
  name_ru: string;
  description_ro: string | null;
  description_ru: string | null;
  icon?: string | null;
  sort_order: number;
}

interface SubRow {
  id: string;
  category_slug: string;
  slug: string;
  name_ro: string;
  name_ru: string;
  sort_order: number;
}

type PanelMode =
  | { type: 'new-cat' }
  | { type: 'edit-cat'; row: CatRow }
  | { type: 'new-sub'; catSlug: string; catName: string }
  | { type: 'edit-sub'; row: SubRow; catName: string }
  | null;

// ─── Slug helper ──────────────────────────────────────────────────────────────
function toSlug(s: string): string {
  return s.toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[șş]/g, 's').replace(/[țţ]/g, 't')
    .replace(/[ăâ]/g, 'a').replace(/[î]/g, 'i')
    .replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

// ─── SQL setup string ─────────────────────────────────────────────────────────
const SQL_SETUP = `ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS icon text;
NOTIFY pgrst, 'reload schema';

-- Categorii
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  active boolean DEFAULT true,
  name_ro text NOT NULL,
  name_ru text NOT NULL,
  description_ro text,
  description_ru text,
  icon text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Allow all'
  ) THEN
    CREATE POLICY "Allow all" ON public.categories FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Subcategorii
CREATE TABLE IF NOT EXISTS public.subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_slug text NOT NULL,
  slug text NOT NULL,
  name_ro text NOT NULL,
  name_ru text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(category_slug, slug)
);
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'subcategories' AND policyname = 'Allow all'
  ) THEN
    CREATE POLICY "Allow all" ON public.subcategories FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;`;

// ─── Main component ───────────────────────────────────────────────────────────
export function AdminCategories() {
  const { refetchCategories } = useCategoriesContext();
  const { t } = useAdminLang();

  const [cats, setCats] = useState<CatRow[]>([]);
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});

  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [panel, setPanel] = useState<PanelMode>(null);

  const [form, setForm] = useState({ name_ro: '', name_ru: '', slug: '', description_ro: '', description_ru: '', icon: '' });
  const [slugManual, setSlugManual] = useState(false);
  const [iconSearch, setIconSearch] = useState('');
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{ type: 'cat' | 'sub'; id: string; name: string; count?: number } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [sqlCopied, setSqlCopied] = useState(false);
  const [populating, setPopulating] = useState(false);

  // ── Load data ──────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setDbError(null);

    const { data: catData, error: catErr } = await supabase
      .from('categories').select('*').order('sort_order').order('name_ro');

    if (catErr) {
      setDbError(catErr.message);
      setLoading(false);
      return;
    }

    const { data: subData } = await supabase
      .from('subcategories').select('*').order('sort_order').order('name_ro');

    // Product counts per category
    const { data: countData } = await supabase
      .from('products').select('category').eq('active', true);

    const counts: Record<string, number> = {};
    (countData || []).forEach((r: { category: string }) => {
      counts[r.category] = (counts[r.category] || 0) + 1;
    });

    setCats((catData || []) as CatRow[]);
    setSubs((subData || []) as SubRow[]);
    setProductCounts(counts);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleCategoryActive = async (cat: CatRow) => {
    const next = !(cat.active ?? true);
    const { error } = await supabase.from('categories').update({ active: next }).eq('id', cat.id);
    if (error) {
      setDbError(error.message);
    } else {
      await loadData();
      refetchCategories();
    }
  };

  // ── Auto-slug ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!slugManual && (panel?.type === 'new-cat' || panel?.type === 'new-sub')) {
      setForm(f => ({ ...f, slug: toSlug(f.name_ro) }));
    }
  }, [form.name_ro, slugManual, panel?.type]);

  // ── Open panel helpers ─────────────────────────────────────────────────────
  const openNewCat = () => {
    setForm({ name_ro: '', name_ru: '', slug: '', description_ro: '', description_ru: '', icon: 'sporto' });
    setSlugManual(false);
    setIconSearch('');
    setIsIconPickerOpen(false);
    setSaveErr(null);
    setPanel({ type: 'new-cat' });
  };

  const openEditCat = (row: CatRow) => {
    setForm({
      name_ro: row.name_ro,
      name_ru: row.name_ru,
      slug: row.slug,
      description_ro: row.description_ro || '',
      description_ru: row.description_ru || '',
      icon: row.icon || '',
    });
    setSlugManual(true);
    setIconSearch('');
    setIsIconPickerOpen(false);
    setSaveErr(null);
    setPanel({ type: 'edit-cat', row });
  };

  const openNewSub = (catSlug: string, catName: string) => {
    setForm({ name_ro: '', name_ru: '', slug: '', description_ro: '', description_ru: '', icon: '' });
    setSlugManual(false);
    setIconSearch('');
    setIsIconPickerOpen(false);
    setSaveErr(null);
    setPanel({ type: 'new-sub', catSlug, catName });
  };

  const openEditSub = (row: SubRow, catName: string) => {
    setForm({ name_ro: row.name_ro, name_ru: row.name_ru, slug: row.slug, description_ro: '', description_ru: '', icon: '' });
    setSlugManual(true);
    setIconSearch('');
    setIsIconPickerOpen(false);
    setSaveErr(null);
    setPanel({ type: 'edit-sub', row, catName });
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name_ro.trim()) { setSaveErr('Câmpul Denumire RO este obligatoriu.'); return; }
    if (!form.name_ru.trim()) { setSaveErr('Câmpul Denumire RU este obligatoriu.'); return; }
    if (!form.slug.trim()) { setSaveErr('Slug-ul este obligatoriu.'); return; }
    setSaving(true);
    setSaveErr(null);

    if (panel?.type === 'new-cat') {
      const { error } = await supabase.from('categories').insert([{
        slug: form.slug.trim(),
        active: true,
        name_ro: form.name_ro.trim(),
        name_ru: form.name_ru.trim(),
        description_ro: form.description_ro.trim() || null,
        description_ru: form.description_ru.trim() || null,
        icon: form.icon.trim() || null,
        sort_order: cats.length,
      }]);
      if (error) { setSaveErr(error.message); setSaving(false); return; }
    }

    if (panel?.type === 'edit-cat') {
      const old = panel.row;
      const payload: Record<string, unknown> = {
        name_ro: form.name_ro.trim(),
        name_ru: form.name_ru.trim(),
        description_ro: form.description_ro.trim() || null,
        description_ru: form.description_ru.trim() || null,
        icon: form.icon.trim() || null,
      };
      // If slug changed → batch update products + subcategories
      if (form.slug.trim() !== old.slug) {
        const newSlug = form.slug.trim();
        payload.slug = newSlug;
        // update products
        await supabase.from('products').update({ category: newSlug }).eq('category', old.slug);
        // update subcategories parent ref
        await supabase.from('subcategories').update({ category_slug: newSlug }).eq('category_slug', old.slug);
      }
      const { error } = await supabase.from('categories').update(payload).eq('id', old.id);
      if (error) { setSaveErr(error.message); setSaving(false); return; }
    }

    if (panel?.type === 'new-sub') {
      const { error } = await supabase.from('subcategories').insert([{
        category_slug: panel.catSlug,
        slug: form.slug.trim(),
        name_ro: form.name_ro.trim(),
        name_ru: form.name_ru.trim(),
        sort_order: subs.filter(s => s.category_slug === panel.catSlug).length,
      }]);
      if (error) { setSaveErr(error.message); setSaving(false); return; }
    }

    if (panel?.type === 'edit-sub') {
      const old = panel.row;
      const payload: Record<string, unknown> = {
        name_ro: form.name_ro.trim(),
        name_ru: form.name_ru.trim(),
      };
      if (form.slug.trim() !== old.slug) {
        const newSlug = form.slug.trim();
        payload.slug = newSlug;
        // update products subcategory field
        await supabase.from('products')
          .update({ subcategory: newSlug })
          .eq('category', old.category_slug)
          .eq('subcategory', old.slug);
      }
      const { error } = await supabase.from('subcategories').update(payload).eq('id', old.id);
      if (error) { setSaveErr(error.message); setSaving(false); return; }
    }

    setSaving(false);
    setPanel(null);
    await loadData();
    refetchCategories();
  };

  const visibleIconOptions = categoryIconOptions.filter(option => {
    const term = iconSearch.trim().toLowerCase();
    if (!term) return true;
    return option.label.toLowerCase().includes(term) || option.theme.toLowerCase().includes(term);
  });

  const iconSections = visibleIconOptions.reduce<Record<string, typeof categoryIconOptions>>((groups, option) => {
    const section = groups[option.theme] ?? [];
    section.push(option);
    groups[option.theme] = section;
    return groups;
  }, {});

  const selectedIcon = getCategoryIcon(form.icon);

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    if (deleteTarget.type === 'cat') {
      await supabase.from('subcategories').delete().eq('category_slug',
        cats.find(c => c.id === deleteTarget.id)?.slug || '');
      await supabase.from('categories').delete().eq('id', deleteTarget.id);
    } else {
      await supabase.from('subcategories').delete().eq('id', deleteTarget.id);
    }
    setDeleting(false);
    setDeleteTarget(null);
    if (panel) setPanel(null);
    await loadData();
    refetchCategories();
  };

  // ── Populate from static ───────────────────────────────────────────────────
  const populateFromStatic = async () => {
    setPopulating(true);
    for (let i = 0; i < staticCategories.length; i++) {
      const cat = staticCategories[i];
      const { error: catErr } = await supabase.from('categories').upsert([{
        slug: cat.id,
        name_ro: cat.name.ro,
        name_ru: cat.name.ru,
        description_ro: cat.description.ro || null,
        description_ru: cat.description.ru || null,
        icon: null,
        sort_order: i,
      }], { onConflict: 'slug' });
      if (catErr) continue;
      for (let j = 0; j < cat.subcategories.length; j++) {
        const sub = cat.subcategories[j];
        await supabase.from('subcategories').upsert([{
          category_slug: cat.id,
          slug: sub.id,
          name_ro: sub.name.ro,
          name_ru: sub.name.ru,
          sort_order: j,
        }], { onConflict: 'category_slug,slug' });
      }
    }
    setPopulating(false);
    await loadData();
    refetchCategories();
  };

  // ── Copy SQL ───────────────────────────────────────────────────────────────
  const copySQL = () => {
    navigator.clipboard.writeText(SQL_SETUP).then(() => {
      setSqlCopied(true);
      setTimeout(() => setSqlCopied(false), 2500);
    });
  };

  // ── Panel title ────────────────────────────────────────────────────────────
  const panelTitle = () => {
    if (!panel) return '';
    if (panel.type === 'new-cat') return 'Categorie nouă';
    if (panel.type === 'edit-cat') return `Editare: ${panel.row.name_ro}`;
    if (panel.type === 'new-sub') return `Subcategorie nouă · ${panel.catName}`;
    if (panel.type === 'edit-sub') return `Editare subcategorie`;
    return '';
  };

  const isCatPanel = panel?.type === 'new-cat' || panel?.type === 'edit-cat';
  
console.log('categoryIconOptions:', categoryIconOptions.length);
console.log('first 3:', categoryIconOptions.slice(0, 3).map(o => o.key));
console.log('visible:', visibleIconOptions.length);
console.log('sections:', Object.keys(iconSections));
  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl text-black">Categorii & Subcategorii</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {cats.length} categorii · {subs.length} subcategorii ·{' '}
            <span className="text-gray-300">modificările se propagă automat pe site</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="flex items-center justify-center w-8 h-8 border border-gray-200 text-gray-400 hover:text-black hover:border-black transition-colors"
            title="Reîncarcă"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openNewCat}
            className="flex items-center gap-2 bg-black text-white text-xs px-4 py-2.5 hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Categorie nouă
          </button>
        </div>
      </div>

      {/* ── SQL Setup notice ── */}
      {dbError && (
        <div className="mb-6 border border-orange-200 bg-orange-50 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-orange-800 mb-1">
                Tabelele <code className="bg-orange-100 px-1">categories</code> și{' '}
                <code className="bg-orange-100 px-1">subcategories</code> nu există în Supabase.
              </p>
              <p className="text-[11px] text-orange-600 mb-3">
                Deschide <strong>Supabase Dashboard → SQL Editor</strong> și rulează SQL-ul de mai jos, apoi reîncarcă pagina.
              </p>
              <pre className="text-[10px] bg-white border border-orange-200 p-3 overflow-x-auto text-gray-700 leading-relaxed rounded whitespace-pre-wrap">
                {SQL_SETUP}
              </pre>
              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={copySQL}
                  className={`flex items-center gap-2 text-xs px-4 py-2 transition-colors ${sqlCopied ? 'bg-green-500 text-white' : 'bg-orange-600 text-white hover:bg-orange-700'
                    }`}
                >
                  {sqlCopied ? <Check className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
                  {sqlCopied ? 'Copiat!' : 'Copiază SQL'}
                </button>
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-orange-600 underline underline-offset-2 hover:text-orange-800"
                >
                  Deschide Supabase Dashboard →
                </a>
              </div>
              <p className="text-[10px] text-orange-500 mt-2">
                Eroare: <code className="bg-orange-100 px-1">{dbError}</code>
              </p>
            </div>
          </div>
        </div>
      )}

      {!dbError && (
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── Category list ── */}
          <div className="flex-1 min-w-0">
            <div className="flex border border-gray-200 bg-white w-fit mb-3">
              {(['all', 'active', 'inactive'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 h-8 text-xs transition-colors border-r last:border-0 border-gray-100 ${statusFilter === s ? 'bg-black text-white' : 'text-gray-500 hover:text-black'
                    }`}
                >
                  {s === 'all' ? 'Toate' : s === 'active' ? 'Active' : 'Inactive'}
                </button>
              ))}
            </div>

            {/* Populate from static button — shown when empty */}
            {!loading && cats.length === 0 && (
              <div className="border border-dashed border-gray-200 p-10 text-center mb-4">
                <FolderOpen className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-500 mb-4">
                  Baza de date este goală. Poți importa toate categoriile predefinite cu un click.
                </p>
                <button
                  onClick={populateFromStatic}
                  disabled={populating}
                  className="flex items-center gap-2 bg-black text-white text-xs px-5 py-2.5 hover:bg-gray-800 transition-colors mx-auto disabled:opacity-50"
                >
                  {populating
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Upload className="w-3.5 h-3.5" />}
                  {populating ? 'Se importă...' : 'Importă categoriile predefinite (12 cat. + subcategorii)'}
                </button>
              </div>
            )}

            {loading ? (
              <div className="flex items-center gap-2 py-12 text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs">Se încarcă...</span>
              </div>
            ) : (
              <div className="space-y-px">
                {cats.filter(cat => {
                  const enabled = cat.active ?? true;
                  return statusFilter === 'all'
                    || (statusFilter === 'active' && enabled)
                    || (statusFilter === 'inactive' && !enabled);
                }).map(cat => {
                  const catSubs = subs.filter(s => s.category_slug === cat.slug);
                  const prodCount = productCounts[cat.slug] || 0;
                  const isExpanded = expandedCat === cat.id;
                  const isActive = (panel?.type === 'edit-cat' && panel.row.id === cat.id)
                    || (panel?.type === 'new-sub' && panel.catSlug === cat.slug);

                  return (
                    <div key={cat.id}>
                      {/* ── Category row ── */}
                      <div
                        className={`flex items-center gap-3 px-3 py-3 bg-white border transition-colors ${isActive ? 'border-black' : 'border-transparent hover:border-gray-200'
                          }`}
                      >
                        {/* Expand toggle */}
                        <button
                          onClick={() => setExpandedCat(isExpanded ? null : cat.id)}
                          className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-black transition-colors"
                        >
                          {isExpanded
                            ? <ChevronDown className="w-3.5 h-3.5" />
                            : <ChevronRight className="w-3.5 h-3.5" />}
                        </button>

                        {/* Folder icon */}
                        <div className="flex-shrink-0">
                          {isExpanded
                            ? <FolderOpen className="w-4 h-4 text-gray-400" />
                            : <Folder className="w-4 h-4 text-gray-300" />}
                        </div>

                        {/* Names */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-black">{cat.name_ro}</span>
                            <span className="text-[10px] text-gray-400">/</span>
                            <span className="text-[10px] text-gray-500">{cat.name_ru}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <code className="text-[9px] text-gray-300 bg-gray-50 px-1.5 py-0.5">{cat.slug}</code>
                            <span className="text-[9px] text-gray-300">{catSubs.length} sub.</span>
                          </div>
                        </div>

                        {/* Product count */}
                        <div className="flex-shrink-0 text-center">
                          <div className={`text-xs tabular-nums px-2 py-0.5 ${prodCount > 0 ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'
                            }`}>
                            {prodCount}
                          </div>
                          <div className="text-[9px] text-gray-400 mt-0.5">produse</div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => toggleCategoryActive(cat)}
                            className={`w-8 h-5 rounded-full transition-colors flex items-center ${(cat.active ?? true) ? 'bg-black' : 'bg-gray-200'}`}
                            title={(cat.active ?? true) ? 'Ascunde de pe site' : 'Arată pe site'}
                          >
                            <span className={`w-3.5 h-3.5 bg-white rounded-full shadow transition-transform mx-0.5 ${(cat.active ?? true) ? 'translate-x-3' : 'translate-x-0'}`} />
                          </button>
                          <button
                            onClick={() => openNewSub(cat.slug, cat.name_ro)}
                            className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-black hover:bg-gray-100 transition-colors"
                            title="Adaugă subcategorie"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => openEditCat(cat)}
                            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100 transition-colors"
                            title="Editează"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget({
                              type: 'cat',
                              id: cat.id,
                              name: cat.name_ro,
                              count: prodCount,
                            })}
                            className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Șterge"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* ── Subcategory rows (expanded) ── */}
                      {isExpanded && (
                        <div className="ml-6 border-l border-gray-100 space-y-px">
                          {catSubs.length === 0 ? (
                            <div className="px-4 py-3 text-[11px] text-gray-400 italic">
                              Nicio subcategorie
                            </div>
                          ) : (
                            catSubs.map(sub => {
                              const isSubActive = panel?.type === 'edit-sub' && panel.row.id === sub.id;
                              return (
                                <div
                                  key={sub.id}
                                  className={`flex items-center gap-3 px-3 py-2.5 bg-white border transition-colors ${isSubActive ? 'border-black' : 'border-transparent hover:border-gray-100'
                                    }`}
                                >
                                  <Tag className="w-3 h-3 text-gray-200 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs text-gray-700">{sub.name_ro}</span>
                                      <span className="text-[10px] text-gray-300">/</span>
                                      <span className="text-[10px] text-gray-400">{sub.name_ru}</span>
                                    </div>
                                    <code className="text-[9px] text-gray-300 bg-gray-50 px-1.5 py-0.5">{sub.slug}</code>
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <button
                                      onClick={() => openEditSub(sub, cat.name_ro)}
                                      className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100 transition-colors"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => setDeleteTarget({ type: 'sub', id: sub.id, name: sub.name_ro })}
                                      className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                          {/* Add subcategory shortcut */}
                          <button
                            onClick={() => openNewSub(cat.slug, cat.name_ro)}
                            className="flex items-center gap-2 px-3 py-2 text-[11px] text-gray-400 hover:text-black hover:bg-gray-50 transition-colors w-full text-left"
                          >
                            <Plus className="w-3 h-3" />
                            Adaugă subcategorie
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Edit / Create panel ── */}
          {panel && (
            <div className="w-80 flex-shrink-0 bg-white border border-gray-200 p-5 space-y-4 self-start sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">

              {/* Panel header */}
              <div className="flex items-center justify-between">
                <h2 className="text-xs uppercase tracking-widest text-black leading-tight">
                  {panelTitle()}
                </h2>
                <button onClick={() => setPanel(null)} className="text-gray-400 hover:text-black flex-shrink-0 ml-2">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Parent category badge (for subcategories) */}
              {(panel.type === 'new-sub' || panel.type === 'edit-sub') && (
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 px-3 py-2">
                  <Folder className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-[11px] text-gray-500">
                    {panel.type === 'new-sub' ? panel.catName : panel.catName}
                  </span>
                </div>
              )}

              {/* Name RO */}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-400 block mb-1">
                  Denumire RO <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.name_ro}
                  onChange={e => setForm(f => ({ ...f, name_ro: e.target.value }))}
                  placeholder={isCatPanel ? 'ex: Aparate Cardio' : 'ex: Bandă de Alergat'}
                  className="w-full h-9 px-3 text-xs border border-gray-200 focus:outline-none focus:border-black"
                />
              </div>

              {/* Name RU */}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-400 block mb-1">
                  Denumire RU <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.name_ru}
                  onChange={e => setForm(f => ({ ...f, name_ru: e.target.value }))}
                  placeholder={isCatPanel ? 'пр: Кардио Тренажеры' : 'пр: Беговая дорожка'}
                  className="w-full h-9 px-3 text-xs border border-gray-200 focus:outline-none focus:border-black"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-400 block mb-1">
                  Slug (ID intern)
                  {(panel.type === 'edit-cat' || panel.type === 'edit-sub') && (
                    <span className="ml-2 text-amber-500 normal-case">— modificarea actualizează produsele!</span>
                  )}
                </label>
                <input
                  value={form.slug}
                  onChange={e => { setSlugManual(true); setForm(f => ({ ...f, slug: toSlug(e.target.value) })); }}
                  placeholder="ex: aparate-cardio"
                  className="w-full h-9 px-3 text-xs border border-gray-200 focus:outline-none focus:border-black font-mono"
                />
                <p className="text-[9px] text-gray-400 mt-0.5">
                  {panel.type === 'new-cat' || panel.type === 'edit-cat'
                    ? 'Identificator unic al categoriei — se generează automat din Denumire RO'
                    : 'Identificator unic al subcategoriei'}
                </p>
              </div>

              {/* Иконка — заменяет весь блок от <div> с "Iconă categorie" до конца isIconPickerOpen */}
              {isCatPanel && (
                <>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gray-400 block mb-2">
                      Iconă categorie
                    </label>

                    {/* Trigger кнопка */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsIconPickerOpen(v => !v)}
                        className={`flex items-center gap-2.5 px-3 h-9 border text-xs transition-colors w-full ${isIconPickerOpen
                            ? 'border-black text-black'
                            : 'border-gray-200 text-gray-500 hover:border-black hover:text-black'
                          }`}
                      >
                        <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                          {selectedIcon || <Tag className="w-4 h-4" />}
                        </span>
                        <span className="flex-1 text-left truncate">
                          {form.icon || 'Alege iconița...'}
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${isIconPickerOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Дропдаун */}
                      {isIconPickerOpen && (
                        <>
                          {/* Backdrop */}
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsIconPickerOpen(false)}
                          />

                          <div className="absolute left-0 top-full mt-1 z-50 w-72 bg-white border border-black shadow-lg">
                            {/* Поиск */}
                            <div className="p-2 border-b border-gray-200">
                              <input
                                autoFocus
                                value={iconSearch}
                                onChange={e => setIconSearch(e.target.value)}
                                placeholder="Caută iconițe..."
                                className="w-full h-8 px-2.5 text-xs border border-gray-200 focus:outline-none focus:border-black"
                              />
                            </div>

                            {/* Сетка */}
                            <div className="max-h-64 overflow-y-auto p-2 space-y-3">
                              {Object.entries(iconSections).length === 0 ? (
                                <p className="text-[11px] text-gray-400 text-center py-4">Nu s-au găsit iconițe</p>
                              ) : (
                                Object.entries(iconSections).map(([section, options]) => (
                                  <div key={section}>
                                    <div className="text-[9px] uppercase tracking-widest text-gray-300 mb-1.5 px-0.5">
                                      {section}
                                    </div>
                                    <div className="grid grid-cols-7 gap-1">
                                      {options.map(option => {
                                        const selected = form.icon === option.key;
                                        return (
                                          <button
                                            key={option.key}
                                            type="button"
                                            title={option.label}
                                            onClick={() => {
                                              setForm(f => ({ ...f, icon: option.key }));
                                              setIsIconPickerOpen(false);
                                            }}
                                            className={`flex h-8 w-8 items-center justify-center border transition-colors ${selected
                                                ? 'border-black bg-black text-white'
                                                : 'border-transparent text-gray-400 hover:border-gray-300 hover:text-black'
                                              }`}
                                          >
                                            {option.icon}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>

                            {/* Footer — сброс */}
                            {form.icon && (
                              <div className="border-t border-gray-100 p-2">
                                <button
                                  type="button"
                                  onClick={() => { setForm(f => ({ ...f, icon: '' })); setIsIconPickerOpen(false); }}
                                  className="w-full text-[10px] text-gray-400 hover:text-red-500 transition-colors py-1"
                                >
                                  Elimină iconița
                                </button>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Error */}
              {saveErr && (
                <p className="text-[11px] text-red-500 bg-red-50 border border-red-200 px-3 py-2">
                  {saveErr}
                </p>
              )}

              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-black text-white text-xs py-2.5 hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  {saving ? 'Se salvează...' : 'Salvează'}
                </button>
                <button
                  onClick={() => setPanel(null)}
                  className="flex items-center justify-center w-10 border border-gray-200 text-gray-400 hover:text-black hover:border-black transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Delete confirmation modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white p-6 w-80 shadow-2xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 bg-red-50 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-black mb-1">
                  Ștergi <strong>{deleteTarget.name}</strong>?
                </p>
                {deleteTarget.type === 'cat' && (deleteTarget.count ?? 0) > 0 && (
                  <p className="text-[11px] text-amber-600">
                    Atenție: {deleteTarget.count} produse au această categorie. Produsele nu se șterg, dar categoria lor va rămâne fără titlu.
                  </p>
                )}
                {deleteTarget.type === 'cat' && (
                  <p className="text-[11px] text-gray-400 mt-1">
                    Toate subcategoriile vor fi șterse automat.
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white text-xs py-2.5 hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                {deleting ? 'Se șterge...' : 'Da, șterge'}
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 text-xs border border-gray-200 py-2.5 text-gray-500 hover:border-black hover:text-black transition-colors"
              >
                Anulează
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

  );
}
