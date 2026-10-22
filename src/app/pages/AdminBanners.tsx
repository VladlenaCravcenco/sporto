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
  return <label className="text-xs   admin-muted mb-1 block">{children}</label>;
}

export function AdminBanners() {
  const { t, lang } = useAdminLang();
  const l = (ro: string, ru: string) => (lang === 'ru' ? ru : ro);
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
    if (!file.type.startsWith('image/')) { showToast(l('Selectați o imagine', 'Выберите изображение'), false); return; }
    if (file.size > 8 * 1024 * 1024) { showToast(l('Imaginea trebuie să fie < 8 MB', 'Изображение должно быть меньше 8 MB'), false); return; }
    setUploading(true);
    const ext  = file.name.split('.').pop();
    const path = `banners/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { data, error } = await supabase.storage
      .from('product-images').upload(path, file, { cacheControl: '31536000', upsert: false });
    if (error) {
      setUploading(false);
      if (error.message.includes('Bucket not found') || error.message.includes('bucket')) {
        setStorageNote(true);
        showToast(l('Bucket-ul "product-images" nu există', 'Bucket "product-images" не существует'), false);
      } else {
        showToast(error.message, false);
      }
      return;
    }
    const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(data.path);
    setForm(f => ({ ...f, image_url: urlData.publicUrl }));
    setUploading(false);
    showToast(l('Imagine încărcată!', 'Изображение загружено!'));
  };

  const handleSave = async () => {
    if (!form.title_ro?.trim()) { showToast(l('Introduceți titlul (RO)', 'Введите заголовок (RO)'), false); return; }
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
    <div className="min-h-screen admin-canvas flex flex-col pb-16 lg:pb-0">

      <div className="admin-page-toolbar admin-surface border-b admin-border sticky top-12 z-20">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex items-center h-11 gap-2">
            <Layers className="w-4 h-4 admin-muted flex-shrink-0" />
            <span className="text-sm admin-ink flex-shrink-0">{t.banners.title}</span>
            <span className="text-[11px] admin-muted-surface admin-muted px-2 py-0.5 tabular-nums flex-shrink-0">
              {rows.length}
            </span>

            <div className="flex-1" />

            <button
              onClick={() => setShowInfo(v => !v)}
              className={`w-8 h-8 flex items-center justify-center border transition-colors ${
                showInfo ? 'admin-border-strong admin-ink' : 'admin-border admin-muted admin-hover-ink hover:border-gray-400'
              }`}
              title={l('Ajutor', 'Справка')}
            >
              <Info className="w-3.5 h-3.5" />
            </button>

            <a
              href="/" target="_blank" rel="noopener noreferrer"
              className="w-8 h-8 sm:w-auto sm:px-3 flex items-center justify-center gap-1.5 text-xs admin-muted admin-hover-ink border admin-border hover:border-gray-400 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.banners.showSql ? 'Preview' : 'Preview'}</span>
            </a>

            <button
              onClick={load} disabled={loading}
              className="w-8 h-8 flex items-center justify-center admin-muted admin-hover-ink transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={openNew}
              className="flex items-center gap-1.5 admin-solid admin-on-solid text-xs px-3 h-8 admin-hover-solid transition-colors flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.banners.newBtn}</span>
              <span className="sm:hidden">+</span>
            </button>
          </div>
        </div>

        {showInfo && (
          <div className="border-t admin-border admin-canvas px-4 sm:px-6 lg:px-8 py-3">
            <p className="text-[11px] admin-muted leading-relaxed">
              {l(
                'Bannerele se afișează în sliderul Hero de pe pagina principală. Derulare automată la fiecare 5 secunde. Ordinea se schimbă cu săgețile ↑↓. Bannerul cu index 0 este primul. Dacă nu există bannere active, se afișează conținutul implicit al site-ului.',
                'Баннеры отображаются в слайдере Hero на главной. Авто-прокрутка каждые 5 сек. Порядок меняется стрелками ↑↓. Баннер с индексом 0 показывается первым. Если активных нет, отображается дефолтный контент сайта.'
              )}
            </p>
          </div>
        )}
      </div>

      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-4 flex-1">

        {noTable && (
          <div className="mb-4 border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-amber-800 mb-2">
                  {l('Tabelul ', 'Таблица ')}<code className="bg-amber-100 px-1">banners</code>{l(' nu există în Supabase.', ' не существует в Supabase.')}
                </p>
                <button onClick={() => setShowSql(v => !v)}
                  className="text-xs text-amber-700 border border-amber-300 px-3 py-1.5 hover:bg-amber-100 mb-2">
                  {showSql ? t.banners.hideSql : t.banners.showSql}
                </button>
                {showSql && (
                  <pre className="bg-amber-100/50 border border-amber-200 p-3 text-xs text-amber-900 overflow-x-auto leading-relaxed mt-1 whitespace-pre-wrap break-all">
                    {CREATE_SQL}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="admin-surface border admin-border animate-pulse">
                <div className="aspect-[16/7] admin-muted-surface" />
                <div className="p-3 space-y-2">
                  <div className="h-3 admin-muted-surface w-2/3" />
                  <div className="h-2.5 admin-canvas w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : !noTable && rows.length === 0 ? (
          <div className="admin-surface border admin-border py-14 text-center">
            <Layers className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm admin-muted mb-4">{t.banners.noData}</p>
            <button onClick={openNew}
              className="text-xs border admin-border-strong px-5 py-2   hover:bg-black hover:text-white transition-colors">
              {l('Adaugă primul banner', 'Добавить первый баннер')}
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {rows.map((row, idx) => (
              <div
                key={row.id}
                className={`admin-surface border flex flex-col overflow-hidden transition-all ${
                  row.active ? 'admin-border' : 'admin-border opacity-60'
                }`}
              >

                <div
                  className="aspect-[16/7] admin-solid relative overflow-hidden cursor-pointer"
                  onClick={() => openEdit(row)}
                >
                  {row.image_url ? (
                    <img src={row.image_url} alt="" className="w-full h-full object-cover opacity-60" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 admin-ink" />
                    </div>
                  )}

                  <div className="absolute top-2 left-2 text-xs text-white/50 tabular-nums">
                    {String(idx + 1).padStart(2, '0')}
                  </div>

                  <div className={`absolute top-2 right-2 text-xs px-1.5 py-0.5   ${
                    row.active ? 'bg-green-500/80 admin-on-solid' : 'bg-gray-500/60 admin-on-solid'
                  }`}>
                    {row.active ? 'ON' : 'OFF'}
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-3">
                    <p className="text-xs admin-on-solid truncate leading-tight">
                      {row.title_ro || <span className="admin-muted italic">{l('Fără titlu', 'Без заголовка')}</span>}
                    </p>
                    {row.subtitle_ro && (
                      <p className="text-xs admin-muted truncate mt-0.5">{row.subtitle_ro}</p>
                    )}
                  </div>
                </div>

                <div className="border-t admin-border px-3 py-2">

                  <div className="flex items-center gap-2">

                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => reorder(row.id, 'up')} disabled={idx === 0}
                        className="w-7 h-7 flex items-center justify-center admin-muted admin-hover-ink transition-colors disabled:opacity-20"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => reorder(row.id, 'down')} disabled={idx === rows.length - 1}
                        className="w-7 h-7 flex items-center justify-center admin-muted admin-hover-ink transition-colors disabled:opacity-20"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex-1" />

                    <button
                      onClick={() => toggleActive(row)}
                      className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 border transition-colors ${
                        row.active
                          ? 'admin-border-strong admin-ink admin-surface admin-hover-surface'
                          : 'admin-border admin-muted hover:border-gray-400 admin-hover-ink'
                      }`}
                    >
                      {row.active
                        ? <Eye className="w-3 h-3" />
                        : <EyeOff className="w-3 h-3" />}
                      {row.active ? l('Activ', 'Активен') : l('Inactiv', 'Скрыт')}
                    </button>

                    <button
                      onClick={() => openEdit(row)}
                      className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 border admin-border admin-muted admin-hover-border admin-hover-ink transition-colors  "
                    >
                      {l('Editează', 'Редактировать')}
                    </button>
                  </div>

                  {row.cta_link && (
                    <p className="text-xs admin-muted font-mono mt-1.5 truncate pl-0.5">
                      → {row.cta_link}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {panelOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[1px]" onClick={closePanel} />
      )}

      <div className={`
        fixed inset-0 sm:inset-auto sm:top-0 sm:right-0 sm:h-full sm:w-[480px]
        admin-surface shadow-2xl z-50
        flex flex-col
        transition-transform duration-300 ease-in-out
        ${panelOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>

        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b admin-border flex-shrink-0 admin-surface">
          <div className="min-w-0">
            <h2 className="text-sm admin-ink truncate">
              {editId ? t.banners.editTitle : t.banners.newTitle}
            </h2>
            {editId && (
              <p className="text-xs admin-muted font-mono mt-0.5 truncate">#{editId.slice(0, 12)}…</p>
            )}
          </div>
          <button onClick={closePanel} className="w-8 h-8 flex items-center justify-center admin-muted admin-hover-ink flex-shrink-0 ml-3">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 py-4 space-y-4">

            <div>
              <Label>
                {l('Imagine', 'Изображение')} <span className="normal-case admin-muted tracking-normal">· {l('recomandat 1600×700px', 'рек. 1600×700px')}</span>
              </Label>

              {form.image_url ? (
                <div className="relative aspect-[16/7] border admin-border overflow-hidden group">
                  <img src={form.image_url} alt="" className="w-full h-full object-cover" />

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button type="button" onClick={() => fileRef.current?.click()}
                      className="flex items-center gap-1.5 admin-surface admin-ink text-xs px-3 py-2 admin-hover-surface">
                      <ImageIcon className="w-3.5 h-3.5" />{l('Înlocuiește', 'Заменить')}
                    </button>
                    <button type="button" onClick={() => setForm(f => ({ ...f, image_url: '' }))}
                      className="flex items-center gap-1.5 admin-surface text-red-500 text-xs px-3 py-2 hover:bg-red-50">
                      <X className="w-3.5 h-3.5" />{l('Șterge', 'Удалить')}
                    </button>
                  </div>

                  <div className="sm:hidden absolute bottom-0 inset-x-0 flex">
                    <button type="button" onClick={() => fileRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-black/70 admin-on-solid text-xs py-2">
                      <ImageIcon className="w-3 h-3" />{l('Înlocuiește', 'Заменить')}
                    </button>
                    <button type="button" onClick={() => setForm(f => ({ ...f, image_url: '' }))}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-red-600/80 admin-on-solid text-xs py-2">
                      <X className="w-3 h-3" />{l('Șterge', 'Удалить')}
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()}
                  className="w-full aspect-[16/7] border-2 border-dashed admin-border admin-hover-border transition-colors flex flex-col items-center justify-center gap-2">
                  {uploading
                    ? <RefreshCw className="w-6 h-6 admin-muted animate-spin" />
                    : <>
                        <ImageIcon className="w-6 h-6 admin-muted" />
                        <span className="text-xs admin-muted">{l('Apăsați sau trageți aici', 'Нажмите или перетащите')}</span>
                        <span className="text-xs admin-muted">JPG, PNG, WebP · max 8 MB</span>
                      </>
                  }
                </button>
              )}

              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ''; }} />

              {storageNote && (
                <div className="mt-2 bg-amber-50 border border-amber-200 p-3 flex gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    {l('Creați bucket-ul ', 'Создайте bucket ')}<code className="bg-amber-100 px-1">product-images</code>{l(' în Supabase Storage → Public: ON', ' в Supabase Storage → Public: ON')}
                  </p>
                </div>
              )}

              <div className="mt-2">
                <label className="text-xs admin-muted mb-1 block">{l('sau URL imagine', 'или URL изображения')}</label>
                <input type="text" value={form.image_url ?? ''}
                  onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                  placeholder="https://…"
                  className={inpMono} />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label>{l('Titlu RO', 'Заголовок RO')} <span className="text-red-400">*</span></Label>
                <input type="text" value={form.title_ro ?? ''}
                  onChange={e => setForm(f => ({ ...f, title_ro: e.target.value }))}
                  placeholder="Ex: Prețuri speciale pentru cluburi"
                  className={inp} />
              </div>
              <div>
                <Label>{l('Titlu RU', 'Заголовок RU')}</Label>
                <input type="text" value={form.title_ru ?? ''}
                  onChange={e => setForm(f => ({ ...f, title_ru: e.target.value }))}
                  placeholder="Спец. цены для клубов"
                  className={inp} />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label>{l('Subtitlu RO', 'Подзаголовок RO')}</Label>
                <textarea value={form.subtitle_ro ?? ''}
                  onChange={e => setForm(f => ({ ...f, subtitle_ro: e.target.value }))}
                  rows={2} placeholder="Descriere scurtă…"
                  className="w-full px-3 py-2 text-xs border admin-border admin-surface focus:outline-none admin-focus-border resize-none" />
              </div>
              <div>
                <Label>{l('Subtitlu RU', 'Подзаголовок RU')}</Label>
                <textarea value={form.subtitle_ru ?? ''}
                  onChange={e => setForm(f => ({ ...f, subtitle_ru: e.target.value }))}
                  rows={2} placeholder="Краткое описание…"
                  className="w-full px-3 py-2 text-xs border admin-border admin-surface focus:outline-none admin-focus-border resize-none" />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label>{l('Link buton CTA', 'Ссылка кнопки CTA')}</Label>
                <input type="text" value={form.cta_link ?? ''}
                  onChange={e => setForm(f => ({ ...f, cta_link: e.target.value }))}
                  placeholder="/order-request"
                  className={inpMono} />
                <p className="text-xs admin-muted mt-0.5">
                  <code className="admin-muted-surface px-1">#modal</code> {l('— formular', '— форма')} · <code className="admin-muted-surface px-1">/catalog</code> · <code className="admin-muted-surface px-1">/order-request</code>
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{l('Buton RO', 'Кнопка RO')}</Label>
                  <input type="text" value={form.cta_text_ro ?? ''}
                    onChange={e => setForm(f => ({ ...f, cta_text_ro: e.target.value }))}
                    placeholder="Solicită Ofertă"
                    className={inp} />
                </div>
                <div>
                  <Label>{l('Buton RU', 'Кнопка RU')}</Label>
                  <input type="text" value={form.cta_text_ru ?? ''}
                    onChange={e => setForm(f => ({ ...f, cta_text_ru: e.target.value }))}
                    placeholder="Запросить предложение"
                    className={inp} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 py-1">
              <div>
                <Label>{l('Ordine', 'Порядок')}</Label>
                <input type="number" min="0" step="1" value={form.sort_order ?? 0}
                  onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
                  className="w-20 h-9 px-3 text-xs border admin-border admin-surface focus:outline-none admin-focus-border font-mono text-center" />
              </div>

              <div className="flex-1">
                <Label>{l('Status', 'Статус')}</Label>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, active: !f.active }))}
                  className={`flex items-center gap-2.5 h-9 px-3 w-full border transition-colors text-xs ${
                    form.active
                      ? 'admin-border-strong admin-solid admin-on-solid'
                      : 'admin-border admin-muted hover:border-gray-400'
                  }`}
                >

                  <span className={`w-8 h-5 rounded-full flex items-center transition-colors flex-shrink-0 ${form.active ? 'bg-white/30' : 'admin-muted-surface'}`}>
                    <span className={`w-3.5 h-3.5 rounded-full shadow transition-transform mx-0.5 ${form.active ? 'admin-surface translate-x-3' : 'admin-surface translate-x-0'}`} />
                  </span>
                  {form.active
                    ? <><Eye className="w-3.5 h-3.5" /> {l('Activ', 'Активен')}</>
                    : <><EyeOff className="w-3.5 h-3.5 opacity-50" /> {l('Ascuns', 'Скрыт')}</>
                  }
                </button>
              </div>
            </div>

            <div className="h-2" />
          </div>
        </div>

        <div className="flex-shrink-0 border-t admin-border admin-surface">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 gap-3">
            {editId ? (
              <button onClick={handleDelete} disabled={deleting || saving}
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-40">
                <Trash2 className="w-3.5 h-3.5" />
                {deleting ? '…' : l('Șterge', 'Удалить')}
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button onClick={closePanel}
                className="px-4 py-2 text-xs admin-muted border admin-border hover:border-gray-400 admin-hover-ink transition-colors">
                {l('Anulează', 'Отмена')}
              </button>
              <button onClick={handleSave} disabled={saving || uploading}
                className="flex items-center gap-2 px-5 py-2 admin-solid admin-on-solid text-xs   admin-hover-solid transition-colors disabled:opacity-50">
                {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                {saving ? l('Salvare…', 'Сохранение…') : l('Salvează', 'Сохранить')}
              </button>
            </div>
          </div>

          <div className="h-16 lg:h-0" />
        </div>
      </div>

      {toast && (
        <div className={`fixed bottom-20 lg:bottom-6 right-3 left-3 sm:left-auto sm:right-6 sm:w-72 z-[60] flex items-center gap-2 px-4 py-3 text-xs admin-on-solid shadow-xl ${toast.ok ? 'admin-solid' : 'bg-red-600'}`}>
          {toast.ok ? <Check className="w-3.5 h-3.5 flex-shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />}
          <span className="truncate">{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
