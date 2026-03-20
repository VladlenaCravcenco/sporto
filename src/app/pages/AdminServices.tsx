import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, ArrowRight, Check, Monitor, Globe, Eye, EyeOff, ChevronUp, ChevronDown } from 'lucide-react';
import { useAdminLang } from '../contexts/AdminLangContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

// ── Типы ─────────────────────────────────────────────────────────────────────

interface BiText { ro: string; ru: string }

interface Stat    { n: BiText; label: BiText }
interface Service { num: string; title: BiText; body: BiText }
interface Step    { n: string; title: BiText; body: BiText }
interface Why     { title: BiText; body: BiText }
interface Case    {
  title: BiText;
  body:  BiText;
  image: string;       // URL
  city:  BiText;
  year:  string;
  link:  string;       // опционально
}

interface PageData {
  // visibility
  show_stats:    boolean;
  show_services: boolean;
  show_process:  boolean;
  show_why:      boolean;
  show_cases:    boolean;
  show_cta:      boolean;
  // hero
  hero_title: BiText;
  hero_body:  BiText;
  hero_cta:   BiText;
  hero_sub:   BiText;
  // stats
  stats: Stat[];
  // services
  services_title: BiText;
  services: Service[];
  // process
  process_title: BiText;
  steps: Step[];
  // why
  why_title: BiText;
  why: Why[];
  // cases
  cases_title: BiText;
  cases: Case[];
  cases_title: { ro: 'Proiecte realizate', ru: 'Выполненные проекты' },
  cases: [],
  // cta
  cta_title: BiText;
  cta_body:  BiText;
  cta_btn:   BiText;
}

// ── Дефолты (из TurnkeySolutions.tsx) ────────────────────────────────────────

