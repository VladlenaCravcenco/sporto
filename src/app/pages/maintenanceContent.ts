import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export interface BiText { ro: string; ru: string }
export interface Stat { n: BiText; label: BiText }
export interface Service { num: string; title: BiText; body: BiText }
export interface PackagePlan {
  name: string;
  price: string;
  currency: string;
  period: BiText;
  note: BiText;
  features_ro: string;
  features_ru: string;
  featured: boolean;
  cta: BiText;
}
export interface Step { n: string; title: BiText; body: BiText }
export interface DeliveryZone { city: BiText; time: BiText; price: BiText }

export type SectionKey = 'stats' | 'services' | 'packages' | 'process' | 'delivery' | 'cta';

export interface PageData {
  hero_eyebrow: BiText;
  hero_title: BiText;
  hero_body: BiText;
  hero_cta: BiText;
  hero_sub: BiText;

  section_order: SectionKey[];

  show_stats: boolean;
  stats: Stat[];

  show_services: boolean;
  services_eyebrow: BiText;
  services_title: BiText;
  services: Service[];

  show_packages: boolean;
  packages_eyebrow: BiText;
  packages_title: BiText;
  packages: PackagePlan[];

  show_process: boolean;
  process_eyebrow: BiText;
  process_title: BiText;
  steps: Step[];

  show_delivery: boolean;
  delivery_eyebrow: BiText;
  delivery_title: BiText;
  delivery_desc: BiText;
  delivery_link: BiText;
  delivery_zones: DeliveryZone[];

  show_cta: boolean;
  cta_title: BiText;
  cta_body: BiText;
  cta_btn: BiText;
  cta_link: BiText;
}

