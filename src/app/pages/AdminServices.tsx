import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, ArrowRight, Check, Monitor, Globe, Eye, EyeOff, ChevronUp, ChevronDown, Upload, Image as ImageIcon } from 'lucide-react';
import { useAdminLang } from '../contexts/AdminLangContext';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { usePreviewFieldFocus } from '../hooks/usePreviewFieldFocus';
import {
  PageData, BiText, Stat, Service, Step, Why, Case, SectionKey,
  DEFAULTS, loadFromSupabase, saveToSupabase, invalidateCache,
} from './turnkeyContent';

function bi(ro = '', ru = ''): BiText { return { ro, ru }; }

function SectionHeader({ title, visible, onToggle }: { title: string; visible: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-white/10">
      <span className="text-[9px] uppercase tracking-widest text-gray-600">{title}</span>
      <button onClick={onToggle} className={`flex items-center gap-1 text-[9px] uppercase tracking-wider transition-colors ${visible ? 'text-green-400' : 'text-gray-600'}`}>
        {visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
        {visible ? 'Вкл' : 'Выкл'}
      </button>
    </div>
  );
}

function BiField({ label, value, onChange, textarea, placeholder }: {
  label: string;
  value: BiText;
  onChange: (v: BiText) => void;
  textarea?: boolean;
  placeholder?: BiText;
}) {
  const cls = 'w-full bg-black border border-white/20 px-2.5 text-xs text-white placeholder-gray-700 focus:border-white/60 focus:outline-none transition-colors';
  return (
    <div>
      <div className="text-[9px] uppercase tracking-widest text-gray-600 mb-1">{label}</div>
      <div className="grid grid-cols-2 gap-2">
        {(['ro', 'ru'] as const).map(l => (
          <div key={l}>
            <div className="text-[8px] text-gray-700 uppercase tracking-widest mb-1">{l.toUpperCase()}</div>
            {textarea
              ? <textarea rows={2} value={value[l]} placeholder={placeholder?.[l]}
                  onChange={e => onChange({ ...value, [l]: e.target.value })}
                  className={cls + ' py-1.5 resize-none'} />
              : <input value={value[l]} placeholder={placeholder?.[l]}
                  onChange={e => onChange({ ...value, [l]: e.target.value })}
                  className={cls + ' h-8'} />
            }
          </div>
        ))}
      </div>
    </div>
  );
}

function CardList<T>({
  items, onUpdate, onAdd, onRemove, onMove, renderCard,
}: {
  items: T[];
  onUpdate: (items: T[]) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
  onMove: (i: number, dir: -1 | 1) => void;
  renderCard: (item: T, i: number, update: (v: T) => void) => React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="border border-white/10 p-2.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] text-gray-600">#{i + 1}</span>
            <div className="flex items-center gap-0.5">
              <button onClick={() => onMove(i, -1)} disabled={i === 0}
                className="w-5 h-5 flex items-center justify-center text-gray-700 hover:text-white disabled:opacity-20 transition-colors">
                <ChevronUp className="w-3 h-3" />
              </button>
              <button onClick={() => onMove(i, 1)} disabled={i === items.length - 1}
                className="w-5 h-5 flex items-center justify-center text-gray-700 hover:text-white disabled:opacity-20 transition-colors">
                <ChevronDown className="w-3 h-3" />
              </button>
              <button onClick={() => onRemove(i)}
                className="w-5 h-5 flex items-center justify-center text-gray-700 hover:text-red-400 transition-colors">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          {renderCard(item, i, (v: T) => {
            const next = [...items]; next[i] = v; onUpdate(next);
          })}
        </div>
      ))}
      <button onClick={onAdd}
        className="w-full border border-dashed border-white/15 py-2 text-[10px] text-gray-600 hover:text-gray-400 hover:border-white/30 transition-colors flex items-center justify-center gap-1.5">
        <Plus className="w-3 h-3" />
        Добавить
      </button>
    </div>
  );
}

const SECTION_TITLES: Record<SectionKey, string> = {
  stats: 'Stats',
  services: 'Services',
  process: 'Process',
  why: 'Why us',
  cases: 'Cases',
  cta: 'CTA',
};

