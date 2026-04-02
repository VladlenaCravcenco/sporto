import { useEffect, useState } from 'react';
import { Save, Plus, Trash2, Eye, EyeOff, ChevronUp, ChevronDown } from 'lucide-react';
import { useAdminLang } from '../contexts/AdminLangContext';
import { toast } from 'sonner';
import { usePreviewFieldFocus } from '../hooks/usePreviewFieldFocus';
import {
  DEFAULTS,
  loadFromSupabase,
  saveToSupabase,
  invalidateCache,
  type BiText,
  type DeliveryZone,
  type PageData,
  type PackagePlan,
  type SectionKey,
  type Service,
  type Stat,
  type Step,
} from './maintenanceContent';

function bi(ro = '', ru = ''): BiText {
  return { ro, ru };
}

function BiField({ label, value, onChange, textarea }: {
  label: string;
  value: BiText;
  onChange: (value: BiText) => void;
  textarea?: boolean;
}) {
  const base = 'w-full bg-black border border-white/20 px-2.5 text-xs text-white placeholder-gray-700 focus:border-white/60 focus:outline-none transition-colors';
  return (
    <div>
      <div className="text-[9px] uppercase tracking-widest text-gray-600 mb-1">{label}</div>
      <div className="grid grid-cols-2 gap-2">
        {(['ro', 'ru'] as const).map((lang) => (
          <div key={lang}>
            <div className="text-[8px] text-gray-700 uppercase tracking-widest mb-1">{lang.toUpperCase()}</div>
            {textarea ? (
              <textarea
                rows={3}
                value={value[lang]}
                onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
                className={`${base} py-1.5 resize-none`}
              />
            ) : (
              <input
                value={value[lang]}
                onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
                className={`${base} h-8`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TextField({ label, value, onChange }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-widest text-gray-600 mb-1">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-8 bg-black border border-white/20 px-2.5 text-xs text-white focus:border-white/60 focus:outline-none transition-colors"
      />
    </div>
  );
}

function TextAreaField({ label, value, onChange, rows = 4 }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-widest text-gray-600 mb-1">{label}</div>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-black border border-white/20 px-2.5 py-1.5 text-xs text-white focus:border-white/60 focus:outline-none transition-colors resize-none"
      />
    </div>
  );
}

function CardList<T>({
  items,
  onUpdate,
  onAdd,
  onRemove,
  onMove,
  renderCard,
}: {
  items: T[];
  onUpdate: (items: T[]) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onMove: (index: number, dir: -1 | 1) => void;
  renderCard: (item: T, index: number, update: (value: T) => void) => React.ReactNode;
}) {
  const { lang } = useAdminLang();
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="border border-white/10 p-2.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] text-gray-600">#{index + 1}</span>
            <div className="flex items-center gap-0.5">
              <button onClick={() => onMove(index, -1)} disabled={index === 0} className="w-5 h-5 flex items-center justify-center text-gray-700 hover:text-white disabled:opacity-20">
                <ChevronUp className="w-3 h-3" />
              </button>
              <button onClick={() => onMove(index, 1)} disabled={index === items.length - 1} className="w-5 h-5 flex items-center justify-center text-gray-700 hover:text-white disabled:opacity-20">
                <ChevronDown className="w-3 h-3" />
              </button>
              <button onClick={() => onRemove(index)} className="w-5 h-5 flex items-center justify-center text-gray-700 hover:text-red-400">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          {renderCard(item, index, (value: T) => {
            const next = [...items];
            next[index] = value;
            onUpdate(next);
          })}
        </div>
      ))}
      <button onClick={onAdd} className="w-full border border-dashed border-white/15 py-2 text-[10px] text-gray-600 hover:text-gray-400 hover:border-white/30 transition-colors flex items-center justify-center gap-1.5">
        <Plus className="w-3 h-3" />
        {lang === 'ru' ? 'Добавить' : 'Adaugă'}
      </button>
    </div>
  );
}

function Preview({ data, lang, activeFieldId, focusField }: { data: PageData; lang: 'ro' | 'ru'; activeFieldId: string | null; focusField: (id: string) => void }) {
  const t = (value: BiText) => value[lang] || value.ro;
  const packageFeatures = (item: PackagePlan) => (lang === 'ro' ? item.features_ro : item.features_ru).split('\n').filter(Boolean);

  const sections: Record<SectionKey, React.ReactNode> = {
    stats: data.show_stats ? (
      <button type="button" onClick={() => focusField('stats')} className={`block w-full text-left px-6 py-6 border-b transition-colors ${activeFieldId === 'stats' ? 'border-black/30 bg-gray-50' : 'border-gray-100 hover:bg-gray-50'}`}>
        <div className="grid grid-cols-3 divide-x divide-gray-100">
          {data.stats.map((s, i) => (
            <div key={i} className="px-4 first:pl-0 py-2">
              <div className="text-2xl text-black mb-1">{t(s.n)}</div>
              <div className="text-[10px] uppercase tracking-widest text-gray-400">{t(s.label)}</div>
            </div>
          ))}
        </div>
      </button>
    ) : null,
    services: data.show_services ? (
      <button type="button" onClick={() => focusField('services')} className={`block w-full text-left px-6 py-6 border-b transition-colors ${activeFieldId === 'services' ? 'border-black/30 bg-gray-50' : 'border-gray-100 hover:bg-gray-50'}`}>
        <div className="text-[10px] uppercase tracking-[0.2em] text-gray-300 mb-3">{t(data.services_eyebrow)}</div>
        <h2 className="text-2xl whitespace-pre-line mb-5">{t(data.services_title)}</h2>
        <div className="grid grid-cols-2 gap-4">
          {data.services.map((item) => (
            <div key={item.num}>
              <div className="text-[10px] uppercase tracking-[0.2em] text-gray-300 mb-2">{item.num}</div>
              <div className="text-sm text-black mb-2">{t(item.title)}</div>
              <div className="text-xs text-gray-500">{t(item.body)}</div>
            </div>
          ))}
        </div>
      </button>
    ) : null,
    packages: data.show_packages ? (
      <button type="button" onClick={() => focusField('packages')} className={`block w-full text-left px-6 py-6 border-b transition-colors ${activeFieldId === 'packages' ? 'border-black/30 bg-gray-100' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}>
        <div className="text-[10px] uppercase tracking-[0.2em] text-gray-300 mb-3">{t(data.packages_eyebrow)}</div>
        <h2 className="text-2xl whitespace-pre-line mb-5">{t(data.packages_title)}</h2>
        <div className="grid grid-cols-3 gap-3">
          {data.packages.map((item, i) => (
            <div key={i} className={`border p-4 ${item.featured ? 'bg-black text-white border-black' : 'bg-white border-gray-200'}`}>
              <div className="text-xs mb-1">{item.name}</div>
              <div className="text-[11px] mb-3">{t(item.note)}</div>
              <div className="text-2xl mb-3">{item.price}{item.currency}<span className="text-sm ml-1">{t(item.period)}</span></div>
              <div className="space-y-1 mb-3">
                {packageFeatures(item).map((feature, idx) => <div key={idx} className="text-[11px]">{feature}</div>)}
              </div>
              <div className="text-[10px] uppercase tracking-widest">{t(item.cta)}</div>
            </div>
          ))}
        </div>
      </button>
    ) : null,
    process: data.show_process ? (
      <button type="button" onClick={() => focusField('process')} className={`block w-full text-left px-6 py-6 border-b transition-colors ${activeFieldId === 'process' ? 'border-black/30 bg-gray-50' : 'border-gray-100 hover:bg-gray-50'}`}>
        <div className="text-[10px] uppercase tracking-[0.2em] text-gray-300 mb-3">{t(data.process_eyebrow)}</div>
        <h2 className="text-2xl whitespace-pre-line mb-5">{t(data.process_title)}</h2>
        <div className="space-y-3">
          {data.steps.map((step) => (
            <div key={step.n} className="border border-gray-100 p-3">
              <div className="text-[10px] uppercase tracking-[0.2em] text-gray-300 mb-1">{step.n}</div>
              <div className="text-sm text-black mb-1">{t(step.title)}</div>
              <div className="text-xs text-gray-500">{t(step.body)}</div>
            </div>
          ))}
        </div>
      </button>
    ) : null,
    delivery: data.show_delivery ? (
      <button type="button" onClick={() => focusField('delivery')} className={`block w-full text-left px-6 py-6 border-b transition-colors ${activeFieldId === 'delivery' ? 'border-black/30 bg-gray-100' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}>
        <div className="text-[10px] uppercase tracking-[0.2em] text-gray-300 mb-3">{t(data.delivery_eyebrow)}</div>
        <h2 className="text-2xl whitespace-pre-line mb-3">{t(data.delivery_title)}</h2>
        <p className="text-sm text-gray-500 mb-5">{t(data.delivery_desc)}</p>
        <div className="grid grid-cols-2 gap-3">
          {data.delivery_zones.map((zone, i) => (
            <div key={i} className="bg-white border border-gray-200 p-4">
              <div className="text-sm text-black mb-2">{t(zone.city)}</div>
              <div className="text-xs text-gray-500">{t(zone.time)}</div>
              <div className="text-xs text-gray-500">{t(zone.price)}</div>
            </div>
          ))}
        </div>
      </button>
    ) : null,
    cta: data.show_cta ? (
      <button type="button" onClick={() => focusField('cta')} className={`block w-full text-left px-6 py-6 transition-colors ${activeFieldId === 'cta' ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
        <div className="bg-black text-white px-6 py-8">
          <h2 className="text-2xl whitespace-pre-line mb-3">{t(data.cta_title)}</h2>
          <p className="text-sm text-gray-400 mb-4">{t(data.cta_body)}</p>
          <div className="text-[10px] uppercase tracking-widest">{t(data.cta_btn)}</div>
        </div>
      </button>
    ) : null,
  };

  return (
    <div className="bg-white min-h-full text-black">
      <button type="button" onClick={() => focusField('hero')} className={`block w-full text-left px-6 pt-8 pb-6 border-b transition-colors ${activeFieldId === 'hero' ? 'border-black/30 bg-gray-50' : 'border-gray-100 hover:bg-gray-50'}`}>
        <div className="text-[10px] uppercase tracking-[0.2em] text-gray-300 mb-3">{t(data.hero_eyebrow)}</div>
        <h1 className="text-3xl whitespace-pre-line mb-4">{t(data.hero_title)}</h1>
        <p className="text-sm text-gray-500 mb-4">{t(data.hero_body)}</p>
        <div className="inline-flex items-center gap-2 bg-black text-white px-5 py-2.5 text-[10px] uppercase tracking-widest">{t(data.hero_cta)}</div>
        <div className="text-xs text-gray-400 mt-3">{t(data.hero_sub)}</div>
      </button>
      {data.section_order.map((key) => <div key={key}>{sections[key]}</div>)}
    </div>
  );
}

const SECTION_TITLES: Record<SectionKey, string> = {
  stats: 'Stats',
  services: 'Services',
  packages: 'Packages',
  process: 'Process',
  delivery: 'Delivery',
  cta: 'CTA',
};

export function AdminMaintenance() {
  const { lang } = useAdminLang();
  const isRu = lang === 'ru';
  const l = (ro: string, ru: string) => (isRu ? ru : ro);
  const [data, setData] = useState<PageData>({ ...DEFAULTS });
  const [published, setPublished] = useState<PageData>({ ...DEFAULTS });
  const [previewLang, setPreviewLang] = useState<'ro' | 'ru'>('ro');
  const [saving, setSaving] = useState(false);
  const { activeFieldId, registerField, focusField } = usePreviewFieldFocus();

  useEffect(() => {
    loadFromSupabase().then((next) => {
      setData(next);
      setPublished(next);
    });
  }, []);

  const hasChanges = JSON.stringify(data) !== JSON.stringify(published);

  const setField = <K extends keyof PageData>(key: K, value: PageData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const listHelpers = <T,>(key: keyof PageData, empty: () => T) => {
    const items = data[key] as T[];
    return {
      onUpdate: (next: T[]) => setField(key as keyof PageData, next as PageData[keyof PageData]),
      onAdd: () => setField(key as keyof PageData, [...items, empty()] as PageData[keyof PageData]),
      onRemove: (index: number) => setField(key as keyof PageData, items.filter((_, i) => i !== index) as PageData[keyof PageData]),
      onMove: (index: number, dir: -1 | 1) => {
        const next = [...items];
        const to = index + dir;
        if (to < 0 || to >= next.length) return;
        [next[index], next[to]] = [next[to], next[index]];
        setField(key as keyof PageData, next as PageData[keyof PageData]);
      },
    };
  };

  const moveSection = (index: number, dir: -1 | 1) => {
    const next = [...data.section_order];
    const to = index + dir;
    if (to < 0 || to >= next.length) return;
    [next[index], next[to]] = [next[to], next[index]];
    setField('section_order', next);
  };

  const showKey = (section: SectionKey): keyof PageData => {
    const map: Record<SectionKey, keyof PageData> = {
      stats: 'show_stats',
      services: 'show_services',
      packages: 'show_packages',
      process: 'show_process',
      delivery: 'show_delivery',
      cta: 'show_cta',
    };
    return map[section];
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveToSupabase(data);
      invalidateCache(data);
      setPublished({ ...data });
      toast(isRu ? '✓ Сохранено' : '✓ Salvat');
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

  return (
    <div className="flex h-[calc(100vh-48px)] overflow-hidden bg-black">
      <div className="w-[520px] shrink-0 flex flex-col border-r border-white/10 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-black border-b border-white/10 px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em]">{l('Pagină', 'Страница')}</p>
              <h1 className="text-base text-white">/maintenance-service</h1>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleReset} className="h-8 px-3 text-[10px] text-gray-600 border border-white/10 hover:border-white/30 hover:text-gray-300 uppercase tracking-wider">
                {isRu ? 'Сброс' : 'Reset'}
              </button>
              <button onClick={handleSave} disabled={!hasChanges || saving} className={`flex items-center gap-1.5 px-4 h-8 text-xs uppercase tracking-widest ${hasChanges ? 'bg-white text-black hover:bg-gray-100' : 'bg-white/10 text-gray-600 cursor-default'}`}>
                <Save className="w-3 h-3" />
                {saving ? (isRu ? 'Сохраняем' : 'Salvare') : (isRu ? 'Сохранить' : 'Salvează')}
              </button>
            </div>
          </div>
        </div>

        <div className="px-5 py-5 space-y-6">
          <div ref={registerField('hero')} className={activeFieldId === 'hero' ? 'ring-1 ring-white/40 bg-white/[0.03] p-2 -m-2' : ''}>
            <div className="text-[9px] uppercase tracking-widest text-gray-600 mb-2 pb-1.5 border-b border-white/10">Hero</div>
            <div className="space-y-3">
              <BiField label="Eyebrow" value={data.hero_eyebrow} onChange={(value) => setField('hero_eyebrow', value)} />
              <BiField label={isRu ? 'Заголовок' : 'Titlu'} value={data.hero_title} onChange={(value) => setField('hero_title', value)} textarea />
              <BiField label={isRu ? 'Описание' : 'Descriere'} value={data.hero_body} onChange={(value) => setField('hero_body', value)} textarea />
              <BiField label="CTA" value={data.hero_cta} onChange={(value) => setField('hero_cta', value)} />
              <BiField label={isRu ? 'Подпись под CTA' : 'Text sub CTA'} value={data.hero_sub} onChange={(value) => setField('hero_sub', value)} />
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
                    <button onClick={() => setField(showKey(section), (!visible) as PageData[keyof PageData])} className={`w-6 h-6 flex items-center justify-center ${visible ? 'text-green-400' : 'text-gray-600'}`}>
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

          <div ref={registerField('stats')} className={activeFieldId === 'stats' ? 'ring-1 ring-white/40 bg-white/[0.03] p-2 -m-2' : ''}>
            <div className="text-[9px] uppercase tracking-widest text-gray-600 mb-2 pb-1.5 border-b border-white/10">Stats</div>
            <CardList
              items={data.stats}
              {...listHelpers<Stat>('stats', () => ({ n: bi(), label: bi() }))}
              renderCard={(item, _, update) => (
                <div className="space-y-2">
                  <BiField label={isRu ? 'Число' : 'Cifra'} value={item.n} onChange={(value) => update({ ...item, n: value })} />
                  <BiField label={isRu ? 'Подпись' : 'Etichetă'} value={item.label} onChange={(value) => update({ ...item, label: value })} />
                </div>
              )}
            />
          </div>

          <div ref={registerField('services')} className={activeFieldId === 'services' ? 'ring-1 ring-white/40 bg-white/[0.03] p-2 -m-2' : ''}>
            <div className="text-[9px] uppercase tracking-widest text-gray-600 mb-2 pb-1.5 border-b border-white/10">Services</div>
            <div className="space-y-3 mb-3">
              <BiField label="Eyebrow" value={data.services_eyebrow} onChange={(value) => setField('services_eyebrow', value)} />
              <BiField label={isRu ? 'Заголовок секции' : 'Titlu secțiune'} value={data.services_title} onChange={(value) => setField('services_title', value)} textarea />
            </div>
            <CardList
              items={data.services}
              {...listHelpers<Service>('services', () => ({ num: String(data.services.length + 1).padStart(2, '0'), title: bi(), body: bi() }))}
              renderCard={(item, _, update) => (
                <div className="space-y-2">
                  <TextField label={isRu ? 'Номер' : 'Număr'} value={item.num} onChange={(value) => update({ ...item, num: value })} />
                  <BiField label={isRu ? 'Заголовок' : 'Titlu'} value={item.title} onChange={(value) => update({ ...item, title: value })} />
                  <BiField label={isRu ? 'Описание' : 'Descriere'} value={item.body} onChange={(value) => update({ ...item, body: value })} textarea />
                </div>
              )}
            />
          </div>

          <div ref={registerField('packages')} className={activeFieldId === 'packages' ? 'ring-1 ring-white/40 bg-white/[0.03] p-2 -m-2' : ''}>
            <div className="text-[9px] uppercase tracking-widest text-gray-600 mb-2 pb-1.5 border-b border-white/10">Packages</div>
            <div className="space-y-3 mb-3">
              <BiField label="Eyebrow" value={data.packages_eyebrow} onChange={(value) => setField('packages_eyebrow', value)} />
              <BiField label={isRu ? 'Заголовок секции' : 'Titlu secțiune'} value={data.packages_title} onChange={(value) => setField('packages_title', value)} textarea />
            </div>
            <CardList
              items={data.packages}
              {...listHelpers<PackagePlan>('packages', () => ({
                name: '',
                price: '',
                currency: '€',
                period: bi(),
                note: bi(),
                features_ro: '',
                features_ru: '',
                featured: false,
                cta: bi(),
              }))}
              renderCard={(item, _, update) => (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <TextField label={isRu ? 'Название' : 'Nume'} value={item.name} onChange={(value) => update({ ...item, name: value })} />
                    <TextField label={isRu ? 'Цена' : 'Preț'} value={item.price} onChange={(value) => update({ ...item, price: value })} />
                    <TextField label={isRu ? 'Валюта' : 'Valută'} value={item.currency} onChange={(value) => update({ ...item, currency: value })} />
                  </div>
                  <BiField label={isRu ? 'Период' : 'Perioadă'} value={item.period} onChange={(value) => update({ ...item, period: value })} />
                  <BiField label={isRu ? 'Подпись' : 'Notă'} value={item.note} onChange={(value) => update({ ...item, note: value })} />
                  <BiField label="CTA" value={item.cta} onChange={(value) => update({ ...item, cta: value })} />
                  <TextAreaField label="Features RO" value={item.features_ro} onChange={(value) => update({ ...item, features_ro: value })} rows={5} />
                  <TextAreaField label="Features RU" value={item.features_ru} onChange={(value) => update({ ...item, features_ru: value })} rows={5} />
                  <label className="flex items-center gap-2 text-xs text-gray-400">
                    <input type="checkbox" checked={item.featured} onChange={(e) => update({ ...item, featured: e.target.checked })} />
                    Featured
                  </label>
                </div>
              )}
            />
          </div>

          <div ref={registerField('process')} className={activeFieldId === 'process' ? 'ring-1 ring-white/40 bg-white/[0.03] p-2 -m-2' : ''}>
            <div className="text-[9px] uppercase tracking-widest text-gray-600 mb-2 pb-1.5 border-b border-white/10">Process</div>
            <div className="space-y-3 mb-3">
              <BiField label="Eyebrow" value={data.process_eyebrow} onChange={(value) => setField('process_eyebrow', value)} />
              <BiField label={isRu ? 'Заголовок секции' : 'Titlu secțiune'} value={data.process_title} onChange={(value) => setField('process_title', value)} textarea />
            </div>
            <CardList
              items={data.steps}
              {...listHelpers<Step>('steps', () => ({ n: String(data.steps.length + 1).padStart(2, '0'), title: bi(), body: bi() }))}
              renderCard={(item, _, update) => (
                <div className="space-y-2">
                  <TextField label={isRu ? 'Номер' : 'Număr'} value={item.n} onChange={(value) => update({ ...item, n: value })} />
                  <BiField label={isRu ? 'Заголовок' : 'Titlu'} value={item.title} onChange={(value) => update({ ...item, title: value })} />
                  <BiField label={isRu ? 'Описание' : 'Descriere'} value={item.body} onChange={(value) => update({ ...item, body: value })} textarea />
                </div>
              )}
            />
          </div>

          <div ref={registerField('delivery')} className={activeFieldId === 'delivery' ? 'ring-1 ring-white/40 bg-white/[0.03] p-2 -m-2' : ''}>
            <div className="text-[9px] uppercase tracking-widest text-gray-600 mb-2 pb-1.5 border-b border-white/10">Delivery</div>
            <div className="space-y-3 mb-3">
              <BiField label="Eyebrow" value={data.delivery_eyebrow} onChange={(value) => setField('delivery_eyebrow', value)} />
              <BiField label={isRu ? 'Заголовок секции' : 'Titlu secțiune'} value={data.delivery_title} onChange={(value) => setField('delivery_title', value)} textarea />
              <BiField label={isRu ? 'Описание' : 'Descriere'} value={data.delivery_desc} onChange={(value) => setField('delivery_desc', value)} textarea />
              <BiField label={isRu ? 'Текст ссылки' : 'Text link'} value={data.delivery_link} onChange={(value) => setField('delivery_link', value)} />
            </div>
            <CardList
              items={data.delivery_zones}
              {...listHelpers<DeliveryZone>('delivery_zones', () => ({ city: bi(), time: bi(), price: bi() }))}
              renderCard={(item, _, update) => (
                <div className="space-y-2">
                  <BiField label={isRu ? 'Город' : 'Oraș'} value={item.city} onChange={(value) => update({ ...item, city: value })} />
                  <BiField label={isRu ? 'Срок' : 'Termen'} value={item.time} onChange={(value) => update({ ...item, time: value })} />
                  <BiField label={isRu ? 'Цена' : 'Preț'} value={item.price} onChange={(value) => update({ ...item, price: value })} />
                </div>
              )}
            />
          </div>

          <div ref={registerField('cta')} className={activeFieldId === 'cta' ? 'ring-1 ring-white/40 bg-white/[0.03] p-2 -m-2' : ''}>
            <div className="text-[9px] uppercase tracking-widest text-gray-600 mb-2 pb-1.5 border-b border-white/10">CTA</div>
            <div className="space-y-3">
              <BiField label={isRu ? 'Заголовок' : 'Titlu'} value={data.cta_title} onChange={(value) => setField('cta_title', value)} textarea />
              <BiField label={isRu ? 'Описание' : 'Descriere'} value={data.cta_body} onChange={(value) => setField('cta_body', value)} textarea />
              <BiField label="CTA" value={data.cta_btn} onChange={(value) => setField('cta_btn', value)} />
              <BiField label={isRu ? 'Текст ссылки' : 'Text link'} value={data.cta_link} onChange={(value) => setField('cta_link', value)} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-12 border-b border-white/10 flex items-center justify-between px-5 bg-black">
          <div className="text-[10px] text-gray-600 uppercase tracking-widest">Preview</div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPreviewLang('ro')} className={`px-3 py-1 text-[10px] uppercase tracking-wider ${previewLang === 'ro' ? 'bg-white/10 text-white' : 'text-gray-600 hover:text-gray-400'}`}>RO</button>
            <button onClick={() => setPreviewLang('ru')} className={`px-3 py-1 text-[10px] uppercase tracking-wider ${previewLang === 'ru' ? 'bg-white/10 text-white' : 'text-gray-600 hover:text-gray-400'}`}>RU</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto bg-white">
          <Preview data={data} lang={previewLang} activeFieldId={activeFieldId} focusField={focusField} />
        </div>
      </div>
    </div>
  );
}
