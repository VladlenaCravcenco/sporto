import { usePublicPageData } from '../contexts/PublicPageData';
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
    ro: 'Discutăm cerințele spațiului și selecția echipamentelor. Livrarea, montajul și serviciile necesare se stabilesc pentru fiecare proiect.',
    ru: 'Обсуждаем задачи помещения и подбор оборудования. Доставку, монтаж и необходимые услуги согласуем для каждого проекта.',
  },
  hero_cta: { ro: 'Solicită o ofertă', ru: 'Запросить предложение' },
  hero_sub:  { ro: 'Detaliile se discută individual',     ru: 'Детали обсудим индивидуально' },
  stats: [],
  services_title: {
    ro: 'Ce primești în cadrul\nSoluțiilor la Cheie?',
    ru: 'Один партнёр\nдля всего процесса',
  },
  services: [
    { num: '01', title: { ro: 'Consultanță & Concept',     ru: 'Консультация & Концепция'      }, body: { ro: 'Analizăm spațiul, bugetul și publicul țintă. Îți livrăm un concept clar, nu promisiuni vagi.', ru: 'Анализируем помещение, бюджет и целевую аудиторию. Предоставляем чёткую концепцию.' } },
    { num: '02', title: { ro: 'Design & Planificare',       ru: 'Дизайн & Планирование'         }, body: { ro: 'Plan de amplasare, varietate mare de design, cantitatea optimală pentru start.', ru: 'Обсуждаем размещение оборудования с учётом размеров и назначения помещения.' } },
    { num: '03', title: { ro: 'Echipamente Profesionale',   ru: 'Профессиональное оборудование' }, body: { ro: 'Alegem modelele din catalog în funcție de exerciții, buget și spațiul disponibil.', ru: 'Подбираем модели из каталога с учётом упражнений, бюджета и доступного пространства.' } },
    { num: '04', title: { ro: 'Instalare & Training',       ru: 'Монтаж & Обучение'             }, body: { ro: 'Clarificăm cerințele de montaj și utilizare pentru echipamentele selectate.', ru: 'Уточняем требования к монтажу и эксплуатации выбранного оборудования.' } },
  ],
  process_title: { ro: 'De la idee\nla realitate.', ru: 'От первого разговора\nдо открытия' },
  steps: [
    { n: '01', title: { ro: 'Discuție inițială',    ru: 'Первичное обращение'       }, body: { ro: 'Trimiteți o solicitare cu cerințele proiectului și bugetul orientativ.', ru: 'Отправьте заявку с задачами проекта и ориентировочным бюджетом.' } },
    { n: '02', title: { ro: 'Concept & Ofertă',     ru: 'Концепция & Предложение'   }, body: { ro: 'Discutăm lista de echipamente, amplasarea și costurile înainte de confirmarea comenzii.', ru: 'Обсуждаем список оборудования, размещение и стоимость до подтверждения заказа.' } },
    { n: '03', title: { ro: 'Aprobare & Producție', ru: 'Подтверждение & Подготовка' }, body: { ro: 'Confirmi comanda. Pregătim echipamentele și programăm livrarea.', ru: 'Подтверждаете заказ. Мы готовим оборудование и согласовываем дату доставки.' } },
    { n: '04', title: { ro: 'Livrare & Montaj',     ru: 'Доставка & Монтаж'         }, body: { ro: 'Coordonăm livrarea și discutăm montajul conform condițiilor proiectului.', ru: 'Согласуем доставку и обсуждаем монтаж по условиям проекта.' } },
    { n: '05', title: { ro: 'Deschidere & Suport',  ru: 'Открытие & Поддержка'      }, body: { ro: 'Discutăm recomandările de utilizare și cerințele de întreținere.', ru: 'Обсуждаем рекомендации по эксплуатации и требования к обслуживанию.' } },
  ],
  why_title: { ro: 'Partenerul care\nîți apără investiția', ru: 'Партнёр, который\nзащищает ваши инвестиции' },
  why: [
    { title: { ro: 'Un singur interlocutor',   ru: 'Единый контакт'               }, body: { ro: 'Discutați cerințele și întrebările proiectului cu SPORTO.', ru: 'Обсуждайте задачи и вопросы по проекту с SPORTO.' } },
    { title: { ro: 'Ofertă pentru proiect', ru: 'Предложение для проекта' }, body: { ro: 'Costurile se discută în funcție de echipamentele și serviciile selectate.', ru: 'Стоимость обсуждается с учётом выбранных товаров и услуг.' } },
    { title: { ro: 'Planificarea livrării',       ru: 'Планирование доставки'            }, body: { ro: 'Termenele se clarifică înainte de confirmarea comenzii.', ru: 'Сроки уточняются до подтверждения заказа.' } },
    { title: { ro: 'Condiții de garanție',         ru: 'Условия гарантии'         }, body: { ro: 'Verificați condițiile de garanție aplicabile modelelor și serviciilor selectate.', ru: 'Уточните условия гарантии на выбранное оборудование и услуги.' } },
    { title: { ro: 'Suport post-lansare',      ru: 'Поддержка после запуска'      }, body: { ro: 'Pentru întrebări despre întreținere, consultați pagina de service sau contactați-ne.', ru: 'По вопросам обслуживания обратитесь к нам или посмотрите страницу сервиса.' } },
  ],
  cases_title: { ro: 'Proiecte realizate', ru: 'Выполненные проекты' },
  cases: [],
  cta_title: { ro: 'Gata să începem?',    ru: 'Готовы начать?' },
  cta_body:  { ro: 'Trimiteți-ne detaliile proiectului pentru a discuta echipamentele și condițiile colaborării.', ru: 'Пришлите детали проекта, чтобы обсудить оборудование и условия сотрудничества.' },
  cta_btn:   { ro: 'Discutăm proiectul tău', ru: 'Обсудить ваш проект' },
};