const DEFAULTS: PageData = {
  show_stats: true, show_services: true, show_process: true, show_why: true, show_cases: false, show_cta: true,
  hero_title: {
    ro: 'Sala ta de fitness,\nde la idee la realitate.',
    ru: 'Ваш фитнес-клуб,\nот нуля до открытия.',
  },
  hero_body: {
    ro: 'Suntem furnizorul care preia tot: analiza spațiului, selecția echipamentelor, livrarea și montajul. Tu te concentrezi pe afacere — noi facem restul.',
    ru: 'Мы партнёр, который берёт на себя всё: анализ помещения, подбор оборудования, доставку и монтаж. Вы сосредоточены на бизнесе — мы делаем остальное.',
  },
  hero_cta: { ro: 'Solicită ofertă gratuită', ru: 'Запросить бесплатное предложение' },
  hero_sub: { ro: 'Răspundem în 24 ore', ru: 'Ответим в течение 24 часов' },
  stats: [
    { n: { ro: '3+',   ru: '3+'   }, label: { ro: 'Ani pe piață',                  ru: 'Года на рынке'           } },
    { n: { ro: '15+',  ru: '15+'  }, label: { ro: 'Furnizori echipament comercial', ru: 'Поставщиков оборудования' } },
    { n: { ro: '100%', ru: '100%' }, label: { ro: 'Transparență',                  ru: 'Прозрачность'             } },
  ],
  services_title: {
    ro: 'Ce primești în cadrul\nSoluțiilor la Cheie?',
    ru: 'Один партнёр\nдля всего процесса',
  },
  services: [
    { num: '01', title: { ro: 'Consultanță & Concept',       ru: 'Консультация & Концепция'        }, body: { ro: 'Analizăm spațiul, bugetul și publicul țintă. Îți livrăm un concept clar, nu promisiuni vagi.', ru: 'Анализируем помещение, бюджет и целевую аудиторию. Предоставляем чёткую концепцию.' } },
    { num: '02', title: { ro: 'Design & Planificare',         ru: 'Дизайн & Планирование'           }, body: { ro: 'Plan de amplasare, varietate mare de design, cantitatea optimală pentru start.', ru: 'Детальный план этажа, оптимизированный поток, 3D-визуализация.' } },
    { num: '03', title: { ro: 'Echipamente Profesionale',     ru: 'Профессиональное оборудование'   }, body: { ro: 'Selecție din catalogul de 8 000+ produse, prețuri angros, livrare directă.', ru: 'Подбор из каталога 8 000+ товаров, оптовые цены, прямая доставка со склада.' } },
    { num: '04', title: { ro: 'Instalare & Training',         ru: 'Монтаж & Обучение'               }, body: { ro: 'Montajul echipamentului și instruirea personalului, garanție și suport pe termen lung.', ru: 'Сертифицированный монтаж, обучение персонала, полная гарантийная документация.' } },
  ],
  process_title: { ro: 'De la idee\nla realitate.', ru: 'От первого разговора\nдо открытия' },
  steps: [
    { n: '01', title: { ro: 'Discuție inițială',    ru: 'Первичное обращение'     }, body: { ro: 'Trimiteți o solicitare. Vă contactăm în 24h pentru a înțelege nevoile și bugetul.', ru: 'Отправьте заявку. Мы свяжемся в течение 24ч, чтобы понять ваши потребности и бюджет.' } },
    { n: '02', title: { ro: 'Concept & Ofertă',     ru: 'Концепция & Предложение' }, body: { ro: 'Primești planul de etaj, lista de echipamente și prețul final — fără costuri ascunse.', ru: 'Вы получите план этажа, список оборудования и финальную цену — без скрытых расходов.' } },
    { n: '03', title: { ro: 'Aprobare & Producție', ru: 'Подтверждение & Подготовка' }, body: { ro: 'Confirmi comanda. Pregătim echipamentele și programăm livrarea.', ru: 'Подтверждаете заказ. Мы готовим оборудование и согласовываем дату доставки.' } },
    { n: '04', title: { ro: 'Livrare & Montaj',     ru: 'Доставка & Монтаж'       }, body: { ro: 'Echipa noastră instalează tot la sediul tău, la data stabilită.', ru: 'Наша команда устанавливает всё на вашем объекте в согласованную дату.' } },
    { n: '05', title: { ro: 'Deschidere & Suport',  ru: 'Открытие & Поддержка'    }, body: { ro: 'Instruim personalul și rămânem disponibili după lansare pentru orice întrebare.', ru: 'Обучаем персонал и остаёмся на связи после запуска по любым вопросам.' } },
  ],
  why_title: { ro: 'Partenerul care\nîți apără investiția', ru: 'Партнёр, который\nзащищает ваши инвестиции' },
  why: [
    { title: { ro: 'Un singur interlocutor',       ru: 'Единый контакт'                  }, body: { ro: 'Nu coordonezi furnizori diferiți. Noi preluăm tot.', ru: 'Не координируете разных поставщиков. Мы берём всё на себя.' } },
    { title: { ro: 'Prețuri angros garantate',     ru: 'Гарантированные оптовые цены'    }, body: { ro: 'Aceleași prețuri ca pentru clienții instituționali.', ru: 'Те же цены, что для институциональных клиентов.' } },
    { title: { ro: 'Termene respectate',           ru: 'Соблюдение сроков'               }, body: { ro: 'Data de livrare e scrisă în contract.', ru: 'Дата поставки зафиксирована в договоре.' } },
    { title: { ro: 'Garanție extinsă',             ru: 'Расширенная гарантия'            }, body: { ro: 'Garanție pe echipamente și pe instalare. Intervenție în 48h.', ru: 'Гарантия на оборудование и монтаж. Выезд в течение 48ч.' } },
    { title: { ro: 'Suport post-lansare',          ru: 'Поддержка после запуска'         }, body: { ro: 'Rămânem disponibili. Inspecție gratuită la 3 luni.', ru: 'Остаёмся на связи. Бесплатная инспекция через 3 месяца.' } },
  ],
  cta_title: { ro: 'Gata să începem?',   ru: 'Готовы начать?' },
  cta_body:  { ro: 'Trimiteți-ne detaliile proiectului. Consultanța inițială și oferta sunt complet gratuite.', ru: 'Отправьте нам детали проекта. Первичная консультация и предложение — полностью бесплатно.' },
  cta_btn:   { ro: 'Discutăm proiectul tău', ru: 'Обсудить ваш проект' },
};

const PAGE_KEY = 'turnkey';

// ── Supabase helpers ──────────────────────────────────────────────────────────

