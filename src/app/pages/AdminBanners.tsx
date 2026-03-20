import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase, type BannerRow } from '../../lib/supabase';
import {
  Plus, X, Trash2, RefreshCw, Check, AlertCircle,
  ImageIcon, Eye, EyeOff, ChevronUp, ChevronDown,
  Layers, ExternalLink, Info,
} from 'lucide-react';
import { useAdminLang } from '../contexts/AdminLangContext';

const CREATE_SQL = `CREATE TABLE IF NOT EXISTS public.banners (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title_ro text, title_ru text,
  subtitle_ro text, subtitle_ru text,
  cta_text_ro text DEFAULT 'Solicită Ofertă',
  cta_text_ru text DEFAULT 'Запросить предложение',
  cta_link text DEFAULT '/order-request',
  image_url text,
  active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'banners' AND policyname = 'Allow all'
  ) THEN
    CREATE POLICY "Allow all" ON public.banners FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;`;

const EMPTY: Partial<BannerRow> = {
  title_ro: '', title_ru: '',
  subtitle_ro: '', subtitle_ru: '',
  cta_text_ro: 'Solicită Ofertă',
  cta_text_ru: 'Запросить предложение',
  cta_link: '/order-request',
  image_url: '', active: true, sort_order: 0,
};

const inp  = 'w-full h-9 px-3 text-xs border border-gray-200 bg-white focus:outline-none focus:border-black transition-colors';
const inpMono = `${inp} font-mono`;

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-[10px] uppercase tracking-widest text-gray-400 mb-1 block">{children}</label>;
}