function Preview({ data, lang, activeFieldId, focusField }: { data: PageData; lang: 'ro' | 'ru'; activeFieldId: string | null; focusField: (id: string) => void }) {
  const t = (b: BiText | undefined) => b?.[lang] || b?.ro || '';
  const sections: Record<SectionKey, React.ReactNode> = {
    stats: data.show_stats ? (
      <button type="button" onClick={() => focusField('stats')} className={`block w-full text-left px-8 py-6 border-b transition-colors ${activeFieldId === 'stats' ? 'border-black/30 bg-gray-50' : 'border-gray-100 hover:bg-gray-50'}`}>
        <div className="grid grid-cols-3 divide-x divide-gray-100">
          {data.stats.map((s, i) => (
            <div key={i} className="px-6 first:pl-0 py-2">
              <div className="text-3xl tabular-nums tracking-tight text-black leading-none mb-1">{t(s.n) || '—'}</div>
              <div className="text-[10px] uppercase tracking-widest text-gray-400">{t(s.label) || '—'}</div>
            </div>
          ))}
        </div>
      </button>
    ) : null,
    services: data.show_services ? (
      <button type="button" onClick={() => focusField('services')} className={`block w-full text-left px-8 py-8 border-b transition-colors ${activeFieldId === 'services' ? 'border-black/30 bg-gray-50' : 'border-gray-100 hover:bg-gray-50'}`}>
        <h2 className="text-xl leading-tight tracking-tight whitespace-pre-line mb-6 text-black">{t(data.services_title)}</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
          {data.services.map((s, i) => (
            <div key={i}>
              <div className="text-[10px] uppercase tracking-[0.2em] text-gray-300 mb-2">{s.num}</div>
              <h3 className="text-xs text-black mb-2">{t(s.title)}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{t(s.body)}</p>
            </div>
          ))}
        </div>
      </button>
    ) : null,
    process: data.show_process ? (
      <button type="button" onClick={() => focusField('process')} className={`block w-full text-left px-8 py-8 border-b transition-colors ${activeFieldId === 'process' ? 'border-black/30 bg-gray-100' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}>
        <h2 className="text-xl leading-tight tracking-tight whitespace-pre-line mb-6 text-black">{t(data.process_title)}</h2>
        <div className="space-y-3">
          {data.steps.map((s, i) => (
            <div key={i} className="flex gap-4 items-start">
              <div className="w-8 h-8 flex-shrink-0 bg-black text-white flex items-center justify-center text-[10px]">{s.n}</div>
              <div>
                <div className="text-xs text-black mb-1">{t(s.title)}</div>
                <p className="text-xs text-gray-500 leading-relaxed">{t(s.body)}</p>
              </div>
            </div>
          ))}
        </div>
      </button>
    ) : null,
    why: data.show_why ? (
      <button type="button" onClick={() => focusField('why')} className={`block w-full text-left px-8 py-8 border-b transition-colors ${activeFieldId === 'why' ? 'border-black/30 bg-gray-50' : 'border-gray-100 hover:bg-gray-50'}`}>
        <h2 className="text-xl leading-tight tracking-tight whitespace-pre-line mb-6 text-black">{t(data.why_title)}</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          {data.why.map((w, i) => (
            <div key={i} className="flex items-start gap-3">
              <Check className="w-3.5 h-3.5 text-black mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs text-black mb-1">{t(w.title)}</div>
                <p className="text-xs text-gray-500 leading-relaxed">{t(w.body)}</p>
              </div>
            </div>
          ))}
        </div>
      </button>
    ) : null,
    cases: data.show_cases ? (
      <button type="button" onClick={() => focusField('cases')} className={`block w-full text-left px-8 py-8 border-b transition-colors ${activeFieldId === 'cases' ? 'border-black/30 bg-gray-50' : 'border-gray-100 hover:bg-gray-50'}`}>
        <h2 className="text-xl leading-tight tracking-tight whitespace-pre-line mb-6 text-black">{t(data.cases_title)}</h2>
        {data.cases.length === 0 ? (
          <div className="border border-dashed border-gray-200 py-8 text-center text-xs text-gray-300">
            {lang === 'ro' ? 'Proiecte neadăugate' : 'Проекты не добавлены'}
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {data.cases.map((c, i) => (
              <div key={i} className="flex-shrink-0 w-48">
                <div className="aspect-[4/3] bg-gray-50 overflow-hidden mb-2">
                  {c.image ? <img src={c.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-300">Фото</div>}
                </div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] text-black truncate">{lang === 'ro' ? c.label_ro : c.label_ru}</span>
                  {c.year && <span className="text-[9px] text-gray-400 flex-shrink-0">{c.year}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </button>
    ) : null,
    cta: data.show_cta ? (
      <button type="button" onClick={() => focusField('cta')} className={`block w-full text-left px-8 py-8 transition-colors ${activeFieldId === 'cta' ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
        <div className="bg-black text-white px-8 py-10 text-center">
          <h2 className="text-2xl tracking-tight text-white mb-4">{t(data.cta_title)}</h2>
          <p className="text-sm text-gray-400 leading-relaxed mb-6 max-w-md mx-auto">{t(data.cta_body)}</p>
          <div className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 text-[10px] uppercase tracking-widest">
            {t(data.cta_btn)}<ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </button>
    ) : null,
  };
  return (
    <div className="bg-white min-h-full text-black">

      <button type="button" onClick={() => focusField('hero')} className={`block w-full text-left px-8 pt-10 pb-8 border-b transition-colors ${activeFieldId === 'hero' ? 'border-black/30 bg-gray-50' : 'border-gray-100 hover:bg-gray-50'}`}>
        <div className="text-[10px] uppercase tracking-[0.2em] text-gray-300 mb-4">
          {lang === 'ro' ? 'Soluții complete · B2B' : 'Полный комплекс · B2B'}
        </div>
        <h1 className="text-3xl leading-tight tracking-tight whitespace-pre-line mb-4 text-black">{t(data.hero_title)}</h1>
        <p className="text-sm text-gray-500 leading-relaxed max-w-lg mb-5">{t(data.hero_body)}</p>
        <div className="flex items-center gap-4">
          <div className="inline-flex items-center gap-2 bg-black text-white px-5 py-2.5 text-[10px] uppercase tracking-widest">
            {t(data.hero_cta)}<ArrowRight className="w-3 h-3" />
          </div>
          <span className="text-xs text-gray-400">{t(data.hero_sub)}</span>
        </div>
      </button>

      {data.section_order.map((key) => <div key={key}>{sections[key]}</div>)}

    </div>
  );
}

export function AdminServices() {
  const { lang } = useAdminLang();
  const isRu = lang === 'ru';

  const [data, setData]           = useState<PageData>({ ...DEFAULTS });
  const [published, setPublished] = useState<PageData>({ ...DEFAULTS });
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [previewLang, setPreviewLang] = useState<'ro' | 'ru'>('ro');
  const [uploadingCaseIndex, setUploadingCaseIndex] = useState<number | null>(null);
  const { activeFieldId, registerField, focusField } = usePreviewFieldFocus();

  useEffect(() => {
    loadFromSupabase().then(d => { setData(d); setPublished(d); setLoading(false); });
  }, []);

  const set = <K extends keyof PageData>(key: K, value: PageData[K]) =>
    setData(p => ({ ...p, [key]: value }));

  const uploadCaseImage = async (index: number, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast(isRu ? 'Нужно выбрать изображение' : 'Selectează o imagine');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast(isRu ? 'Файл должен быть меньше 8 MB' : 'Fișierul trebuie să fie mai mic de 8 MB');
      return;
    }

    setUploadingCaseIndex(index);
    try {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `turnkey-cases/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { data: uploaded, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(path, file, {
          cacheControl: '31536000',
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage.from('product-images').getPublicUrl(uploaded.path);
      setData(prev => ({
        ...prev,
        cases: prev.cases.map((item, i) => i === index ? { ...item, image: publicUrl.publicUrl } : item),
      }));
      toast(isRu ? 'Изображение загружено' : 'Imagine încărcată');
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : String(error);
      if (message.toLowerCase().includes('bucket')) {
        toast(isRu ? 'Не найден storage bucket product-images' : 'Bucket-ul product-images nu a fost găsit');
      } else if (message.toLowerCase().includes('mime') || message.toLowerCase().includes('content type')) {
        toast(isRu ? 'Этот формат изображения не поддерживается' : 'Acest format de imagine nu este acceptat');
      } else {
        toast(isRu ? `Ошибка загрузки: ${message}` : `Eroare la încărcare: ${message}`);
      }
    } finally {
      setUploadingCaseIndex(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveToSupabase(data);
      invalidateCache(data);
      setPublished({ ...data });
      toast(isRu ? '✓ Сохранено — страница обновится' : '✓ Salvat — pagina se va actualiza');
    } catch {
      toast(isRu ? 'Ошибка сохранения' : 'Eroare la salvare');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm(isRu ? 'Сбросить к значениям по умолчанию?' : 'Resetați la valorile implicite?')) {
      setData({ ...DEFAULTS });
    }
  };

  const hasChanges = JSON.stringify(data) !== JSON.stringify(published);

  function listHelpers<T>(key: keyof PageData, empty: () => T) {
    const items = data[key] as T[];
    return {
      onUpdate: (v: T[]) => set(key, v as any),
      onAdd:    ()        => set(key, [...items, empty()] as any),
      onRemove: (i: number) => set(key, items.filter((_, j) => j !== i) as any),
      onMove:   (i: number, dir: -1 | 1) => {
        const arr = [...items]; const to = i + dir;
        if (to < 0 || to >= arr.length) return;
        [arr[i], arr[to]] = [arr[to], arr[i]];
        set(key, arr as any);
      },
    };
  }

  const moveSection = (index: number, dir: -1 | 1) => {
    const next = [...data.section_order];
    const to = index + dir;
    if (to < 0 || to >= next.length) return;
    [next[index], next[to]] = [next[to], next[index]];
    set('section_order', next);
  };

  const showKey = (section: SectionKey): keyof PageData => {
    const map: Record<SectionKey, keyof PageData> = {
      stats: 'show_stats',
      services: 'show_services',
      process: 'show_process',
      why: 'show_why',
      cases: 'show_cases',
      cta: 'show_cta',
    };
    return map[section];
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-48px)] items-center justify-center bg-black">
        <div className="w-4 h-4 border border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-48px)] overflow-hidden bg-black">

      {/* ══ LEFT — EDITOR ══ */}
      <div className="w-[520px] shrink-0 flex flex-col border-r border-white/10 overflow-y-auto">

        <div className="sticky top-0 z-10 bg-black border-b border-white/10 px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em]">Страница</p>
              <h1 className="text-base text-white">/turnkey-solutions</h1>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleReset}
                className="h-8 px-3 text-[10px] text-gray-600 border border-white/10 hover:border-white/30 hover:text-gray-300 transition-colors uppercase tracking-wider">
                {isRu ? 'Сброс' : 'Reset'}
              </button>
              <button onClick={handleSave} disabled={saving || !hasChanges}
                className={`flex items-center gap-1.5 px-4 h-8 text-xs uppercase tracking-widest transition-colors ${
                  hasChanges && !saving ? 'bg-white text-black hover:bg-gray-100' : 'bg-white/10 text-gray-600 cursor-default'
                }`}>
                {saving ? <span className="w-3 h-3 border border-gray-400 border-t-white rounded-full animate-spin" /> : <Save className="w-3 h-3" />}
                {isRu ? 'Сохранить' : 'Salvează'}
              </button>
            </div>
          </div>
          {hasChanges && (
            <div className="mt-2 text-[9px] text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-amber-500 inline-block" />
              {isRu ? 'Есть несохранённые изменения' : 'Modificări nesalvate'}
            </div>
          )}
        </div>

        <div className="px-5 py-5 space-y-6">

          {/* HERO */}
          <div ref={registerField('hero')} className={activeFieldId === 'hero' ? 'ring-1 ring-white/40 bg-white/[0.03] p-2 -m-2' : ''}>
            <div className="text-[9px] uppercase tracking-widest text-gray-600 mb-2 pb-1.5 border-b border-white/10">Hero</div>
            <div className="space-y-3">
              <BiField label={isRu ? 'Заголовок' : 'Titlu'} value={data.hero_title} onChange={v => set('hero_title', v)} textarea placeholder={DEFAULTS.hero_title} />
              <BiField label={isRu ? 'Описание' : 'Descriere'} value={data.hero_body} onChange={v => set('hero_body', v)} textarea placeholder={DEFAULTS.hero_body} />
              <BiField label="CTA кнопка" value={data.hero_cta} onChange={v => set('hero_cta', v)} placeholder={DEFAULTS.hero_cta} />
              <BiField label={isRu ? 'Подпись под кнопкой' : 'Text sub buton'} value={data.hero_sub} onChange={v => set('hero_sub', v)} placeholder={DEFAULTS.hero_sub} />
            </div>
          </div>

          <div ref={registerField('section_order')} className={activeFieldId === 'section_order' ? 'ring-1 ring-white/40 bg-white/[0.03] p-2 -m-2' : ''}>
            <div className="text-[9px] uppercase tracking-widest text-gray-600 mb-2 pb-1.5 border-b border-white/10">Block order</div>
            <div className="space-y-2">
              {data.section_order.map((section, index) => {
                const visible = data[showKey(section)] as boolean;
                return (
                  <div key={section} className="border border-white/10 px-3 py-2 flex items-center gap-2">
                    <div className="text-[10px] text-gray-400 uppercase tracking-widest flex-1">{SECTION_TITLES[section]}</div>
                    <button onClick={() => set(showKey(section), (!visible) as PageData[keyof PageData])} className={`w-6 h-6 flex items-center justify-center ${visible ? 'text-green-400' : 'text-gray-600'}`}>
                      {visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    </button>
                    <button onClick={() => moveSection(index, -1)} disabled={index === 0} className="w-6 h-6 flex items-center justify-center text-gray-700 hover:text-white disabled:opacity-20">
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button onClick={() => moveSection(index, 1)} disabled={index === data.section_order.length - 1} className="w-6 h-6 flex items-center justify-center text-gray-700 hover:text-white disabled:opacity-20">
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STATS */}
          <div ref={registerField('stats')} className={activeFieldId === 'stats' ? 'ring-1 ring-white/40 bg-white/[0.03] p-2 -m-2' : ''}>
            <SectionHeader title={isRu ? 'Статистика' : 'Statistici'} visible={data.show_stats} onToggle={() => set('show_stats', !data.show_stats)} />
            {data.show_stats && (
              <CardList
                items={data.stats}
                {...listHelpers<Stat>('stats', () => ({ n: bi(), label: bi() }))}
                renderCard={(s, _, upd) => (
                  <div className="space-y-2">
                    <BiField label={isRu ? 'Число' : 'Cifra'} value={s.n} onChange={v => upd({ ...s, n: v })} placeholder={bi('10+', '10+')} />
                    <BiField label={isRu ? 'Подпись' : 'Etichetă'} value={s.label} onChange={v => upd({ ...s, label: v })} placeholder={bi('Ani pe piață', 'Лет на рынке')} />
                  </div>
                )}
              />
            )}
          </div>

          {/* SERVICES */}
          <div ref={registerField('services')} className={activeFieldId === 'services' ? 'ring-1 ring-white/40 bg-white/[0.03] p-2 -m-2' : ''}>
            <SectionHeader title={isRu ? 'Услуги' : 'Servicii'} visible={data.show_services} onToggle={() => set('show_services', !data.show_services)} />
            {data.show_services && (
              <>
                <div className="mb-3">
                  <BiField label={isRu ? 'Заголовок раздела' : 'Titlu secțiune'} value={data.services_title} onChange={v => set('services_title', v)} textarea placeholder={DEFAULTS.services_title} />
                </div>
                <CardList
                  items={data.services}
                  {...listHelpers<Service>('services', () => ({ num: String(data.services.length + 1).padStart(2, '0'), title: bi(), body: bi() }))}
                  renderCard={(s, _, upd) => (
                    <div className="space-y-2">
                      <div>
                        <div className="text-[9px] uppercase tracking-widest text-gray-600 mb-1">{isRu ? 'Номер' : 'Număr'}</div>
                        <input value={s.num} onChange={e => upd({ ...s, num: e.target.value })}
                          className="w-16 h-7 bg-black border border-white/20 px-2 text-xs text-white focus:border-white/60 focus:outline-none" />
                      </div>
                      <BiField label={isRu ? 'Заголовок' : 'Titlu'} value={s.title} onChange={v => upd({ ...s, title: v })} />
                      <BiField label={isRu ? 'Описание' : 'Descriere'} value={s.body} onChange={v => upd({ ...s, body: v })} textarea />
                    </div>
                  )}
                />
              </>
            )}
          </div>

          {/* PROCESS */}
          <div ref={registerField('process')} className={activeFieldId === 'process' ? 'ring-1 ring-white/40 bg-white/[0.03] p-2 -m-2' : ''}>
            <SectionHeader title={isRu ? 'Процесс (шаги)' : 'Proces (etape)'} visible={data.show_process} onToggle={() => set('show_process', !data.show_process)} />
            {data.show_process && (
              <>
                <div className="mb-3">
                  <BiField label={isRu ? 'Заголовок раздела' : 'Titlu secțiune'} value={data.process_title} onChange={v => set('process_title', v)} textarea placeholder={DEFAULTS.process_title} />
                </div>
                <CardList
                  items={data.steps}
                  {...listHelpers<Step>('steps', () => ({ n: String(data.steps.length + 1).padStart(2, '0'), title: bi(), body: bi() }))}
                  renderCard={(s, _, upd) => (
                    <div className="space-y-2">
                      <div>
                        <div className="text-[9px] uppercase tracking-widest text-gray-600 mb-1">{isRu ? 'Номер шага' : 'Nr. etapă'}</div>
                        <input value={s.n} onChange={e => upd({ ...s, n: e.target.value })}
                          className="w-16 h-7 bg-black border border-white/20 px-2 text-xs text-white focus:border-white/60 focus:outline-none" />
                      </div>
                      <BiField label={isRu ? 'Название' : 'Titlu'} value={s.title} onChange={v => upd({ ...s, title: v })} />
                      <BiField label={isRu ? 'Описание' : 'Descriere'} value={s.body} onChange={v => upd({ ...s, body: v })} textarea />
                    </div>
                  )}
                />
              </>
            )}
          </div>

          {/* WHY */}
          <div ref={registerField('why')} className={activeFieldId === 'why' ? 'ring-1 ring-white/40 bg-white/[0.03] p-2 -m-2' : ''}>
            <SectionHeader title={isRu ? 'Почему мы' : 'De ce noi'} visible={data.show_why} onToggle={() => set('show_why', !data.show_why)} />
            {data.show_why && (
              <>
                <div className="mb-3">
                  <BiField label={isRu ? 'Заголовок раздела' : 'Titlu secțiune'} value={data.why_title} onChange={v => set('why_title', v)} textarea placeholder={DEFAULTS.why_title} />
                </div>
                <CardList
                  items={data.why}
                  {...listHelpers<Why>('why', () => ({ title: bi(), body: bi() }))}
                  renderCard={(w, _, upd) => (
                    <div className="space-y-2">
                      <BiField label={isRu ? 'Заголовок' : 'Titlu'} value={w.title} onChange={v => upd({ ...w, title: v })} />
                      <BiField label={isRu ? 'Описание' : 'Descriere'} value={w.body} onChange={v => upd({ ...w, body: v })} textarea />
                    </div>
                  )}
                />
              </>
            )}
          </div>

          {/* CASES */}
          <div ref={registerField('cases')} className={activeFieldId === 'cases' ? 'ring-1 ring-white/40 bg-white/[0.03] p-2 -m-2' : ''}>
            <SectionHeader title={isRu ? 'Кейсы / Проекты' : 'Cazuri / Proiecte'} visible={data.show_cases} onToggle={() => set('show_cases', !data.show_cases)} />
            {data.show_cases && (
              <>
                <div className="mb-3">
                  <BiField label={isRu ? 'Заголовок раздела' : 'Titlu secțiune'} value={data.cases_title} onChange={v => set('cases_title', v)} placeholder={DEFAULTS.cases_title} />
                </div>
                <CardList
                  items={data.cases}
                  {...listHelpers<Case>('cases', () => ({
                    image: '', label_ro: '', label_ru: '', year: new Date().getFullYear().toString(),
                  }))}
                  renderCard={(c, index, upd) => (
                    <div className="space-y-2">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="text-[9px] uppercase tracking-widest text-gray-600">Баннер кейса</div>
                          <label className="inline-flex items-center gap-1.5 px-2 py-1 border border-white/20 text-[9px] uppercase tracking-widest text-gray-400 hover:text-white hover:border-white/40 cursor-pointer transition-colors">
                            {uploadingCaseIndex === index ? <span className="w-2.5 h-2.5 border border-gray-500 border-t-white rounded-full animate-spin" /> : <Upload className="w-3 h-3" />}
                            {isRu ? 'Загрузить' : 'Încarcă'}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) uploadCaseImage(index, file);
                                e.currentTarget.value = '';
                              }}
                            />
                          </label>
                        </div>
                        <div className="text-[8px] text-gray-700 uppercase tracking-widest mb-2">
                          {isRu ? 'Рекомендуемый размер: 1600×900 px, формат 16:9' : 'Dimensiune recomandată: 1600×900 px, format 16:9'}
                        </div>
                        <div className="flex items-center gap-2">
                          <input value={c.image} onChange={e => upd({ ...c, image: e.target.value })}
                            placeholder="https://..."
                            className="flex-1 h-8 bg-black border border-white/20 px-2.5 text-xs text-white focus:border-white/60 focus:outline-none" />
                          <div className="w-8 h-8 border border-white/10 flex items-center justify-center text-gray-700">
                            <ImageIcon className="w-3.5 h-3.5" />
                          </div>
                        </div>
                        {c.image && (
                          <div className="mt-1.5 h-28 border border-white/10 overflow-hidden bg-black">
                            <img src={c.image} alt="" className="w-full h-full object-cover"
                              onError={e => (e.currentTarget.style.display = 'none')} />
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-[8px] text-gray-700 uppercase tracking-widest mb-1">Подпись RO</div>
                          <input value={c.label_ro} onChange={e => upd({ ...c, label_ro: e.target.value })}
                            placeholder="Sala fitness..."
                            className="w-full h-8 bg-black border border-white/20 px-2.5 text-xs text-white focus:border-white/60 focus:outline-none" />
                        </div>
                        <div>
                          <div className="text-[8px] text-gray-700 uppercase tracking-widest mb-1">Подпись RU</div>
                          <input value={c.label_ru} onChange={e => upd({ ...c, label_ru: e.target.value })}
                            placeholder="Фитнес-зал..."
                            className="w-full h-8 bg-black border border-white/20 px-2.5 text-xs text-white focus:border-white/60 focus:outline-none" />
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase tracking-widest text-gray-600 mb-1">Год</div>
                        <input value={c.year} onChange={e => upd({ ...c, year: e.target.value })}
                          placeholder="2024"
                          className="w-20 h-8 bg-black border border-white/20 px-2.5 text-xs text-white focus:border-white/60 focus:outline-none" />
                      </div>
                    </div>
                  )}
                />
              </>
            )}
          </div>

          {/* CTA */}
          <div ref={registerField('cta')} className={activeFieldId === 'cta' ? 'ring-1 ring-white/40 bg-white/[0.03] p-2 -m-2' : ''}>
            <SectionHeader title="CTA блок" visible={data.show_cta} onToggle={() => set('show_cta', !data.show_cta)} />
            {data.show_cta && (
              <div className="space-y-3">
                <BiField label={isRu ? 'Заголовок' : 'Titlu'} value={data.cta_title} onChange={v => set('cta_title', v)} placeholder={DEFAULTS.cta_title} />
                <BiField label={isRu ? 'Описание' : 'Descriere'} value={data.cta_body} onChange={v => set('cta_body', v)} textarea placeholder={DEFAULTS.cta_body} />
                <BiField label={isRu ? 'Текст кнопки' : 'Text buton'} value={data.cta_btn} onChange={v => set('cta_btn', v)} placeholder={DEFAULTS.cta_btn} />
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ══ RIGHT — PREVIEW ══ */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        <div className="shrink-0 bg-white border-b border-gray-200 px-5 py-2.5 flex items-center gap-3">
          <Monitor className="w-4 h-4 text-gray-400" />
          <span className="text-[10px] text-gray-500 flex-1 uppercase tracking-widest">/turnkey-solutions</span>
          <div className="flex items-center border border-gray-200">
            {(['ro', 'ru'] as const).map(l => (
              <button key={l} onClick={() => setPreviewLang(l)}
                className={`flex items-center gap-1 px-2.5 py-1 text-[10px] uppercase tracking-wider transition-colors ${
                  previewLang === l ? 'bg-black text-white' : 'text-gray-400 hover:text-black'
                }`}>
                <Globe className="w-2.5 h-2.5" /> {l.toUpperCase()}
              </button>
            ))}
          </div>
          <div className={`flex items-center gap-1.5 text-[10px] uppercase tracking-widest ${hasChanges ? 'text-amber-500' : 'text-gray-400'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${hasChanges ? 'bg-amber-400' : 'bg-green-400'}`} />
            {hasChanges ? (isRu ? 'Не сохранено' : 'Nesalvat') : (isRu ? 'Актуально' : 'Actualizat')}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Preview data={data} lang={previewLang} activeFieldId={activeFieldId} focusField={focusField} />
        </div>
      </div>

    </div>
  );
}