async function loadFromSupabase(): Promise<PageData> {
  const { data } = await supabase
    .from('page_content')
    .select('key, value')
    .eq('page', PAGE_KEY);
  if (!data || data.length === 0) return { ...DEFAULTS };
  const map = Object.fromEntries(data.map(r => [r.key, r.value]));
  try {
    const parsed = JSON.parse(map.data || '{}');
    // ✅ глубокий мёрдж — новые поля берутся из DEFAULTS если их нет в базе
    return {
      ...DEFAULTS,
      ...parsed,
      // BiText поля — защита от undefined
      hero_title:     { ...DEFAULTS.hero_title,     ...(parsed.hero_title     || {}) },
      hero_body:      { ...DEFAULTS.hero_body,       ...(parsed.hero_body      || {}) },
      hero_cta:       { ...DEFAULTS.hero_cta,        ...(parsed.hero_cta       || {}) },
      hero_sub:       { ...DEFAULTS.hero_sub,        ...(parsed.hero_sub       || {}) },
      services_title: { ...DEFAULTS.services_title,  ...(parsed.services_title || {}) },
      process_title:  { ...DEFAULTS.process_title,   ...(parsed.process_title  || {}) },
      why_title:      { ...DEFAULTS.why_title,       ...(parsed.why_title      || {}) },
      cases_title:    { ...DEFAULTS.cases_title,     ...(parsed.cases_title    || {}) },
      cta_title:      { ...DEFAULTS.cta_title,       ...(parsed.cta_title      || {}) },
      cta_body:       { ...DEFAULTS.cta_body,        ...(parsed.cta_body       || {}) },
      cta_btn:        { ...DEFAULTS.cta_btn,         ...(parsed.cta_btn        || {}) },
      // массивы
      stats:    parsed.stats    ?? DEFAULTS.stats,
      services: parsed.services ?? DEFAULTS.services,
      steps:    parsed.steps    ?? DEFAULTS.steps,
      why:      parsed.why      ?? DEFAULTS.why,
      cases:    parsed.cases    ?? DEFAULTS.cases,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

async function saveToSupabase(data: PageData): Promise<void> {
  await supabase.from('page_content').upsert(
    { page: PAGE_KEY, key: 'data', value: JSON.stringify(data) },
    { onConflict: 'page,key' }
  );
}

// ── Хук для публичного использования ─────────────────────────────────────────
// Экспортируем чтобы TurnkeySolutions.tsx мог использовать
let _cache: PageData | null = null;
const _listeners: Set<(d: PageData) => void> = new Set();
let _promise: Promise<void> | null = null;

export function useTurnkeyContent(): PageData {
  const [data, setData] = useState<PageData>(_cache ?? DEFAULTS);
  useEffect(() => {
    if (_cache) { setData(_cache); return; }
    const handler = (d: PageData) => setData(d);
    _listeners.add(handler);
    if (!_promise) {
      _promise = loadFromSupabase().then(d => {
        _cache = d;
        _listeners.forEach(fn => fn(d));
      });
    }
    return () => { _listeners.delete(handler); };
  }, []);
  return data;
}

// ── Утилиты ───────────────────────────────────────────────────────────────────

function bi(ro = '', ru = ''): BiText { return { ro, ru }; }

// ── Компоненты полей ─────────────────────────────────────────────────────────

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
  label: string; value: BiText; onChange: (v: BiText) => void;
  textarea?: boolean; placeholder?: BiText;
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
                  className={cls + ' h-8'} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function CardList<T>({
  items, onUpdate, onAdd, onRemove, onMove, emptyItem, renderCard,
}: {
  items: T[];
  onUpdate: (items: T[]) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
  onMove: (i: number, dir: -1 | 1) => void;
  emptyItem: T;
  renderCard: (item: T, i: number, update: (v: T) => void) => React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="border border-white/10 p-2.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] text-gray-600">#{i + 1}</span>
            <div className="flex items-center gap-0.5">
              <button onClick={() => onMove(i, -1)} disabled={i === 0} className="w-5 h-5 flex items-center justify-center text-gray-700 hover:text-white disabled:opacity-20 transition-colors">
                <ChevronUp className="w-3 h-3" />
              </button>
              <button onClick={() => onMove(i, 1)} disabled={i === items.length - 1} className="w-5 h-5 flex items-center justify-center text-gray-700 hover:text-white disabled:opacity-20 transition-colors">
                <ChevronDown className="w-3 h-3" />
              </button>
              <button onClick={() => onRemove(i)} className="w-5 h-5 flex items-center justify-center text-gray-700 hover:text-red-400 transition-colors">
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

// ── Превью ────────────────────────────────────────────────────────────────────

function Preview({ data, lang }: { data: PageData; lang: 'ro' | 'ru' }) {
 const t = (b: BiText | undefined) => b?.[lang] || b?.ro || '';

  return (
    <div className="bg-white min-h-full text-black">

      {/* Hero */}
      <section className="px-8 pt-10 pb-8 border-b border-gray-100">
        <div className="text-[10px] uppercase tracking-[0.2em] text-gray-300 mb-4">
          {lang === 'ro' ? 'Soluții complete · B2B' : 'Полный комплекс · B2B'}
        </div>
        <h1 className="text-3xl leading-tight tracking-tight whitespace-pre-line mb-4 text-black">
          {t(data.hero_title)}
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed max-w-lg mb-5">{t(data.hero_body)}</p>
        <div className="flex items-center gap-4">
          <div className="inline-flex items-center gap-2 bg-black text-white px-5 py-2.5 text-[10px] uppercase tracking-widest">
            {t(data.hero_cta)}<ArrowRight className="w-3 h-3" />
          </div>
          <span className="text-xs text-gray-400">{t(data.hero_sub)}</span>
        </div>
      </section>

      {/* Stats */}
      {data.show_stats && (
        <section className="px-8 py-6 border-b border-gray-100">
          <div className="grid grid-cols-3 divide-x divide-gray-100">
            {data.stats.map((s, i) => (
              <div key={i} className="px-6 first:pl-0 py-2">
                <div className="text-3xl tabular-nums tracking-tight text-black leading-none mb-1">{t(s.n) || '—'}</div>
                <div className="text-[10px] uppercase tracking-widest text-gray-400">{t(s.label) || '—'}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Services */}
      {data.show_services && (
        <section className="px-8 py-8 border-b border-gray-100">
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
        </section>
      )}

      {/* Process */}
      {data.show_process && (
        <section className="px-8 py-8 border-b border-gray-100 bg-gray-50">
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
        </section>
      )}

      {/* Why */}
      {data.show_why && (
        <section className="px-8 py-8 border-b border-gray-100">
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
        </section>
      )}

      {/* Cases */}
      {data.show_cases && (
        <section className="px-8 py-8 border-b border-gray-100">
          <h2 className="text-xl leading-tight tracking-tight whitespace-pre-line mb-6 text-black">{t(data.cases_title)}</h2>
          {data.cases.length === 0 ? (
            <div className="border border-dashed border-gray-200 py-8 text-center text-xs text-gray-300">
              {lang === 'ro' ? 'Proiecte neadăugate' : 'Проекты не добавлены'}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {data.cases.map((c, i) => (
                <div key={i} className="border border-gray-100 overflow-hidden">
                  {c.image
                    ? <div className="h-32 bg-gray-50 overflow-hidden"><img src={c.image} alt={t(c.title)} className="w-full h-full object-cover" /></div>
                    : <div className="h-32 bg-gray-50 flex items-center justify-center text-[10px] text-gray-300">Фото не добавлено</div>
                  }
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-medium text-black">{t(c.title) || '—'}</span>
                      {c.year && <span className="text-[10px] text-gray-400 flex-shrink-0">{c.year}</span>}
                    </div>
                    {t(c.city) && <div className="text-[10px] text-gray-400 mb-1.5">📍 {t(c.city)}</div>}
                    {t(c.body) && <p className="text-[11px] text-gray-500 leading-relaxed mb-2">{t(c.body)}</p>}
                    {c.link && <a href={c.link} className="text-[10px] text-black border-b border-gray-200 hover:border-black transition-colors">Подробнее →</a>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* CTA */}
      {data.show_cta && (
        <section className="px-8 py-8">
          <div className="bg-black text-white px-8 py-10 text-center">
            <h2 className="text-2xl tracking-tight text-white mb-4">{t(data.cta_title)}</h2>
            <p className="text-sm text-gray-400 leading-relaxed mb-6 max-w-md mx-auto">{t(data.cta_body)}</p>
            <div className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 text-[10px] uppercase tracking-widest">
              {t(data.cta_btn)}<ArrowRight className="w-3 h-3" />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// ── Главный компонент ─────────────────────────────────────────────────────────

export function AdminServices() {
  const { lang } = useAdminLang();
  const isRu = lang === 'ru';

  const [data, setData]           = useState<PageData>({ ...DEFAULTS });
  const [published, setPublished] = useState<PageData>({ ...DEFAULTS });
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [previewLang, setPreviewLang] = useState<'ro' | 'ru'>('ro');

  useEffect(() => {
    loadFromSupabase().then(d => {
      setData(d); setPublished(d); setLoading(false);
    });
  }, []);

  const set = <K extends keyof PageData>(key: K, value: PageData[K]) =>
    setData(p => ({ ...p, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveToSupabase(data);
      _cache = data; // сбрасываем кеш
      _listeners.forEach(fn => fn(data));
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

  // helpers for card lists
  function listHelpers<T>(key: keyof PageData, empty: () => T) {
    const items = data[key] as T[];
    return {
      onUpdate: (v: T[]) => set(key, v as any),
      onAdd:    ()       => set(key, [...items, empty()] as any),
      onRemove: (i: number) => set(key, items.filter((_, j) => j !== i) as any),
      onMove:   (i: number, dir: -1 | 1) => {
        const arr = [...items]; const to = i + dir;
        if (to < 0 || to >= arr.length) return;
        [arr[i], arr[to]] = [arr[to], arr[i]];
        set(key, arr as any);
      },
    };
  }

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
      <div className="w-[420px] shrink-0 flex flex-col border-r border-white/10 overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 z-10 bg-black border-b border-white/10 px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em]">Страница</p>
              <h1 className="text-base text-white">/turnkey-solutions</h1>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleReset} className="h-8 px-3 text-[10px] text-gray-600 border border-white/10 hover:border-white/30 hover:text-gray-300 transition-colors uppercase tracking-wider">
                {isRu ? 'Сброс' : 'Reset'}
              </button>
              <button onClick={handleSave} disabled={saving || !hasChanges}
                className={`flex items-center gap-1.5 px-4 h-8 text-xs uppercase tracking-widest transition-colors ${hasChanges && !saving ? 'bg-white text-black hover:bg-gray-100' : 'bg-white/10 text-gray-600 cursor-default'}`}>
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
          <div>
            <div className="text-[9px] uppercase tracking-widest text-gray-600 mb-2 pb-1.5 border-b border-white/10">Hero</div>
            <div className="space-y-3">
              <BiField label={isRu ? 'Заголовок' : 'Titlu'} value={data.hero_title} onChange={v => set('hero_title', v)} textarea placeholder={DEFAULTS.hero_title} />
              <BiField label={isRu ? 'Описание' : 'Descriere'} value={data.hero_body} onChange={v => set('hero_body', v)} textarea placeholder={DEFAULTS.hero_body} />
              <BiField label="CTA кнопка" value={data.hero_cta} onChange={v => set('hero_cta', v)} placeholder={DEFAULTS.hero_cta} />
              <BiField label={isRu ? 'Подпись под кнопкой' : 'Text sub buton'} value={data.hero_sub} onChange={v => set('hero_sub', v)} placeholder={DEFAULTS.hero_sub} />
            </div>
          </div>

          {/* STATS */}
          <div>
            <SectionHeader title={isRu ? 'Статистика' : 'Statistici'} visible={data.show_stats} onToggle={() => set('show_stats', !data.show_stats)} />
            {data.show_stats && (
              <CardList
                items={data.stats}
                emptyItem={{ n: bi(), label: bi() }}
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
          <div>
            <SectionHeader title={isRu ? 'Услуги' : 'Servicii'} visible={data.show_services} onToggle={() => set('show_services', !data.show_services)} />
            {data.show_services && (
              <>
                <div className="mb-3">
                  <BiField label={isRu ? 'Заголовок раздела' : 'Titlu secțiune'} value={data.services_title} onChange={v => set('services_title', v)} textarea placeholder={DEFAULTS.services_title} />
                </div>
                <CardList
                  items={data.services}
                  emptyItem={{ num: String(data.services.length + 1).padStart(2, '0'), title: bi(), body: bi() }}
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
          <div>
            <SectionHeader title={isRu ? 'Процесс (шаги)' : 'Proces (etape)'} visible={data.show_process} onToggle={() => set('show_process', !data.show_process)} />
            {data.show_process && (
              <>
                <div className="mb-3">
                  <BiField label={isRu ? 'Заголовок раздела' : 'Titlu secțiune'} value={data.process_title} onChange={v => set('process_title', v)} textarea placeholder={DEFAULTS.process_title} />
                </div>
                <CardList
                  items={data.steps}
                  emptyItem={{ n: String(data.steps.length + 1).padStart(2, '0'), title: bi(), body: bi() }}
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
          <div>
            <SectionHeader title={isRu ? 'Почему мы' : 'De ce noi'} visible={data.show_why} onToggle={() => set('show_why', !data.show_why)} />
            {data.show_why && (
              <>
                <div className="mb-3">
                  <BiField label={isRu ? 'Заголовок раздела' : 'Titlu secțiune'} value={data.why_title} onChange={v => set('why_title', v)} textarea placeholder={DEFAULTS.why_title} />
                </div>
                <CardList
                  items={data.why}
                  emptyItem={{ title: bi(), body: bi() }}
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
          <div>
            <SectionHeader title={isRu ? 'Кейсы / Проекты' : 'Cazuri / Proiecte'} visible={data.show_cases} onToggle={() => set('show_cases', !data.show_cases)} />
            {data.show_cases && (
              <>
                <div className="mb-3">
                  <BiField label={isRu ? 'Заголовок раздела' : 'Titlu secțiune'} value={data.cases_title} onChange={v => set('cases_title', v)} placeholder={DEFAULTS.cases_title} />
                </div>
                <CardList
                  items={data.cases}
                  emptyItem={{ title: bi(), body: bi(), image: '', city: bi(), year: '', link: '' }}
                  {...listHelpers<Case>('cases', () => ({ title: bi(), body: bi(), image: '', city: bi(), year: new Date().getFullYear().toString(), link: '' }))}
                  renderCard={(c, _, upd) => (
                    <div className="space-y-2">
                      <BiField label={isRu ? 'Название проекта' : 'Denumire proiect'} value={c.title} onChange={v => upd({ ...c, title: v })} />
                      <BiField label={isRu ? 'Описание' : 'Descriere'} value={c.body} onChange={v => upd({ ...c, body: v })} textarea />
                      <BiField label={isRu ? 'Город / Локация' : 'Oraș / Locație'} value={c.city} onChange={v => upd({ ...c, city: v })} placeholder={bi('Chișinău', 'Кишинёв')} />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-[9px] uppercase tracking-widest text-gray-600 mb-1">{isRu ? 'Год' : 'An'}</div>
                          <input value={c.year} onChange={e => upd({ ...c, year: e.target.value })} placeholder="2024"
                            className="w-full h-8 bg-black border border-white/20 px-2.5 text-xs text-white focus:border-white/60 focus:outline-none" />
                        </div>
                        <div>
                          <div className="text-[9px] uppercase tracking-widest text-gray-600 mb-1">{isRu ? 'Ссылка (необяз.)' : 'Link (opțional)'}</div>
                          <input value={c.link} onChange={e => upd({ ...c, link: e.target.value })} placeholder="/projects/..."
                            className="w-full h-8 bg-black border border-white/20 px-2.5 text-xs text-white focus:border-white/60 focus:outline-none" />
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase tracking-widest text-gray-600 mb-1">URL {isRu ? 'фото' : 'foto'}</div>
                        <input value={c.image} onChange={e => upd({ ...c, image: e.target.value })} placeholder="https://..."
                          className="w-full h-8 bg-black border border-white/20 px-2.5 text-xs text-white focus:border-white/60 focus:outline-none" />
                        {c.image && (
                          <div className="mt-1.5 h-16 border border-white/10 overflow-hidden">
                            <img src={c.image} alt="" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                />
              </>
            )}
          </div>

          {/* CTA */}
          <div>
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
                className={`flex items-center gap-1 px-2.5 py-1 text-[10px] uppercase tracking-wider transition-colors ${previewLang === l ? 'bg-black text-white' : 'text-gray-400 hover:text-black'}`}>
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
          <Preview data={data} lang={previewLang} />
        </div>
      </div>
    </div>
  );
}