export const DEFAULTS: PageData = {
  hero_eyebrow: {
    ro: 'Service & Mentenanță · B2B',
    ru: 'Сервис & Обслуживание · B2B',
  },
  hero_title: {
    ro: 'Echipamentele tale\nfuncționează mereu.',
    ru: 'Ваше оборудование\nработает всегда.',
  },
  hero_body: {
    ro: 'Mentenanță preventivă, reparații rapide și contracte de service personalizate. Reducem costurile de exploatare și prelungim durata de viață a echipamentelor tale.',
    ru: 'Профилактическое обслуживание, быстрый ремонт и индивидуальные сервисные контракты. Снижаем эксплуатационные расходы и продлеваем срок службы вашего оборудования.',
  },
  hero_cta: {
    ro: 'Programează o inspecție gratuită',
    ru: 'Записаться на бесплатный осмотр',
  },
  hero_sub: {
    ro: 'Tehnicianul te contactează în 4 ore',
    ru: 'Техник свяжется в течение 4 часов',
  },

  section_order: ['stats', 'services', 'packages', 'process', 'delivery', 'cta'],

  show_stats: true,
  stats: [
    { n: { ro: '24/7', ru: '24/7' }, label: { ro: 'Suport tehnic disponibil', ru: 'Техническая поддержка' } },
    { n: { ro: '<4h', ru: '<4ч' }, label: { ro: 'Timp de răspuns garantat', ru: 'Гарантированное время отклика' } },
    { n: { ro: '5 ani', ru: '5 лет' }, label: { ro: 'Garanție extinsă pe lucrări', ru: 'Расширенная гарантия на работы' } },
  ],

  show_services: true,
  services_eyebrow: {
    ro: 'Serviciile noastre',
    ru: 'Наши услуги',
  },
  services_title: {
    ro: 'Tot ce ai nevoie\npentru echipamentul tău',
    ru: 'Всё что нужно\nвашему оборудованию',
  },
  services: [
    {
      num: '01',
      title: { ro: 'Mentenanță Preventivă', ru: 'Профилактическое обслуживание' },
      body: {
        ro: 'Inspecții regulate la intervale stabilite: lubrifiere, ajustări, curățare, înlocuire piese uzate. Problemele sunt detectate înainte să apară defecțiunea.',
        ru: 'Регулярные осмотры по графику: смазка, регулировки, очистка, замена изношенных деталей. Проблемы выявляются до поломки.',
      },
    },
    {
      num: '02',
      title: { ro: 'Reparații Profesionale', ru: 'Профессиональный ремонт' },
      body: {
        ro: 'Diagnosticare precisă și reparație rapidă cu piese originale. Garanție pe fiecare lucrare. Intervenție la sediul tău fără transport costisitor.',
        ru: 'Точная диагностика и быстрый ремонт оригинальными запчастями. Гарантия на каждую работу. Выезд к вам без дорогостоящей транспортировки.',
      },
    },
    {
      num: '03',
      title: { ro: 'Suport Tehnic 24/7', ru: 'Техническая поддержка 24/7' },
      body: {
        ro: 'Linie telefonică dedicată non-stop. Dacă nu rezolvăm problema remote, un tehnician ajunge la tine în maximum 4 ore.',
        ru: 'Выделенная линия круглосуточно. Если не решаем проблему удалённо — техник приедет к вам максимум за 4 часа.',
      },
    },
    {
      num: '04',
      title: { ro: 'Contracte de Service', ru: 'Сервисные контракты' },
      body: {
        ro: 'Pachete lunare cu prețuri fixe și intervenții prioritare. Planifici bugetul fără surprize. Reduceri față de tarifele la cerere.',
        ru: 'Ежемесячные пакеты с фиксированными ценами и приоритетным обслуживанием. Планируете бюджет без сюрпризов. Скидки к разовым тарифам.',
      },
    },
  ],

  show_packages: true,
  packages_eyebrow: {
    ro: 'Pachete de service',
    ru: 'Пакеты обслуживания',
  },
  packages_title: {
    ro: 'Alege planul\npotrivit sălii tale',
    ru: 'Выберите план\nдля вашего зала',
  },
  packages: [
    {
      name: 'Basic',
      price: '199',
      currency: '€',
      period: { ro: '/lună', ru: '/мес' },
      note: { ro: 'Săli până la 20 aparate', ru: 'Залы до 20 единиц' },
      features_ro: 'Inspecție lunară completă\nMentenanță preventivă de bază\nRaport tehnic detaliat\nSuport telefonic în program',
      features_ru: 'Полный ежемесячный осмотр\nБазовое профилактическое ТО\nДетальный технический отчёт\nТелефонная поддержка в рабочее время',
      featured: false,
      cta: { ro: 'Alege Basic', ru: 'Выбрать Basic' },
    },
    {
      name: 'Professional',
      price: '399',
      currency: '€',
      period: { ro: '/lună', ru: '/мес' },
      note: { ro: 'Recomandat pentru săli medii', ru: 'Рекомендуется для средних залов' },
      features_ro: 'Inspecții de 2×/lună\nMentenanță preventivă completă\nReparații minore incluse\nPiese de schimb la preț redus\nSuport prioritar 24/7\nRapoarte detaliate cu istoric',
      features_ru: 'Осмотры 2 раза в месяц\nПолное профилактическое ТО\nМелкий ремонт включён\nЗапчасти по сниженной цене\nПриоритетная поддержка 24/7\nДетальные отчёты с историей',
      featured: true,
      cta: { ro: 'Alege Professional', ru: 'Выбрать Professional' },
    },
    {
      name: 'Premium',
      price: 'Custom',
      currency: '',
      period: { ro: '', ru: '' },
      note: { ro: 'Centre fitness & hoteluri', ru: 'Фитнес-центры & отели' },
      features_ro: 'Inspecții săptămânale\nTot ce include Professional\nToate reparațiile incluse\nPiese de schimb incluse\nTehnician dedicat on-site\nGaranție extinsă 5 ani',
      features_ru: 'Еженедельные осмотры\nВсё из Professional\nВесь ремонт включён\nЗапчасти включены\nВыделенный техник on-site\nРасширенная гарантия 5 лет',
      featured: false,
      cta: { ro: 'Solicită ofertă', ru: 'Запросить предложение' },
    },
  ],

  show_process: true,
  process_eyebrow: {
    ro: 'Cum funcționează',
    ru: 'Как это работает',
  },
  process_title: {
    ro: 'De la apel\nla echipamente funcționale',
    ru: 'От звонка\nдо работающего оборудования',
  },
  steps: [
    { n: '01', title: { ro: 'Inspecție gratuită', ru: 'Бесплатный осмотр' }, body: { ro: 'Trimiți o solicitare sau suni. Tehnicianul vine și evaluează starea echipamentelor — fără costuri.', ru: 'Оставляете заявку или звоните. Техник приезжает и оценивает состояние оборудования — без оплаты.' } },
    { n: '02', title: { ro: 'Plan & Ofertă', ru: 'План & Предложение' }, body: { ro: 'Primești un plan de mentenanță și oferta contractului, cu prețuri clare și fără costuri ascunse.', ru: 'Получаете план обслуживания и предложение по контракту с прозрачными ценами и без скрытых расходов.' } },
    { n: '03', title: { ro: 'Execuție lucrări', ru: 'Выполнение работ' }, body: { ro: 'Tehnicianul certificat efectuează lucrările la sediul tău, în intervalul orar agreat.', ru: 'Сертифицированный техник проводит работы на вашем объекте в согласованное время.' } },
    { n: '04', title: { ro: 'Raport & Garanție', ru: 'Отчёт & Гарантия' }, body: { ro: 'Documentăm fiecare intervenție. Primești raport scris și garanție pe lucrare.', ru: 'Документируем каждое вмешательство. Получаете письменный отчёт и гарантию на работу.' } },
  ],

  show_delivery: true,
  delivery_eyebrow: {
    ro: 'Livrare & Logistică',
    ru: 'Доставка & Логистика',
  },
  delivery_title: {
    ro: 'Livrare rapidă\nîn toată Moldova',
    ru: 'Быстрая доставка\nпо всей Молдове',
  },
  delivery_desc: {
    ro: 'Livrăm piese de schimb și echipamente la sediul tău. Aceleași standarde de calitate ca pentru vânzările de echipamente noi.',
    ru: 'Доставляем запчасти и оборудование на ваш объект. Те же стандарты качества, что и для продажи нового оборудования.',
  },
  delivery_link: {
    ro: 'Condiții complete de livrare',
    ru: 'Полные условия доставки',
  },
  delivery_zones: [
    { city: { ro: 'Chișinău', ru: 'Кишинёв' }, time: { ro: '1–2 zile', ru: '1–2 дня' }, price: { ro: 'Gratuit de la 500 MDL', ru: 'Бесплатно от 500 MDL' } },
    { city: { ro: 'Alte orașe RM', ru: 'Другие города РМ' }, time: { ro: '2–5 zile', ru: '2–5 дней' }, price: { ro: 'Calculat individual', ru: 'Рассчитывается отдельно' } },
  ],

  show_cta: true,
  cta_title: {
    ro: 'Programează o\ninspecție gratuită',
    ru: 'Запишитесь на\nбесплатный осмотр',
  },
  cta_body: {
    ro: 'Un tehnician certificat evaluează starea echipamentelor tale fără niciun cost. Afli exact ce ai nevoie — fără obligații.',
    ru: 'Сертифицированный техник оценит состояние вашего оборудования без какой-либо оплаты. Узнаете точно, что нужно — без обязательств.',
  },
  cta_btn: {
    ro: 'Vreau inspecție gratuită',
    ru: 'Хочу бесплатный осмотр',
  },
  cta_link: {
    ro: 'sau cumpără echipamente noi →',
    ru: 'или купить новое оборудование →',
  },
};

