import { AdminBilingualField, AdminEditorSection } from '../components/AdminEditorSection';
import { AdminEditorWorkspace } from '../components/AdminEditorWorkspace';
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

const BiField = AdminBilingualField;

function TextField({ label, value, onChange }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <div className="text-xs   admin-muted mb-1">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-8 admin-surface border admin-border px-2.5 text-xs admin-ink admin-focus-border focus:outline-none transition-colors"
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
      <div className="text-xs   admin-muted mb-1">{label}</div>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full admin-surface border admin-border px-2.5 py-1.5 text-xs admin-ink admin-focus-border focus:outline-none transition-colors resize-none"
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
        <div key={index} className="border admin-border p-2.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs admin-muted">#{index + 1}</span>
            <div className="flex items-center gap-0.5">
              <button aria-label={lang === 'ru' ? 'Переместить выше' : 'Mută în sus'} onClick={() => onMove(index, -1)} disabled={index === 0} className="w-5 h-5 flex items-center justify-center admin-ink admin-hover-ink disabled:opacity-20">
                <ChevronUp className="w-3 h-3" />
              </button>
              <button aria-label={lang === 'ru' ? 'Переместить ниже' : 'Mută în jos'} onClick={() => onMove(index, 1)} disabled={index === items.length - 1} className="w-5 h-5 flex items-center justify-center admin-ink admin-hover-ink disabled:opacity-20">
                <ChevronDown className="w-3 h-3" />
              </button>
              <button aria-label={lang === 'ru' ? 'Удалить элемент' : 'Șterge elementul'} onClick={() => onRemove(index)} className="w-5 h-5 flex items-center justify-center admin-ink hover:text-red-400">
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
      <button onClick={onAdd} className="w-full border border-dashed admin-border py-2 text-xs admin-muted hover:text-gray-400 admin-hover-border transition-colors flex items-center justify-center gap-1.5">
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
        <div className="grid grid-cols-1 divide-y divide-gray-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {data.stats.map((s, i) => (
            <div key={i} className="px-0 py-3 first:pt-0 last:pb-0 sm:px-4 sm:first:pl-0 sm:py-2">
              <div className="text-2xl text-black mb-1">{t(s.n)}</div>
              <div className="text-[10px] uppercase tracking-widest text-gray-400">{t(s.label)}</div>
            </div>
          ))}
        </div>
      </button>
    ) : null,
    services: data.show_services ? (
      <button type="button" onClick={() => focusField('services')} className={`block w-full text-left px-4 py-6 sm:px-6 border-b transition-colors ${activeFieldId === 'services' ? 'border-black/30 bg-gray-50' : 'border-gray-100 hover:bg-gray-50'}`}>
        <div className="text-[10px] uppercase tracking-[0.2em] text-gray-300 mb-3">{t(data.services_eyebrow)}</div>
        <h2 className="text-xl whitespace-pre-line mb-5 sm:text-2xl">{t(data.services_title)}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
      <button type="button" onClick={() => focusField('packages')} className={`block w-full text-left px-4 py-6 sm:px-6 border-b transition-colors ${activeFieldId === 'packages' ? 'border-black/30 bg-gray-100' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}>
        <div className="text-[10px] uppercase tracking-[0.2em] text-gray-300 mb-3">{t(data.packages_eyebrow)}</div>
        <h2 className="text-xl whitespace-pre-line mb-5 sm:text-2xl">{t(data.packages_title)}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
      <button type="button" onClick={() => focusField('process')} className={`block w-full text-left px-4 py-6 sm:px-6 border-b transition-colors ${activeFieldId === 'process' ? 'border-black/30 bg-gray-50' : 'border-gray-100 hover:bg-gray-50'}`}>
        <div className="text-[10px] uppercase tracking-[0.2em] text-gray-300 mb-3">{t(data.process_eyebrow)}</div>
        <h2 className="text-xl whitespace-pre-line mb-5 sm:text-2xl">{t(data.process_title)}</h2>
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
      <button type="button" onClick={() => focusField('delivery')} className={`block w-full text-left px-4 py-6 sm:px-6 border-b transition-colors ${activeFieldId === 'delivery' ? 'border-black/30 bg-gray-100' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}>
        <div className="text-[10px] uppercase tracking-[0.2em] text-gray-300 mb-3">{t(data.delivery_eyebrow)}</div>
        <h2 className="text-xl whitespace-pre-line mb-3 sm:text-2xl">{t(data.delivery_title)}</h2>
        <p className="text-sm text-gray-500 mb-5">{t(data.delivery_desc)}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
      <button type="button" onClick={() => focusField('cta')} className={`block w-full text-left px-4 py-6 sm:px-6 transition-colors ${activeFieldId === 'cta' ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
        <div className="bg-black text-white px-4 py-8 sm:px-6">
          <h2 className="text-xl whitespace-pre-line mb-3 sm:text-2xl">{t(data.cta_title)}</h2>
          <p className="text-sm text-gray-400 mb-4">{t(data.cta_body)}</p>
          <div className="text-[10px] uppercase tracking-widest">{t(data.cta_btn)}</div>
        </div>
      </button>
    ) : null,
  };

  return (
    <div className="bg-white min-h-full text-black">
      <button type="button" onClick={() => focusField('hero')} className={`block w-full text-left px-4 pt-8 pb-6 sm:px-6 border-b transition-colors ${activeFieldId === 'hero' ? 'border-black/30 bg-gray-50' : 'border-gray-100 hover:bg-gray-50'}`}>
        <div className="text-[10px] uppercase tracking-[0.2em] text-gray-300 mb-3">{t(data.hero_eyebrow)}</div>
        <h1 className="text-2xl whitespace-pre-line mb-4 sm:text-3xl">{t(data.hero_title)}</h1>
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
    <AdminEditorWorkspace languages>
      <div className="admin-editor-pane">
        <div className="sticky top-[88px] z-10 admin-surface border-b admin-border px-4 py-4 sm:px-5 lg:top-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs admin-muted  ">{l('Pagină', 'Страница')}</p>
              <h1 className="break-all text-sm admin-ink sm:text-base">{isRu ? 'Техническое обслуживание' : 'Întreținere tehnică'}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={handleReset} className="h-8 px-3 text-xs admin-muted border admin-border admin-hover-border hover:text-gray-300  ">
                {isRu ? 'Сброс' : 'Reset'}
              </button>
              <button onClick={handleSave} disabled={!hasChanges || saving} className={`flex items-center gap-1.5 px-4 h-8 text-xs   ${hasChanges ? 'admin-solid admin-on-solid admin-hover-surface' : 'admin-muted-surface admin-muted cursor-default'}`}>
                <Save className="w-3 h-3" />
                {saving ? (isRu ? 'Сохраняем' : 'Salvare') : (isRu ? 'Сохранить' : 'Salvează')}
              </button>
            </div>
          </div>
        </div>

        <div className="min-w-0 px-4 py-5 space-y-6 sm:px-5">
          <AdminEditorSection ref={registerField('hero')} title={isRu ? 'Первый экран' : 'Primul ecran'} defaultOpen>

            <div className="space-y-3">
              <BiField label={isRu ? 'Надпись над заголовком' : 'Text deasupra titlului'} value={data.hero_eyebrow} onChange={(value) => setField('hero_eyebrow', value)} />
              <BiField label={isRu ? 'Заголовок' : 'Titlu'} value={data.hero_title} onChange={(value) => setField('hero_title', value)} textarea />
              <BiField label={isRu ? 'Описание' : 'Descriere'} value={data.hero_body} onChange={(value) => setField('hero_body', value)} textarea />
              <BiField label={isRu ? 'Текст кнопки' : 'Textul butonului'} value={data.hero_cta} onChange={(value) => setField('hero_cta', value)} />
              <BiField label={isRu ? 'Подпись под кнопкой' : 'Text sub buton'} value={data.hero_sub} onChange={(value) => setField('hero_sub', value)} />
            </div>
          </AdminEditorSection>

          <AdminEditorSection ref={registerField('section_order')} title={isRu ? 'Порядок и видимость блоков' : 'Ordinea și vizibilitatea secțiunilor'}>

            <div className="space-y-2">
              {data.section_order.map((section, index) => {
                const visible = data[showKey(section)] as boolean;
                return (
                  <div key={section} className="border admin-border px-3 py-2 flex items-center gap-2">
                    <div className="min-w-0 flex-1 break-words text-xs admin-muted  ">{isRu ? ({stats:'Цифры и преимущества',packages:'Пакеты обслуживания',process:'Этапы работы',services:'Услуги',delivery:'Доставка',cta:'Контактный блок'}[section]) : ({stats:'Cifre și avantaje',packages:'Pachete',process:'Etape',services:'Servicii',delivery:'Livrare',cta:'Contact'}[section])}</div>
                    <button onClick={() => setField(showKey(section), (!visible) as PageData[keyof PageData])} className={`w-6 h-6 flex items-center justify-center ${visible ? 'text-green-400' : 'admin-muted'}`}>
                      {visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    </button>
                    <button onClick={() => moveSection(index, -1)} disabled={index === 0} className="w-6 h-6 flex items-center justify-center admin-ink admin-hover-ink disabled:opacity-20">
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button onClick={() => moveSection(index, 1)} disabled={index === data.section_order.length - 1} className="w-6 h-6 flex items-center justify-center admin-ink admin-hover-ink disabled:opacity-20">
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </AdminEditorSection>

          <AdminEditorSection ref={registerField('stats')} title={isRu ? 'Цифры и преимущества' : 'Cifre și avantaje'}>

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
          </AdminEditorSection>

          <AdminEditorSection ref={registerField('services')} title={isRu ? 'Услуги' : 'Servicii'}>

            <div className="space-y-3 mb-3">
              <BiField label={isRu ? 'Надпись над заголовком' : 'Text deasupra titlului'} value={data.services_eyebrow} onChange={(value) => setField('services_eyebrow', value)} />
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
          </AdminEditorSection>

          <AdminEditorSection ref={registerField('packages')} title={isRu ? 'Пакеты обслуживания' : 'Pachete de servicii'}>

            <div className="space-y-3 mb-3">
              <BiField label={isRu ? 'Надпись над заголовком' : 'Text deasupra titlului'} value={data.packages_eyebrow} onChange={(value) => setField('packages_eyebrow', value)} />
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
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <TextField label={isRu ? 'Название' : 'Nume'} value={item.name} onChange={(value) => update({ ...item, name: value })} />
                    <TextField label={isRu ? 'Цена' : 'Preț'} value={item.price} onChange={(value) => update({ ...item, price: value })} />
                    <TextField label={isRu ? 'Валюта' : 'Valută'} value={item.currency} onChange={(value) => update({ ...item, currency: value })} />
                  </div>
                  <BiField label={isRu ? 'Период' : 'Perioadă'} value={item.period} onChange={(value) => update({ ...item, period: value })} />
                  <BiField label={isRu ? 'Подпись' : 'Notă'} value={item.note} onChange={(value) => update({ ...item, note: value })} />
                  <BiField label={isRu ? 'Текст кнопки' : 'Textul butonului'} value={item.cta} onChange={(value) => update({ ...item, cta: value })} />
                  <BiField label={isRu ? 'Что входит в пакет — каждый пункт с новой строки' : 'Ce include pachetul — câte un punct pe rând'} value={{ro: item.features_ro, ru: item.features_ru}} onChange={value => update({...item, features_ro:value.ro, features_ru:value.ru})} textarea />
                  <label className="flex items-center gap-2 text-xs admin-muted">
                    <input type="checkbox" checked={item.featured} onChange={(e) => update({ ...item, featured: e.target.checked })} />
                    {isRu ? 'Выделить пакет как рекомендуемый' : 'Evidențiază pachetul recomandat'}
                  </label>
                </div>
              )}
            />
          </AdminEditorSection>

          <AdminEditorSection ref={registerField('process')} title={isRu ? 'Этапы работы' : 'Etapele de lucru'}>

            <div className="space-y-3 mb-3">
              <BiField label={isRu ? 'Надпись над заголовком' : 'Text deasupra titlului'} value={data.process_eyebrow} onChange={(value) => setField('process_eyebrow', value)} />
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
          </AdminEditorSection>

          <AdminEditorSection ref={registerField('delivery')} title={isRu ? 'Условия доставки' : 'Condiții de livrare'}>

            <div className="space-y-3 mb-3">
              <BiField label={isRu ? 'Надпись над заголовком' : 'Text deasupra titlului'} value={data.delivery_eyebrow} onChange={(value) => setField('delivery_eyebrow', value)} />
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
          </AdminEditorSection>

          <AdminEditorSection ref={registerField('cta')} title={isRu ? 'Контактный блок' : 'Secțiunea de contact'}>

            <div className="space-y-3">
              <BiField label={isRu ? 'Заголовок' : 'Titlu'} value={data.cta_title} onChange={(value) => setField('cta_title', value)} textarea />
              <BiField label={isRu ? 'Описание' : 'Descriere'} value={data.cta_body} onChange={(value) => setField('cta_body', value)} textarea />
              <BiField label={isRu ? 'Текст кнопки' : 'Textul butonului'} value={data.cta_btn} onChange={(value) => setField('cta_btn', value)} />
              <BiField label={isRu ? 'Текст ссылки' : 'Text link'} value={data.cta_link} onChange={(value) => setField('cta_link', value)} />
            </div>
          </AdminEditorSection>
        </div>
      </div>

      <div className="admin-preview-pane min-w-0 flex-1 flex flex-col overflow-hidden">
        <div className="border-b admin-border px-4 py-3 admin-surface sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs admin-muted  ">Preview</div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPreviewLang('ro')} className={`px-3 py-1 text-xs   ${previewLang === 'ro' ? 'admin-muted-surface admin-ink' : 'admin-muted hover:text-gray-400'}`}>RO</button>
            <button onClick={() => setPreviewLang('ru')} className={`px-3 py-1 text-xs   ${previewLang === 'ru' ? 'admin-muted-surface admin-ink' : 'admin-muted hover:text-gray-400'}`}>RU</button>
          </div>
          </div>
        </div>
        <div data-admin-preview className="flex-1 overflow-y-auto bg-white">
          <Preview data={data} lang={previewLang} activeFieldId={activeFieldId} focusField={focusField} />
        </div>
      </div>
    </AdminEditorWorkspace>
  );
}