const LEGACY_COPY: Record<string, string> = {
  "Suntem furnizorul care preia tot: analiza spațiului, selecția echipamentelor, livrarea și montajul. Tu te concentrezi pe afacere — noi facem restul.": "Discutăm cerințele spațiului și selecția echipamentelor. Livrarea, montajul și serviciile necesare se stabilesc pentru fiecare proiect.",
  "Мы партнёр, который берёт на себя всё: анализ помещения, подбор оборудования, доставку и монтаж. Вы сосредоточены на бизнесе — мы делаем остальное.": "Обсуждаем задачи помещения и подбор оборудования. Доставку, монтаж и необходимые услуги согласуем для каждого проекта.",
  "Solicită ofertă gratuită": "Solicită o ofertă",
  "Запросить бесплатное предложение": "Запросить предложение",
  "Răspundem în 24 ore": "Detaliile se discută individual",
  "Ответим в течение 24 часов": "Детали обсудим индивидуально",
  "Детальный план этажа, оптимизированный поток, 3D-визуализация.": "Обсуждаем размещение оборудования с учётом размеров и назначения помещения.",
  "Selecție din catalogul de 8 000+ produse, prețuri angros, livrare directă.": "Alegem modelele din catalog în funcție de exerciții, buget și spațiul disponibil.",
  "Подбор из каталога 8 000+ товаров, оптовые цены, прямая доставка со склада.": "Подбираем модели из каталога с учётом упражнений, бюджета и доступного пространства.",
  "Montajul echipamentului și instruirea personalului, garanție și suport pe termen lung.": "Clarificăm cerințele de montaj și utilizare pentru echipamentele selectate.",
  "Сертифицированный монтаж, обучение персонала, полная гарантийная документация.": "Уточняем требования к монтажу и эксплуатации выбранного оборудования.",
  "Trimiteți o solicitare. Vă contactăm în 24h pentru a înțelege nevoile și bugetul.": "Trimiteți o solicitare cu cerințele proiectului și bugetul orientativ.",
  "Отправьте заявку. Мы свяжемся в течение 24ч, чтобы понять ваши потребности и бюджет.": "Отправьте заявку с задачами проекта и ориентировочным бюджетом.",
  "Primești planul de etaj, lista de echipamente și prețul final — fără costuri ascunse.": "Discutăm lista de echipamente, amplasarea și costurile înainte de confirmarea comenzii.",
  "Вы получите план этажа, список оборудования и финальную цену — без скрытых расходов.": "Обсуждаем список оборудования, размещение и стоимость до подтверждения заказа.",
  "Echipa noastră instalează tot la sediul tău, la data stabilită.": "Coordonăm livrarea și discutăm montajul conform condițiilor proiectului.",
  "Наша команда устанавливает всё на вашем объекте в согласованную дату.": "Согласуем доставку и обсуждаем монтаж по условиям проекта.",
  "Nu coordonezi furnizori diferiți. Noi preluăm tot.": "Discutați cerințele și întrebările proiectului cu SPORTO.",
  "Не координируете разных поставщиков. Мы берём всё на себя.": "Обсуждайте задачи и вопросы по проекту с SPORTO.",
  "Prețuri angros garantate": "Ofertă pentru proiect",
  "Гарантированные оптовые цены": "Предложение для проекта",
  "Aceleași prețuri ca pentru clienții instituționali.": "Costurile se discută în funcție de echipamentele și serviciile selectate.",
  "Те же цены, что для институциональных клиентов.": "Стоимость обсуждается с учётом выбранных товаров и услуг.",
  "Termene respectate": "Planificarea livrării",
  "Соблюдение сроков": "Планирование доставки",
  "Data de livrare e scrisă în contract.": "Termenele se clarifică înainte de confirmarea comenzii.",
  "Дата поставки зафиксирована в договоре.": "Сроки уточняются до подтверждения заказа.",
  "Garanție extinsă": "Condiții de garanție",
  "Расширенная гарантия": "Условия гарантии",
  "Garanție pe echipamente și pe instalare. Intervenție în 48h.": "Verificați condițiile de garanție aplicabile modelelor și serviciilor selectate.",
  "Гарантия на оборудование и монтаж. Выезд в течение 48ч.": "Уточните условия гарантии на выбранное оборудование и услуги.",
  "Rămânem disponibili. Inspecție gratuită la 3 luni.": "Pentru întrebări despre întreținere, consultați pagina de service sau contactați-ne.",
  "Остаёмся на связи. Бесплатная инспекция через 3 месяца.": "По вопросам обслуживания обратитесь к нам или посмотрите страницу сервиса.",
  "Trimiteți-ne detaliile proiectului. Consultanța inițială și oferta sunt complet gratuite.": "Trimiteți-ne detaliile proiectului pentru a discuta echipamentele și condițiile colaborării.",
  "Отправьте нам детали проекта. Первичная консультация и предложение — полностью бесплатно.": "Пришлите детали проекта, чтобы обсудить оборудование и условия сотрудничества.",
  "Instruim personalul și rămânem disponibili după lansare pentru orice întrebare.": "Discutăm recomandările de utilizare și cerințele de întreținere.",
  "Обучаем персонал и остаёмся на связи после запуска по любым вопросам.": "Обсуждаем рекомендации по эксплуатации и требования к обслуживанию."
};

function cleanPublishedCopy(value: unknown): unknown {
  if (typeof value === 'string') return LEGACY_COPY[value] ?? value;
  if (Array.isArray(value)) return value.map(cleanPublishedCopy);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cleanPublishedCopy(item)]));
  return value;
}

const PAGE_KEY = 'turnkey';

export async function loadFromSupabase(): Promise<PageData> {
  const { data } = await supabase
    .from('page_content')
    .select('key, value')
    .eq('page', PAGE_KEY);
  if (!data || data.length === 0) return { ...DEFAULTS };
  const map = Object.fromEntries(data.map(r => [r.key, r.value]));
  try { return normalizeContent(JSON.parse(map.data || '{}')); } catch { return { ...DEFAULTS }; }
}

function normalizeContent(value: unknown): PageData {
  try {
    const parsed = cleanPublishedCopy(value) as Partial<PageData>;
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
  const initial = usePublicPageData();
  const [data, setData] = useState<PageData>(() => initial ? normalizeContent(initial.content[PAGE_KEY] || {}) : _cache ?? DEFAULTS);
  useEffect(() => {
    if (initial) return;
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
  }, [initial]);
  return initial ? normalizeContent(initial.content[PAGE_KEY] || {}) : data;
}