const PAGE_KEY = 'maintenance';

function mergeBiText(defaultValue: BiText, parsed: unknown): BiText {
  return { ...defaultValue, ...((parsed as Partial<BiText>) || {}) };
}

export async function loadFromSupabase(): Promise<PageData> {
  const { data } = await supabase
    .from('page_content')
    .select('key, value')
    .eq('page', PAGE_KEY);

  if (!data || data.length === 0) return { ...DEFAULTS };

  const map = Object.fromEntries(data.map(r => [r.key, r.value]));

  try {
    const parsed = JSON.parse(map.data || '{}') as Partial<PageData>;
    return {
      ...DEFAULTS,
      ...parsed,
      hero_eyebrow: mergeBiText(DEFAULTS.hero_eyebrow, parsed.hero_eyebrow),
      hero_title: mergeBiText(DEFAULTS.hero_title, parsed.hero_title),
      hero_body: mergeBiText(DEFAULTS.hero_body, parsed.hero_body),
      hero_cta: mergeBiText(DEFAULTS.hero_cta, parsed.hero_cta),
      hero_sub: mergeBiText(DEFAULTS.hero_sub, parsed.hero_sub),
      services_eyebrow: mergeBiText(DEFAULTS.services_eyebrow, parsed.services_eyebrow),
      services_title: mergeBiText(DEFAULTS.services_title, parsed.services_title),
      packages_eyebrow: mergeBiText(DEFAULTS.packages_eyebrow, parsed.packages_eyebrow),
      packages_title: mergeBiText(DEFAULTS.packages_title, parsed.packages_title),
      process_eyebrow: mergeBiText(DEFAULTS.process_eyebrow, parsed.process_eyebrow),
      process_title: mergeBiText(DEFAULTS.process_title, parsed.process_title),
      delivery_eyebrow: mergeBiText(DEFAULTS.delivery_eyebrow, parsed.delivery_eyebrow),
      delivery_title: mergeBiText(DEFAULTS.delivery_title, parsed.delivery_title),
      delivery_desc: mergeBiText(DEFAULTS.delivery_desc, parsed.delivery_desc),
      delivery_link: mergeBiText(DEFAULTS.delivery_link, parsed.delivery_link),
      cta_title: mergeBiText(DEFAULTS.cta_title, parsed.cta_title),
      cta_body: mergeBiText(DEFAULTS.cta_body, parsed.cta_body),
      cta_btn: mergeBiText(DEFAULTS.cta_btn, parsed.cta_btn),
      cta_link: mergeBiText(DEFAULTS.cta_link, parsed.cta_link),
      section_order: Array.isArray(parsed.section_order) ? parsed.section_order : DEFAULTS.section_order,
      stats: parsed.stats ?? DEFAULTS.stats,
      services: parsed.services ?? DEFAULTS.services,
      packages: parsed.packages ?? DEFAULTS.packages,
      steps: parsed.steps ?? DEFAULTS.steps,
      delivery_zones: parsed.delivery_zones ?? DEFAULTS.delivery_zones,
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

let cache: PageData | null = null;
const listeners: Set<(data: PageData) => void> = new Set();
let loadingPromise: Promise<void> | null = null;

export function invalidateCache(data: PageData) {
  cache = data;
  listeners.forEach(fn => fn(data));
}

export function useMaintenanceContent(): PageData {
  const [data, setData] = useState<PageData>(cache ?? DEFAULTS);

  useEffect(() => {
    if (cache) {
      setData(cache);
      return;
    }

    const handler = (next: PageData) => setData(next);
    listeners.add(handler);

    if (!loadingPromise) {
      loadingPromise = loadFromSupabase().then(next => {
        cache = next;
        listeners.forEach(fn => fn(next));
      });
    }

    return () => { listeners.delete(handler); };
  }, []);

  return data;
}
