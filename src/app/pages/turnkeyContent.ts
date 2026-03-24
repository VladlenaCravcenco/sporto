import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export interface BiText { ro: string; ru: string }

export interface Stat    { n: BiText; label: BiText }
export interface Service { num: string; title: BiText; body: BiText }
export interface Step    { n: string; title: BiText; body: BiText }
export interface Why     { title: BiText; body: BiText }
export interface Case    {
  image:    string;
  label_ro: string;
  label_ru: string;
  year:     string;
}

export type SectionKey = 'stats' | 'services' | 'process' | 'why' | 'cases' | 'cta';

export interface PageData {
  section_order:   SectionKey[];
  show_stats:     boolean;
  show_services:  boolean;
  show_process:   boolean;
  show_why:       boolean;
  show_cases:     boolean;
  show_cta:       boolean;
  hero_title:     BiText;
  hero_body:      BiText;
  hero_cta:       BiText;
  hero_sub:       BiText;
  stats:          Stat[];
  services_title: BiText;
  services:       Service[];
  process_title:  BiText;
  steps:          Step[];
  why_title:      BiText;
  why:            Why[];
  cases_title:    BiText;
  cases:          Case[];
  cta_title:      BiText;
  cta_body:       BiText;
  cta_btn:        BiText;
}

export const DEFAULTS: PageData = {
  section_order: ['stats', 'services', 'process', 'why', 'cases', 'cta'],
  show_stats: true, show_services: true, show_process: true,
  show_why: true, show_cases: false, show_cta: true,
  hero_title: {
    ro: 'Sala ta de fitness,\nde la idee la realitate.',
    ru: 'Ваш фитнес-клуб,\nот нуля до открытия.',
  },
  hero_body: {
    ro: 'Suntem furnizorul care preia tot: analiza spațiului, selecția echipamentelor, livrarea și montajul. Tu te concentrezi pe afacere — noi facem restul.',
    ru: 'Мы партнёр, который берёт на себя всё: анализ помещения, подбор оборудования, доставку и монтаж. Вы сосредоточены на бизнесе — мы делаем остальное.',
  },
  hero_cta: { ro: 'Solicită ofertă gratuită', ru: 'Запросить бесплатное предложение' },
  hero_sub:  { ro: 'Răspundem în 24 ore',     ru: 'Ответим в течение 24 часов' },
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
    { num: '01', title: { ro: 'Consultanță & Concept',     ru: 'Консультация & Концепция'      }, body: { ro: 'Analizăm spațiul, bugetul și publicul țintă. Îți livrăm un concept clar, nu promisiuni vagi.', ru: 'Анализируем помещение, бюджет и целевую аудиторию. Предоставляем чёткую концепцию.' } },
    { num: '02', title: { ro: 'Design & Planificare',       ru: 'Дизайн & Планирование'         }, body: { ro: 'Plan de amplasare, varietate mare de design, cantitatea optimală pentru start.', ru: 'Детальный план этажа, оптимизированный поток, 3D-визуализация.' } },
    { num: '03', title: { ro: 'Echipamente Profesionale',   ru: 'Профессиональное оборудование' }, body: { ro: 'Selecție din catalogul de 8 000+ produse, prețuri angros, livrare directă.', ru: 'Подбор из каталога 8 000+ товаров, оптовые цены, прямая доставка со склада.' } },
    { num: '04', title: { ro: 'Instalare & Training',       ru: 'Монтаж & Обучение'             }, body: { ro: 'Montajul echipamentului și instruirea personalului, garanție și suport pe termen lung.', ru: 'Сертифицированный монтаж, обучение персонала, полная гарантийная документация.' } },
  ],
  process_title: { ro: 'De la idee\nla realitate.', ru: 'От первого разговора\nдо открытия' },
  steps: [
    { n: '01', title: { ro: 'Discuție inițială',    ru: 'Первичное обращение'       }, body: { ro: 'Trimiteți o solicitare. Vă contactăm în 24h pentru a înțelege nevoile și bugetul.', ru: 'Отправьте заявку. Мы свяжемся в течение 24ч, чтобы понять ваши потребности и бюджет.' } },
    { n: '02', title: { ro: 'Concept & Ofertă',     ru: 'Концепция & Предложение'   }, body: { ro: 'Primești planul de etaj, lista de echipamente și prețul final — fără costuri ascunse.', ru: 'Вы получите план этажа, список оборудования и финальную цену — без скрытых расходов.' } },
    { n: '03', title: { ro: 'Aprobare & Producție', ru: 'Подтверждение & Подготовка' }, body: { ro: 'Confirmi comanda. Pregătim echipamentele și programăm livrarea.', ru: 'Подтверждаете заказ. Мы готовим оборудование и согласовываем дату доставки.' } },
    { n: '04', title: { ro: 'Livrare & Montaj',     ru: 'Доставка & Монтаж'         }, body: { ro: 'Echipa noastră instalează tot la sediul tău, la data stabilită.', ru: 'Наша команда устанавливает всё на вашем объекте в согласованную дату.' } },
    { n: '05', title: { ro: 'Deschidere & Suport',  ru: 'Открытие & Поддержка'      }, body: { ro: 'Instruim personalul și rămânem disponibili după lansare pentru orice întrebare.', ru: 'Обучаем персонал и остаёмся на связи после запуска по любым вопросам.' } },
  ],
  why_title: { ro: 'Partenerul care\nîți apără investiția', ru: 'Партнёр, который\nзащищает ваши инвестиции' },
  why: [
    { title: { ro: 'Un singur interlocutor',   ru: 'Единый контакт'               }, body: { ro: 'Nu coordonezi furnizori diferiți. Noi preluăm tot.', ru: 'Не координируете разных поставщиков. Мы берём всё на себя.' } },
    { title: { ro: 'Prețuri angros garantate', ru: 'Гарантированные оптовые цены' }, body: { ro: 'Aceleași prețuri ca pentru clienții instituționali.', ru: 'Те же цены, что для институциональных клиентов.' } },
    { title: { ro: 'Termene respectate',       ru: 'Соблюдение сроков'            }, body: { ro: 'Data de livrare e scrisă în contract.', ru: 'Дата поставки зафиксирована в договоре.' } },
    { title: { ro: 'Garanție extinsă',         ru: 'Расширенная гарантия'         }, body: { ro: 'Garanție pe echipamente și pe instalare. Intervenție în 48h.', ru: 'Гарантия на оборудование и монтаж. Выезд в течение 48ч.' } },
    { title: { ro: 'Suport post-lansare',      ru: 'Поддержка после запуска'      }, body: { ro: 'Rămânem disponibili. Inspecție gratuită la 3 luni.', ru: 'Остаёмся на связи. Бесплатная инспекция через 3 месяца.' } },
  ],
  cases_title: { ro: 'Proiecte realizate', ru: 'Выполненные проекты' },
  cases: [],
  cta_title: { ro: 'Gata să începem?',    ru: 'Готовы начать?' },
  cta_body:  { ro: 'Trimiteți-ne detaliile proiectului. Consultanța inițială și oferta sunt complet gratuite.', ru: 'Отправьте нам детали проекта. Первичная консультация и предложение — полностью бесплатно.' },
  cta_btn:   { ro: 'Discutăm proiectul tău', ru: 'Обсудить ваш проект' },
};

const PAGE_KEY = 'turnkey';

export async function loadFromSupabase(): Promise<PageData> {
  const { data } = await supabase
    .from('page_content')
    .select('key, value')
    .eq('page', PAGE_KEY);
  if (!data || data.length === 0) return { ...DEFAULTS };
  const map = Object.fromEntries(data.map(r => [r.key, r.value]));
  try {
    const parsed = JSON.parse(map.data || '{}');
    return {
      ...DEFAULTS,
      ...parsed,
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
      section_order: parsed.section_order ?? DEFAULTS.section_order,
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

export async function saveToSupabase(data: PageData): Promise<void> {
  await supabase.from('page_content').upsert(
    { page: PAGE_KEY, key: 'data', value: JSON.stringify(data) },
    { onConflict: 'page,key' }
  );
}

let _cache: PageData | null = null;
export const _listeners: Set<(d: PageData) => void> = new Set();
let _promise: Promise<void> | null = null;

export function invalidateCache(data: PageData) {
  _cache = data;
  _listeners.forEach(fn => fn(data));
}

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
