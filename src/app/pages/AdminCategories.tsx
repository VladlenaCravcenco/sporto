import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { categories as staticCategories } from '../data/products';
import { useCategoriesContext } from '../contexts/CategoriesContext';
import {
  Plus, Pencil, Trash2, X, Check, Loader2,
  ChevronDown, ChevronRight, AlertCircle, Upload,
  FolderOpen, Folder, Tag, RefreshCw, Search,
} from 'lucide-react';
import { useAdminLang } from '../contexts/AdminLangContext';
import { categoryIconOptions, getCategoryIcon } from '../lib/category-icons';

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

type EditMode =
  | { type: 'new-cat' }
  | { type: 'edit-cat'; row: CatRow }
  | { type: 'new-sub'; catSlug: string; catName: string }
  | { type: 'edit-sub'; row: SubRow; catSlug: string; catName: string }
  | null;

type FormState = {
  name_ro: string; name_ru: string; slug: string;
  description_ro: string; description_ru: string; icon: string;
};

function toSlug(s: string): string {
  return s.toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[șş]/g, 's').replace(/[țţ]/g, 't')
    .replace(/[ăâ]/g, 'a').replace(/[î]/g, 'i')
    .replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

const SQL_SETUP = `ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS icon text;
NOTIFY pgrst, 'reload schema';`;

// ─── useIsMobile ──────────────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return isMobile;
}