export function AdminBanners() {
  const { t } = useAdminLang();
  const [rows, setRows]           = useState<BannerRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [noTable, setNoTable]     = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editId, setEditId]       = useState<string | null>(null);
  const [form, setForm]           = useState<Partial<BannerRow>>(EMPTY);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null);
  const [storageNote, setStorageNote] = useState(false);
  const [showSql, setShowSql]     = useState(false);
  const [showInfo, setShowInfo]   = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('banners').select('*').order('sort_order', { ascending: true });
    if (error) {
      const msg = error.message || '';
      const isNoTable =
        msg.includes('does not exist') || msg.includes('schema cache') ||
        msg.includes('relation') || error.code === '42P01' ||
        error.code === 'PGRST116' || error.code === 'PGRST200';
      if (isNoTable) setNoTable(true);
      else showToast(error.message, false);
    } else {
      setRows(data as BannerRow[]);
      setNoTable(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const ch = supabase.channel('admin-banners-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'banners' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const openNew  = () => { setEditId(null); setForm({ ...EMPTY, sort_order: rows.length }); setPanelOpen(true); };
  const openEdit = (row: BannerRow) => { setEditId(row.id); setForm({ ...row }); setPanelOpen(true); };
  const closePanel = () => { setPanelOpen(false); setEditId(null); setForm(EMPTY); };

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) { showToast('Selectați o imagine', false); return; }
    if (file.size > 8 * 1024 * 1024) { showToast('Imaginea trebuie să fie < 8 MB', false); return; }
    setUploading(true);
    const ext  = file.name.split('.').pop();
    const path = `banners/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { data, error } = await supabase.storage
      .from('product-images').upload(path, file, { cacheControl: '31536000', upsert: false });
    if (error) {
      setUploading(false);
      if (error.message.includes('Bucket not found') || error.message.includes('bucket')) {
        setStorageNote(true);
        showToast('Bucket "product-images" не существует', false);
      } else {
        showToast(error.message, false);
      }
      return;
    }
    const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(data.path);
    setForm(f => ({ ...f, image_url: urlData.publicUrl }));
    setUploading(false);
    showToast('Изображение загружено!');
  };

  const handleSave = async () => {
    if (!form.title_ro?.trim()) { showToast('Введите заголовок (RO)', false); return; }
    setSaving(true);
    const payload: Partial<BannerRow> = {
      title_ro:    form.title_ro?.trim()    || null,
      title_ru:    form.title_ru?.trim()    || null,
      subtitle_ro: form.subtitle_ro?.trim() || null,
      subtitle_ru: form.subtitle_ru?.trim() || null,
      cta_text_ro: form.cta_text_ro?.trim() || 'Solicită Ofertă',
      cta_text_ru: form.cta_text_ru?.trim() || 'Запросить предложение',
      cta_link:    form.cta_link?.trim()    || '/order-request',
      image_url:   form.image_url?.trim()   || null,
      active:      form.active ?? true,
      sort_order:  Number(form.sort_order)  || 0,
    };
    if (editId) {
      const { error } = await supabase.from('banners').update(payload).eq('id', editId);
      if (error) showToast(error.message, false);
      else { setRows(r => r.map(b => b.id === editId ? { ...b, ...payload } as BannerRow : b)); showToast(t.banners.saved); closePanel(); }
    } else {
      const { data, error } = await supabase.from('banners').insert(payload).select().single();
      if (error) showToast(error.message, false);
      else { setRows(r => [...r, data as BannerRow]); showToast(t.banners.saved); closePanel(); }
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!editId || !confirm(t.banners.deleteConfirm)) return;
    setDeleting(true);
    const { error } = await supabase.from('banners').delete().eq('id', editId);
    if (error) showToast(error.message, false);
    else { setRows(r => r.filter(b => b.id !== editId)); showToast(t.banners.deleted); closePanel(); }
    setDeleting(false);
  };

  const toggleActive = async (row: BannerRow) => {
    const next = !row.active;
    const { error } = await supabase.from('banners').update({ active: next }).eq('id', row.id);
    if (!error) setRows(r => r.map(b => b.id === row.id ? { ...b, active: next } : b));
  };

  const reorder = async (id: string, dir: 'up' | 'down') => {
    const idx     = rows.findIndex(b => b.id === id);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= rows.length) return;
    const next    = [...rows];
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    const updated = next.map((b, i) => ({ ...b, sort_order: i }));
    setRows(updated);
    await Promise.all([
      supabase.from('banners').update({ sort_order: updated[idx].sort_order }).eq('id', updated[idx].id),
      supabase.from('banners').update({ sort_order: updated[swapIdx].sort_order }).eq('id', updated[swapIdx].id),
    ]);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-16 lg:pb-0">

      {/* ═��═════════════════════════════════
          TOP BAR
          ═══════════════════════════════════ */}
      <div className="bg-white border-b border-gray-100 sticky top-12 z-20">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">

          {/* Row 1: title + actions */}
          <div className="flex items-center h-11 gap-2">
            <Layers className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-900 flex-shrink-0">{t.banners.title}</span>
            <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 tabular-nums flex-shrink-0">
              {rows.length}
            </span>

            <div className="flex-1" />

            {/* Info toggle (mobile-friendly hint) */}
            <button
              onClick={() => setShowInfo(v => !v)}
              className={`w-8 h-8 flex items-center justify-center border transition-colors ${
                showInfo ? 'border-black text-black' : 'border-gray-200 text-gray-400 hover:text-black hover:border-gray-400'
              }`}
              title="Справка"
            >
              <Info className="w-3.5 h-3.5" />
            </button>

            {/* Preview (icon on mobile, text on desktop) */}
            <a
              href="/" target="_blank" rel="noopener noreferrer"
              className="w-8 h-8 sm:w-auto sm:px-3 flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-black border border-gray-200 hover:border-gray-400 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.banners.showSql ? 'Preview' : 'Preview'}</span>
            </a>

            {/* Refresh */}
            <button
              onClick={load} disabled={loading}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-black transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Add */}
            <button
              onClick={openNew}
              className="flex items-center gap-1.5 bg-black text-white text-xs px-3 h-8 hover:bg-gray-800 transition-colors flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.banners.newBtn}</span>
              <span className="sm:hidden">+</span>
            </button>
          </div>
        </div>

        {/* Info bar (collapsible) */}
        {showInfo && (
          <div className="border-t border-gray-100 bg-gray-50 px-4 sm:px-6 lg:px-8 py-3">
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Баннеры отображаются в слайдере Hero на главной. Авто-прокрутка каждые 5 сек.
              Порядок — стрелками ↑↓. Банер с индексом 0 — первый.
              Если нет активных — показывается дефолтный контент сайта.
            </p>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════
          CONTENT
          ═══════════════════════════════════ */}
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-4 flex-1">

        {/* SQL notice */}
        {noTable && (
          <div className="mb-4 border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-amber-800 mb-2">
                  Таблица <code className="bg-amber-100 px-1">banners</code> не существует в Supabase.
                </p>
                <button onClick={() => setShowSql(v => !v)}
                  className="text-xs text-amber-700 border border-amber-300 px-3 py-1.5 hover:bg-amber-100 mb-2">
                  {showSql ? 'Скрыть SQL' : 'Показать SQL'}
                </button>
                {showSql && (
                  <pre className="bg-amber-100/50 border border-amber-200 p-3 text-[10px] text-amber-900 overflow-x-auto leading-relaxed mt-1 whitespace-pre-wrap break-all">
                    {CREATE_SQL}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Cards grid ── */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-100 animate-pulse">
                <div className="aspect-[16/7] bg-gray-100" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-100 w-2/3" />
                  <div className="h-2.5 bg-gray-50 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : !noTable && rows.length === 0 ? (
          <div className="bg-white border border-gray-100 py-14 text-center">
            <Layers className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400 mb-4">Баннеров пока нет</p>
            <button onClick={openNew}
              className="text-xs border border-black px-5 py-2 uppercase tracking-wider hover:bg-black hover:text-white transition-colors">
              Добавить первый баннер
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {rows.map((row, idx) => (
              <div
                key={row.id}
                className={`bg-white border flex flex-col overflow-hidden transition-all ${
                  row.active ? 'border-gray-200' : 'border-gray-100 opacity-60'
                }`}
              >
                {/* Image preview — clickable to edit */}
                <div
                  className="aspect-[16/7] bg-black relative overflow-hidden cursor-pointer"
                  onClick={() => openEdit(row)}
                >
                  {row.image_url ? (
                    <img src={row.image_url} alt="" className="w-full h-full object-cover opacity-60" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-700" />
                    </div>
                  )}
                  {/* Slide number */}
                  <div className="absolute top-2 left-2 text-[10px] text-white/50 tabular-nums">
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                  {/* Status badge */}
                  <div className={`absolute top-2 right-2 text-[9px] px-1.5 py-0.5 uppercase tracking-wide ${
                    row.active ? 'bg-green-500/80 text-white' : 'bg-gray-500/60 text-white'
                  }`}>
                    {row.active ? 'ON' : 'OFF'}
                  </div>
                  {/* Title overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-3">
                    <p className="text-xs text-white truncate leading-tight">
                      {row.title_ro || <span className="text-gray-400 italic">Без заголовка</span>}
                    </p>
                    {row.subtitle_ro && (
                      <p className="text-[10px] text-gray-300 truncate mt-0.5">{row.subtitle_ro}</p>
                    )}
                  </div>
                </div>

                {/* ── Card footer ── */}
                <div className="border-t border-gray-100 px-3 py-2">
                  {/* Row 1: order + active toggle + edit */}
                  <div className="flex items-center gap-2">
                    {/* Order arrows */}
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => reorder(row.id, 'up')} disabled={idx === 0}
                        className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-black transition-colors disabled:opacity-20"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => reorder(row.id, 'down')} disabled={idx === rows.length - 1}
                        className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-black transition-colors disabled:opacity-20"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex-1" />

                    {/* Active toggle */}
                    <button
                      onClick={() => toggleActive(row)}
                      className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 border transition-colors ${
                        row.active
                          ? 'border-black text-black bg-white hover:bg-gray-50'
                          : 'border-gray-200 text-gray-400 hover:border-gray-400 hover:text-black'
                      }`}
                    >
                      {row.active
                        ? <Eye className="w-3 h-3" />
                        : <EyeOff className="w-3 h-3" />}
                      {row.active ? 'Activ' : 'Inactiv'}
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => openEdit(row)}
                      className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 border border-gray-200 text-gray-500 hover:border-black hover:text-black transition-colors uppercase tracking-wider"
                    >
                      Edit
                    </button>
                  </div>

                  {/* Row 2: CTA link (only if set) */}
                  {row.cta_link && (
                    <p className="text-[10px] text-gray-400 font-mono mt-1.5 truncate pl-0.5">
                      → {row.cta_link}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════
          OVERLAY
          ═══════════════════════════════════ */}
      {panelOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[1px]" onClick={closePanel} />
      )}

      {/* ═══════════════════════════════════
          EDIT PANEL
          — Full screen on mobile, side drawer on sm+
          ═══════════════════════════════════ */}
      <div className={`
        fixed inset-0 sm:inset-auto sm:top-0 sm:right-0 sm:h-full sm:w-[480px]
        bg-white shadow-2xl z-50
        flex flex-col
        transition-transform duration-300 ease-in-out
        ${panelOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>

        {/* Panel header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-gray-100 flex-shrink-0 bg-white">
          <div className="min-w-0">
            <h2 className="text-sm text-gray-900 truncate">
              {editId ? t.banners.editTitle : t.banners.newTitle}
            </h2>
            {editId && (
              <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">#{editId.slice(0, 12)}…</p>
            )}
          </div>
          <button onClick={closePanel} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-black flex-shrink-0 ml-3">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Panel body — scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 py-4 space-y-4">

            {/* ── Image upload ── */}
            <div>
              <Label>
                Изображение <span className="normal-case text-gray-300 tracking-normal">· рек. 1600×700px</span>
              </Label>

              {form.image_url ? (
                <div className="relative aspect-[16/7] border border-gray-200 overflow-hidden group">
                  <img src={form.image_url} alt="" className="w-full h-full object-cover" />
                  {/* Hover overlay with actions */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button type="button" onClick={() => fileRef.current?.click()}
                      className="flex items-center gap-1.5 bg-white text-black text-xs px-3 py-2 hover:bg-gray-100">
                      <ImageIcon className="w-3.5 h-3.5" />Заменить
                    </button>
                    <button type="button" onClick={() => setForm(f => ({ ...f, image_url: '' }))}
                      className="flex items-center gap-1.5 bg-white text-red-500 text-xs px-3 py-2 hover:bg-red-50">
                      <X className="w-3.5 h-3.5" />Удалить
                    </button>
                  </div>
                  {/* Mobile tap buttons below image */}
                  <div className="sm:hidden absolute bottom-0 inset-x-0 flex">
                    <button type="button" onClick={() => fileRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-black/70 text-white text-xs py-2">
                      <ImageIcon className="w-3 h-3" />Заменить
                    </button>
                    <button type="button" onClick={() => setForm(f => ({ ...f, image_url: '' }))}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-red-600/80 text-white text-xs py-2">
                      <X className="w-3 h-3" />Удалить
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()}
                  className="w-full aspect-[16/7] border-2 border-dashed border-gray-200 hover:border-black transition-colors flex flex-col items-center justify-center gap-2">
                  {uploading
                    ? <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
                    : <>
                        <ImageIcon className="w-6 h-6 text-gray-300" />
                        <span className="text-xs text-gray-400">Нажмите или перетащите</span>
                        <span className="text-[10px] text-gray-300">JPG, PNG, WebP · max 8 MB</span>
                      </>
                  }
                </button>
              )}

              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ''; }} />

              {storageNote && (
                <div className="mt-2 bg-amber-50 border border-amber-200 p-3 flex gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-700">
                    Создайте bucket <code className="bg-amber-100 px-1">product-images</code> в Supabase Storage → Public: ON
                  </p>
                </div>
              )}

              {/* URL input */}
              <div className="mt-2">
                <label className="text-[10px] text-gray-400 mb-1 block">или URL изображения</label>
                <input type="text" value={form.image_url ?? ''}
                  onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                  placeholder="https://…"
                  className={inpMono} />
              </div>
            </div>

            {/* ── Titles ── */}
            <div className="space-y-3">
              <div>
                <Label>Заголовок RO <span className="text-red-400">*</span></Label>
                <input type="text" value={form.title_ro ?? ''}
                  onChange={e => setForm(f => ({ ...f, title_ro: e.target.value }))}
                  placeholder="Ex: Prețuri speciale pentru cluburi"
                  className={inp} />
              </div>
              <div>
                <Label>Заголовок RU</Label>
                <input type="text" value={form.title_ru ?? ''}
                  onChange={e => setForm(f => ({ ...f, title_ru: e.target.value }))}
                  placeholder="Спец. цены для клубов"
                  className={inp} />
              </div>
            </div>

            {/* ── Subtitles ── */}
            <div className="space-y-3">
              <div>
                <Label>Подзаголовок RO</Label>
                <textarea value={form.subtitle_ro ?? ''}
                  onChange={e => setForm(f => ({ ...f, subtitle_ro: e.target.value }))}
                  rows={2} placeholder="Descriere scurtă…"
                  className="w-full px-3 py-2 text-xs border border-gray-200 bg-white focus:outline-none focus:border-black resize-none" />
              </div>
              <div>
                <Label>Подзаголовок RU</Label>
                <textarea value={form.subtitle_ru ?? ''}
                  onChange={e => setForm(f => ({ ...f, subtitle_ru: e.target.value }))}
                  rows={2} placeholder="Краткое описание…"
                  className="w-full px-3 py-2 text-xs border border-gray-200 bg-white focus:outline-none focus:border-black resize-none" />
              </div>
            </div>

            {/* ── CTA ── */}
            <div className="space-y-3">
              <div>
                <Label>Ссылка кнопки CTA</Label>
                <input type="text" value={form.cta_link ?? ''}
                  onChange={e => setForm(f => ({ ...f, cta_link: e.target.value }))}
                  placeholder="/order-request"
                  className={inpMono} />
                <p className="text-[9px] text-gray-400 mt-0.5">
                  <code className="bg-gray-100 px-1">#modal</code> — форма · <code className="bg-gray-100 px-1">/catalog</code> · <code className="bg-gray-100 px-1">/order-request</code>
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Кнопка RO</Label>
                  <input type="text" value={form.cta_text_ro ?? ''}
                    onChange={e => setForm(f => ({ ...f, cta_text_ro: e.target.value }))}
                    placeholder="Solicită Ofertă"
                    className={inp} />
                </div>
                <div>
                  <Label>Кнопка RU</Label>
                  <input type="text" value={form.cta_text_ru ?? ''}
                    onChange={e => setForm(f => ({ ...f, cta_text_ru: e.target.value }))}
                    placeholder="Запросить предложение"
                    className={inp} />
                </div>
              </div>
            </div>

            {/* ── Sort + Active ── */}
            <div className="flex items-center gap-4 py-1">
              <div>
                <Label>Порядок</Label>
                <input type="number" min="0" step="1" value={form.sort_order ?? 0}
                  onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
                  className="w-20 h-9 px-3 text-xs border border-gray-200 bg-white focus:outline-none focus:border-black font-mono text-center" />
              </div>

              <div className="flex-1">
                <Label>Статус</Label>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, active: !f.active }))}
                  className={`flex items-center gap-2.5 h-9 px-3 w-full border transition-colors text-xs ${
                    form.active
                      ? 'border-black bg-black text-white'
                      : 'border-gray-200 text-gray-500 hover:border-gray-400'
                  }`}
                >
                  {/* Toggle pill */}
                  <span className={`w-8 h-5 rounded-full flex items-center transition-colors flex-shrink-0 ${form.active ? 'bg-white/30' : 'bg-gray-200'}`}>
                    <span className={`w-3.5 h-3.5 rounded-full shadow transition-transform mx-0.5 ${form.active ? 'bg-white translate-x-3' : 'bg-white translate-x-0'}`} />
                  </span>
                  {form.active
                    ? <><Eye className="w-3.5 h-3.5" /> Активен</>
                    : <><EyeOff className="w-3.5 h-3.5 opacity-50" /> Скрыт</>
                  }
                </button>
              </div>
            </div>

            {/* Bottom spacer so last field isn't hidden behind footer */}
            <div className="h-2" />
          </div>
        </div>

        {/* ── Panel footer ── */}
        <div className="flex-shrink-0 border-t border-gray-100 bg-white">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 gap-3">
            {editId ? (
              <button onClick={handleDelete} disabled={deleting || saving}
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-40">
                <Trash2 className="w-3.5 h-3.5" />
                {deleting ? '…' : t.banners.deleteConfirm ? 'Удалить' : 'Удалить'}
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button onClick={closePanel}
                className="px-4 py-2 text-xs text-gray-500 border border-gray-200 hover:border-gray-400 hover:text-black transition-colors">
                Отмена
              </button>
              <button onClick={handleSave} disabled={saving || uploading}
                className="flex items-center gap-2 px-5 py-2 bg-black text-white text-xs uppercase tracking-wider hover:bg-gray-800 transition-colors disabled:opacity-50">
                {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                {saving ? 'Сохранение…' : t.banners.saved ? 'Сохранить' : 'Сохранить'}
              </button>
            </div>
          </div>
          {/* Bottom nav clearance on mobile */}
          <div className="h-16 lg:h-0" />
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed bottom-20 lg:bottom-6 right-3 left-3 sm:left-auto sm:right-6 sm:w-72 z-[60] flex items-center gap-2 px-4 py-3 text-xs text-white shadow-xl ${toast.ok ? 'bg-black' : 'bg-red-600'}`}>
          {toast.ok ? <Check className="w-3.5 h-3.5 flex-shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />}
          <span className="truncate">{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