// ─── IconPicker ───────────────────────────────────────────────────────────────
function IconPicker({ value, onChange }: { value: string; onChange: (key: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const isMobile = useIsMobile();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || isMobile) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open, isMobile]);

  useEffect(() => {
    if (isMobile && open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isMobile, open]);

  const visible = categoryIconOptions.filter(o => {
    const term = search.trim().toLowerCase();
    return !term || o.label.toLowerCase().includes(term) || o.theme.toLowerCase().includes(term);
  });

  const sections = visible.reduce<Record<string, typeof categoryIconOptions>>((acc, o) => {
    (acc[o.theme] = acc[o.theme] ?? []).push(o);
    return acc;
  }, {});

  const selectedIcon = getCategoryIcon(value);

  const IconGrid = ({ cols = 8 }: { cols?: number }) => (
    <div className="flex-1 overflow-y-auto p-3 space-y-4">
      {Object.entries(sections).length === 0 ? (
        <p className="text-[11px] text-gray-400 text-center py-8">Nu s-au găsit iconițe</p>
      ) : Object.entries(sections).map(([section, opts]) => (
        <div key={section}>
          <div className="text-[9px] uppercase tracking-widest text-gray-300 mb-2">{section}</div>
          <div className={`grid gap-0.5`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {opts.map(opt => (
              <button
                key={opt.key}
                type="button"
                title={opt.label}
                onClick={() => { onChange(opt.key); setOpen(false); setSearch(''); }}
                className={`flex h-9 w-full items-center justify-center border transition-colors ${
                  value === opt.key
                    ? 'border-black bg-black text-white'
                    : 'border-transparent text-gray-400 hover:border-gray-200 hover:text-black'
                }`}
              >
                {opt.icon}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const SearchBar = ({ className = '' }: { className?: string }) => (
    <div className={`flex items-center gap-2 border border-gray-200 px-3 focus-within:border-black ${className}`}>
      <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
      <input
        autoFocus
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Caută iconițe..."
        className="flex-1 text-xs py-2 focus:outline-none bg-transparent"
      />
      {search && (
        <button onClick={() => setSearch('')}>
          <X className="w-3 h-3 text-gray-400 hover:text-black" />
        </button>
      )}
    </div>
  );

  const ClearBtn = () => value ? (
    <div className="border-t border-gray-100 p-2 flex-shrink-0">
      <button
        type="button"
        onClick={() => { onChange(''); setOpen(false); }}
        className="w-full text-[10px] text-gray-400 hover:text-red-500 transition-colors py-1.5 border border-gray-100 hover:border-red-200"
      >
        Elimină iconița
      </button>
    </div>
  ) : null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(v => !v); setSearch(''); }}
        className={`flex items-center gap-2 px-3 h-9 border text-xs w-full text-left transition-colors ${
          open ? 'border-black text-black' : 'border-gray-200 text-gray-500 hover:border-black hover:text-black'
        }`}
      >
        <span className="w-4 h-4 flex items-center justify-center flex-shrink-0 text-gray-700">
          {selectedIcon || <Tag className="w-4 h-4 text-gray-400" />}
        </span>
        <span className="flex-1 truncate text-gray-600">{value || 'Alege iconița...'}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Mobile fullscreen */}
      {isMobile && open && (
        <div className="fixed inset-0 z-[600] flex flex-col bg-white">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-shrink-0">
            <span className="text-xs uppercase tracking-widest text-black">Alege iconița</span>
            <button onClick={() => { setOpen(false); setSearch(''); }} className="text-gray-400 hover:text-black p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="px-3 py-2 border-b border-gray-100 flex-shrink-0">
            <SearchBar />
          </div>
          <IconGrid cols={9} />
          <ClearBtn />
        </div>
      )}

      {/* Desktop dropdown */}
      {!isMobile && open && (
        <div className="absolute left-0 top-full mt-1 z-[200] w-80 bg-white border border-black shadow-xl flex flex-col" style={{ maxHeight: '320px' }}>
          <div className="p-2 border-b border-gray-100 flex-shrink-0">
            <SearchBar className="h-8" />
          </div>
          <IconGrid cols={8} />
          <ClearBtn />
        </div>
      )}
    </div>
  );
}

// ─── EditForm ─────────────────────────────────────────────────────────────────
function EditForm({
  mode, isCat, onSave, onCancel, saving, saveErr,
}: {
  mode: EditMode; isCat: boolean;
  onSave: (form: FormState) => void; onCancel: () => void;
  saving: boolean; saveErr: string | null;
}) {
  const isNew = mode?.type === 'new-cat' || mode?.type === 'new-sub';
  const initial: FormState = (() => {
    if (mode?.type === 'edit-cat') return {
      name_ro: mode.row.name_ro, name_ru: mode.row.name_ru, slug: mode.row.slug,
      description_ro: mode.row.description_ro || '', description_ru: mode.row.description_ru || '',
      icon: mode.row.icon || '',
    };
    if (mode?.type === 'edit-sub') return {
      name_ro: mode.row.name_ro, name_ru: mode.row.name_ru, slug: mode.row.slug,
      description_ro: '', description_ru: '', icon: '',
    };
    return { name_ro: '', name_ru: '', slug: '', description_ro: '', description_ru: '', icon: '' };
  })();

  const [form, setForm] = useState<FormState>(initial);
  const [slugManual, setSlugManual] = useState(!isNew);
  const isEditSlug = mode?.type === 'edit-cat' || mode?.type === 'edit-sub';

  useEffect(() => {
    if (!slugManual && isNew) setForm(f => ({ ...f, slug: toSlug(f.name_ro) }));
  }, [form.name_ro, slugManual, isNew]);

  const field = (label: string, node: React.ReactNode, hint?: string) => (
    <div>
      <label className="text-[9px] uppercase tracking-widest text-gray-400 block mb-1">{label}</label>
      {node}
      {hint && <p className="text-[9px] text-gray-300 mt-0.5">{hint}</p>}
    </div>
  );

  const input = (props: React.InputHTMLAttributes<HTMLInputElement> & { mono?: boolean }) => {
    const { mono, ...rest } = props;
    return (
      <input
        {...rest}
        className={`w-full h-9 px-3 text-xs border border-gray-200 bg-white focus:outline-none focus:border-black ${mono ? 'font-mono' : ''}`}
      />
    );
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {field('Denumire RO *',
          input({ autoFocus: true, value: form.name_ro, onChange: e => setForm(f => ({ ...f, name_ro: e.target.value })), placeholder: isCat ? 'ex: Aparate Cardio' : 'ex: Bandă de Alergat' })
        )}
        {field('Denumire RU *',
          input({ value: form.name_ru, onChange: e => setForm(f => ({ ...f, name_ru: e.target.value })), placeholder: isCat ? 'пр: Кардио Тренажеры' : 'пр: Беговая дорожка' })
        )}
      </div>

      <div className={`grid gap-3 ${isCat ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
        {field(
          isEditSlug ? 'Slug · actualizează produsele!' : 'Slug',
          input({ value: form.slug, mono: true, onChange: e => { setSlugManual(true); setForm(f => ({ ...f, slug: toSlug(e.target.value) })); }, placeholder: 'ex: aparate-cardio' }),
          !isEditSlug && isNew ? 'Se generează automat din Denumire RO' : undefined
        )}
        {isCat && field('Iconă',
          <IconPicker value={form.icon} onChange={icon => setForm(f => ({ ...f, icon }))} />
        )}
      </div>

      {isCat && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {field('Descriere RO',
            <textarea value={form.description_ro} onChange={e => setForm(f => ({ ...f, description_ro: e.target.value }))} rows={2} className="w-full px-3 py-2 text-xs border border-gray-200 bg-white focus:outline-none focus:border-black resize-none" />
          )}
          {field('Описание RU',
            <textarea value={form.description_ru} onChange={e => setForm(f => ({ ...f, description_ru: e.target.value }))} rows={2} className="w-full px-3 py-2 text-xs border border-gray-200 bg-white focus:outline-none focus:border-black resize-none" />
          )}
        </div>
      )}

      {saveErr && (
        <p className="text-[11px] text-red-500 bg-red-50 border border-red-200 px-3 py-2">{saveErr}</p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onSave(form)}
          disabled={saving}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-black text-white text-xs px-5 h-9 hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
          {saving ? 'Se salvează...' : 'Salvează'}
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 text-xs px-4 h-9 border border-gray-200 text-gray-500 hover:border-black hover:text-black transition-colors"
        >
          <X className="w-3 h-3" />
          <span className="hidden sm:inline">Anulează</span>
        </button>
      </div>
    </div>
  );
}

// ─── BottomSheet ──────────────────────────────────────────────────────────────
function BottomSheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 z-[400] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full max-h-[92vh] flex flex-col">
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-200" />
        </div>
        <div className="flex items-center justify-between px-4 pb-3 pt-1 flex-shrink-0 border-b border-gray-100">
          <span className="text-xs uppercase tracking-widest text-black">{title}</span>
          <button onClick={onClose} className="text-gray-400 hover:text-black p-1 -mr-1">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-4 py-4">{children}</div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function AdminCategories() {
  const { refetchCategories } = useCategoriesContext();
  const { t } = useAdminLang();
  const isMobile = useIsMobile();

  const [cats, setCats] = useState<CatRow[]>([]);
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'cat' | 'sub'; id: string; name: string; count?: number } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [populating, setPopulating] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true); setDbError(null);
    const { data: catData, error: catErr } = await supabase.from('categories').select('*').order('sort_order').order('name_ro');
    if (catErr) { setDbError(catErr.message); setLoading(false); return; }
    const { data: subData } = await supabase.from('subcategories').select('*').order('sort_order').order('name_ro');
    const { data: countData } = await supabase.from('products').select('category').eq('active', true);
    const counts: Record<string, number> = {};
    (countData || []).forEach((r: { category: string }) => { counts[r.category] = (counts[r.category] || 0) + 1; });
    setCats((catData || []) as CatRow[]);
    setSubs((subData || []) as SubRow[]);
    setProductCounts(counts);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleActive = async (cat: CatRow) => {
    await supabase.from('categories').update({ active: !(cat.active ?? true) }).eq('id', cat.id);
    await loadData(); refetchCategories();
  };

  const handleSave = async (form: FormState) => {
    if (!form.name_ro.trim()) { setSaveErr('Câmpul Denumire RO este obligatoriu.'); return; }
    if (!form.name_ru.trim()) { setSaveErr('Câmpul Denumire RU este obligatoriu.'); return; }
    if (!form.slug.trim()) { setSaveErr('Slug-ul este obligatoriu.'); return; }
    setSaving(true); setSaveErr(null);

    if (editMode?.type === 'new-cat') {
      const { error } = await supabase.from('categories').insert([{
        slug: form.slug.trim(), active: true, name_ro: form.name_ro.trim(), name_ru: form.name_ru.trim(),
        description_ro: form.description_ro.trim() || null, description_ru: form.description_ru.trim() || null,
        icon: form.icon.trim() || null, sort_order: cats.length,
      }]);
      if (error) { setSaveErr(error.message); setSaving(false); return; }
    }
    if (editMode?.type === 'edit-cat') {
      const old = editMode.row;
      const payload: Record<string, unknown> = {
        name_ro: form.name_ro.trim(), name_ru: form.name_ru.trim(),
        description_ro: form.description_ro.trim() || null, description_ru: form.description_ru.trim() || null,
        icon: form.icon.trim() || null,
      };
      if (form.slug.trim() !== old.slug) {
        payload.slug = form.slug.trim();
        await supabase.from('products').update({ category: form.slug.trim() }).eq('category', old.slug);
        await supabase.from('subcategories').update({ category_slug: form.slug.trim() }).eq('category_slug', old.slug);
      }
      const { error } = await supabase.from('categories').update(payload).eq('id', old.id);
      if (error) { setSaveErr(error.message); setSaving(false); return; }
    }
    if (editMode?.type === 'new-sub') {
      const { error } = await supabase.from('subcategories').insert([{
        category_slug: editMode.catSlug, slug: form.slug.trim(),
        name_ro: form.name_ro.trim(), name_ru: form.name_ru.trim(),
        sort_order: subs.filter(s => s.category_slug === editMode.catSlug).length,
      }]);
      if (error) { setSaveErr(error.message); setSaving(false); return; }
    }
    if (editMode?.type === 'edit-sub') {
      const old = editMode.row;
      const payload: Record<string, unknown> = { name_ro: form.name_ro.trim(), name_ru: form.name_ru.trim() };
      if (form.slug.trim() !== old.slug) {
        payload.slug = form.slug.trim();
        await supabase.from('products').update({ subcategory: form.slug.trim() }).eq('category', old.category_slug).eq('subcategory', old.slug);
      }
      const { error } = await supabase.from('subcategories').update(payload).eq('id', old.id);
      if (error) { setSaveErr(error.message); setSaving(false); return; }
    }

    setSaving(false); setEditMode(null);
    await loadData(); refetchCategories();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    if (deleteTarget.type === 'cat') {
      await supabase.from('subcategories').delete().eq('category_slug', cats.find(c => c.id === deleteTarget.id)?.slug || '');
      await supabase.from('categories').delete().eq('id', deleteTarget.id);
    } else {
      await supabase.from('subcategories').delete().eq('id', deleteTarget.id);
    }
    setDeleting(false); setDeleteTarget(null); setEditMode(null);
    await loadData(); refetchCategories();
  };

  const populateFromStatic = async () => {
    setPopulating(true);
    for (let i = 0; i < staticCategories.length; i++) {
      const cat = staticCategories[i];
      await supabase.from('categories').upsert([{ slug: cat.id, name_ro: cat.name.ro, name_ru: cat.name.ru, description_ro: cat.description.ro || null, description_ru: cat.description.ru || null, icon: null, sort_order: i }], { onConflict: 'slug' });
      for (let j = 0; j < cat.subcategories.length; j++) {
        const sub = cat.subcategories[j];
        await supabase.from('subcategories').upsert([{ category_slug: cat.id, slug: sub.id, name_ro: sub.name.ro, name_ru: sub.name.ru, sort_order: j }], { onConflict: 'category_slug,slug' });
      }
    }
    setPopulating(false); await loadData(); refetchCategories();
  };

  const openEdit = (mode: EditMode) => { setEditMode(mode); setSaveErr(null); };
  const closeEdit = () => { setEditMode(null); setSaveErr(null); };

  const isCatEdit = editMode?.type === 'new-cat' || editMode?.type === 'edit-cat';

  const sheetTitle = () => {
    if (!editMode) return '';
    if (editMode.type === 'new-cat') return 'Categorie nouă';
    if (editMode.type === 'edit-cat') return `Editare: ${editMode.row.name_ro}`;
    if (editMode.type === 'new-sub') return `Sub. nouă · ${editMode.catName}`;
    if (editMode.type === 'edit-sub') return 'Editare subcategorie';
    return '';
  };

  const filteredCats = cats.filter(cat => {
    const enabled = cat.active ?? true;
    return statusFilter === 'all' || (statusFilter === 'active' && enabled) || (statusFilter === 'inactive' && !enabled);
  });

  return (
    <div className="max-w-[900px] mx-auto px-3 sm:px-6 py-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-base sm:text-xl text-black">Categorii & Subcategorii</h1>
          <p className="text-[10px] text-gray-400 mt-0.5 hidden sm:block">
            {cats.length} categorii · {subs.length} subcategorii · modificările se propagă automat pe site
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadData} className="w-8 h-8 flex items-center justify-center border border-gray-200 text-gray-400 hover:text-black hover:border-black transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => openEdit({ type: 'new-cat' })} className="flex items-center gap-1.5 bg-black text-white text-xs px-3 sm:px-4 h-8 hover:bg-gray-800 transition-colors">
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Categorie nouă</span>
            <span className="sm:hidden">Nouă</span>
          </button>
        </div>
      </div>

      {/* DB error */}
      {dbError && (
        <div className="mb-5 border border-orange-200 bg-orange-50 p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-orange-800 mb-2">Tabelele nu există în Supabase.</p>
              <pre className="text-[10px] bg-white border border-orange-100 p-3 overflow-x-auto text-gray-700 whitespace-pre-wrap mb-3">{SQL_SETUP}</pre>
              <button
                onClick={() => { navigator.clipboard.writeText(SQL_SETUP).then(() => { setSqlCopied(true); setTimeout(() => setSqlCopied(false), 2500); }); }}
                className={`flex items-center gap-2 text-xs px-4 py-2 transition-colors ${sqlCopied ? 'bg-green-500 text-white' : 'bg-orange-600 text-white hover:bg-orange-700'}`}
              >
                {sqlCopied ? <Check className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
                {sqlCopied ? 'Copiat!' : 'Copiază SQL'}
              </button>
              <p className="text-[10px] text-orange-500 mt-2">Eroare: <code>{dbError}</code></p>
            </div>
          </div>
        </div>
      )}

      {!dbError && (
        <>
          {/* Filters */}
          <div className="flex border border-gray-200 w-fit mb-3">
            {(['all', 'active', 'inactive'] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 h-8 text-xs transition-colors border-r last:border-0 border-gray-100 ${statusFilter === s ? 'bg-black text-white' : 'text-gray-500 hover:text-black'}`}>
                {s === 'all' ? 'Toate' : s === 'active' ? 'Active' : 'Inactive'}
              </button>
            ))}
          </div>

          {/* Desktop: new cat form */}
          {!isMobile && editMode?.type === 'new-cat' && (
            <div className="mb-3 border border-black">
              <div className="px-4 py-2 bg-black">
                <span className="text-[9px] uppercase tracking-widest text-white">Categorie nouă</span>
              </div>
              <div className="p-4">
                <EditForm mode={editMode} isCat={true} onSave={handleSave} onCancel={closeEdit} saving={saving} saveErr={saveErr} />
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && cats.length === 0 && (
            <div className="border border-dashed border-gray-200 p-10 text-center">
              <FolderOpen className="w-8 h-8 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-4">Baza de date este goală.</p>
              <button onClick={populateFromStatic} disabled={populating} className="flex items-center gap-2 bg-black text-white text-xs px-5 py-2.5 hover:bg-gray-800 mx-auto disabled:opacity-50">
                {populating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {populating ? 'Se importă...' : 'Importă categoriile predefinite'}
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center gap-2 py-12 text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">Se încarcă...</span>
            </div>
          ) : (
            <div className="border border-gray-200 divide-y divide-gray-100">
              {filteredCats.map(cat => {
                const catSubs = subs.filter(s => s.category_slug === cat.slug);
                const prodCount = productCounts[cat.slug] || 0;
                const isExpanded = expandedCat === cat.id;
                const isEditingCat = !isMobile && editMode?.type === 'edit-cat' && editMode.row.id === cat.id;
                const isAddingSub = !isMobile && editMode?.type === 'new-sub' && editMode.catSlug === cat.slug;
                const catIcon = getCategoryIcon(cat.icon ?? undefined);

                return (
                  <div key={cat.id}>
                    {/* Category row */}
                    <div className={`flex items-center gap-2 px-2 sm:px-3 py-3 transition-colors ${isEditingCat ? 'bg-gray-50' : 'hover:bg-gray-50/50'}`}>
                      <button onClick={() => setExpandedCat(isExpanded ? null : cat.id)} className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-black flex-shrink-0">
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                      <div className="w-5 h-5 flex items-center justify-center text-gray-400 flex-shrink-0">
                        {catIcon || (isExpanded ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4 text-gray-300" />)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xs text-black font-medium leading-tight truncate">{cat.name_ro}</span>
                          <span className="text-[10px] text-gray-400 truncate hidden sm:inline max-w-[100px]">/ {cat.name_ru}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <code className="text-[9px] text-gray-300 bg-gray-50 px-1 py-px">{cat.slug}</code>
                          <span className="text-[9px] text-gray-300">{catSubs.length} sub.</span>
                        </div>
                      </div>

                      {/* Count - desktop only */}
                      <div className="flex-shrink-0 text-center hidden sm:block">
                        <div className={`text-xs tabular-nums px-2 py-0.5 ${prodCount > 0 ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>{prodCount}</div>
                        <div className="text-[9px] text-gray-400 mt-0.5">prod.</div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                        <button onClick={() => toggleActive(cat)} className={`w-8 h-5 rounded-full items-center flex-shrink-0 transition-colors hidden sm:flex ${(cat.active ?? true) ? 'bg-black' : 'bg-gray-200'}`}>
                          <span className={`w-3.5 h-3.5 bg-white rounded-full shadow transition-transform mx-0.5 ${(cat.active ?? true) ? 'translate-x-3' : 'translate-x-0'}`} />
                        </button>
                        <button onClick={() => { setExpandedCat(cat.id); openEdit({ type: 'new-sub', catSlug: cat.slug, catName: cat.name_ro }); }} className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-black hover:bg-gray-100 transition-colors" title="Adaugă subcategorie">
                          <Plus className="w-3 h-3" />
                        </button>
                        <button onClick={() => isEditingCat ? closeEdit() : openEdit({ type: 'edit-cat', row: cat })} className={`w-7 h-7 flex items-center justify-center transition-colors ${isEditingCat ? 'text-black bg-gray-100' : 'text-gray-400 hover:text-black hover:bg-gray-100'}`}>
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteTarget({ type: 'cat', id: cat.id, name: cat.name_ro, count: prodCount })} className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Desktop inline edit for category */}
                    {isEditingCat && (
                      <div className="border-t border-gray-100 bg-gray-50 px-4 py-4">
                        <EditForm mode={editMode} isCat={true} onSave={handleSave} onCancel={closeEdit} saving={saving} saveErr={saveErr} />
                      </div>
                    )}

                    {/* Subcategories */}
                    {isExpanded && (
                      <div className="border-t border-gray-100">
                        {catSubs.length === 0 && !isAddingSub && (
                          <div className="pl-10 sm:pl-14 pr-4 py-3 text-[11px] text-gray-400 italic">Nicio subcategorie</div>
                        )}
                        <div className="divide-y divide-gray-50">
                          {catSubs.map(sub => {
                            const isEditingSub = !isMobile && editMode?.type === 'edit-sub' && editMode.row.id === sub.id;
                            return (
                              <div key={sub.id}>
                                <div className={`flex items-center gap-2 pl-10 sm:pl-14 pr-2 sm:pr-3 py-2.5 transition-colors ${isEditingSub ? 'bg-gray-50' : 'hover:bg-gray-50/50'}`}>
                                  <Tag className="w-3 h-3 text-gray-200 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-1.5">
                                      <span className="text-xs text-gray-700 truncate">{sub.name_ro}</span>
                                      <span className="text-[10px] text-gray-400 truncate hidden sm:inline max-w-[100px]">/ {sub.name_ru}</span>
                                    </div>
                                    <code className="text-[9px] text-gray-300 bg-gray-50 px-1 py-px">{sub.slug}</code>
                                  </div>
                                  <div className="flex items-center gap-0.5 flex-shrink-0">
                                    <button onClick={() => isEditingSub ? closeEdit() : openEdit({ type: 'edit-sub', row: sub, catSlug: cat.slug, catName: cat.name_ro })} className={`w-6 h-6 flex items-center justify-center transition-colors ${isEditingSub ? 'text-black bg-gray-100' : 'text-gray-400 hover:text-black hover:bg-gray-100'}`}>
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                    <button onClick={() => setDeleteTarget({ type: 'sub', id: sub.id, name: sub.name_ro })} className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                                {isEditingSub && (
                                  <div className="bg-gray-50 border-t border-gray-100 px-4 py-4">
                                    <EditForm mode={editMode} isCat={false} onSave={handleSave} onCancel={closeEdit} saving={saving} saveErr={saveErr} />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {isAddingSub && (
                          <div className="border-t border-gray-100">
                            <div className="pl-10 sm:pl-14 pr-4 py-1.5 bg-gray-50 border-b border-gray-100">
                              <span className="text-[9px] uppercase tracking-widest text-gray-400">Subcategorie nouă · {cat.name_ro}</span>
                            </div>
                            <div className="px-4 py-4 bg-gray-50">
                              <EditForm mode={editMode} isCat={false} onSave={handleSave} onCancel={closeEdit} saving={saving} saveErr={saveErr} />
                            </div>
                          </div>
                        )}

                        {!isAddingSub && (
                          <button onClick={() => openEdit({ type: 'new-sub', catSlug: cat.slug, catName: cat.name_ro })} className="flex items-center gap-2 pl-10 sm:pl-14 pr-4 py-2.5 text-[11px] text-gray-400 hover:text-black hover:bg-gray-50 transition-colors w-full text-left border-t border-gray-50">
                            <Plus className="w-3 h-3" />
                            Adaugă subcategorie
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Mobile bottom sheet */}
      {isMobile && editMode && (
        <BottomSheet title={sheetTitle()} onClose={closeEdit}>
          <EditForm mode={editMode} isCat={isCatEdit} onSave={handleSave} onCancel={closeEdit} saving={saving} saveErr={saveErr} />
        </BottomSheet>
      )}

      {/* Delete modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white p-5 w-full max-w-sm shadow-2xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 bg-red-50 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-black mb-1">Ștergi <strong>{deleteTarget.name}</strong>?</p>
                {deleteTarget.type === 'cat' && (deleteTarget.count ?? 0) > 0 && (
                  <p className="text-[11px] text-amber-600">Atenție: {deleteTarget.count} produse au această categorie.</p>
                )}
                {deleteTarget.type === 'cat' && (
                  <p className="text-[11px] text-gray-400 mt-1">Toate subcategoriile vor fi șterse automat.</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleDelete} disabled={deleting} className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white text-xs py-2.5 hover:bg-red-600 transition-colors disabled:opacity-50">
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                {deleting ? 'Se șterge...' : 'Da, șterge'}
              </button>
              <button onClick={() => setDeleteTarget(null)} className="flex-1 text-xs border border-gray-200 py-2.5 text-gray-500 hover:border-black hover:text-black transition-colors">
                Anulează
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}