export interface FaqItem {
  id: string;
  question_ro: string;
  question_ru: string;
  answer_ro: string;
  answer_ru: string;
  sort_order: number;
  active: boolean;
}

export const FAQ_SEO_DEFAULTS: Omit<FaqItem, 'id'>[] = [
  {
    question_ro: 'Livrați echipamente sportive în toată Moldova?',
    question_ru: 'Доставляете ли вы спортивное оборудование по всей Молдове?',
    answer_ro: 'Da, livrăm echipamente sportive în toată Republica Moldova. Comenzile din Chișinău sunt procesate în 1–2 zile lucrătoare, iar în restul țării — în 3–5 zile. Livrarea se efectuează prin curierat sau transport propriu pentru comenzi mari.',
    answer_ru: 'Да, мы доставляем спортивное оборудование по всей Молдове. Заказы по Кишинёву выполняются за 1–2 рабочих дня, по остальным регионам — за 3–5 дней. Доставка осуществляется курьером или собственным транспортом для крупных партий.',
    sort_order: 0,
    active: true,
  },
  {
    question_ro: 'Oferiți prețuri wholesale pentru echipamente fitness?',
    question_ru: 'Предоставляете ли вы оптовые цены на фитнес-оборудование?',
    answer_ro: 'Da, oferim prețuri speciale wholesale pentru cluburi fitness, săli de sport, magazine sportive și instituții. Condiții B2B individuale se stabilesc în funcție de volumul comenzii. Contactați-ne pentru o ofertă personalizată — consultanța este gratuită.',
    answer_ru: 'Да, мы предлагаем специальные оптовые цены для фитнес-клубов, спортивных залов, магазинов и учреждений. Условия B2B рассчитываются индивидуально в зависимости от объёма заказа. Свяжитесь с нами для персонального предложения — консультация бесплатна.',
    sort_order: 1,
    active: true,
  },
  {
    question_ro: 'Ce garanție oferiți pe echipamentele sportive?',
    question_ru: 'Какая гарантия предоставляется на спортивное оборудование?',
    answer_ro: 'Toate echipamentele sportive comercializate de Sporto (SPORTOSFERA S.R.L.) beneficiază de garanție de minimum 12 luni. Produsele provin din Italia și UE — branduri certificate cu reputație internațională. Serviciul post-vânzare și suportul tehnic sunt asigurate de echipa noastră.',
    answer_ru: 'Всё спортивное оборудование Sporto (SPORTOSFERA S.R.L.) имеет гарантию не менее 12 месяцев. Продукция поставляется из Италии и ЕС — сертифицированные бренды с международной репутацией. Постпродажное обслуживание и техническую поддержку обеспечивает наша команда.',
    sort_order: 2,
    active: true,
  },
  {
    question_ro: 'Puteți echipa o sală de sport pentru o școală sau instituție publică?',
    question_ru: 'Можете ли вы оснастить спортзал для школы или государственного учреждения?',
    answer_ro: 'Da, lucrăm activ în segmentul B2G — dotăm școli, licee, grădinițe, instituții publice și primării. Oferim inventar sportiv conform normativelor, prețuri speciale pentru licitații publice și documentație completă. Consultați-ne pentru un proiect la cheie.',
    answer_ru: 'Да, мы активно работаем в сегменте B2G — оснащаем школы, лицеи, детские сады, государственные учреждения и муниципальные объекты. Предлагаем спортивный инвентарь по нормативам, специальные цены для тендеров и полный пакет документов. Обратитесь к нам за проектом «под ключ».',
    sort_order: 3,
    active: true,
  },
];

export function newFaqItem(order: number): FaqItem {
  return {
    id: `faq-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    question_ro: '',
    question_ru: '',
    answer_ro: '',
    answer_ru: '',
    sort_order: order,
    active: true,
  };
}

export function toLocalizedFaq(items: FaqItem[], lang: 'ro' | 'ru') {
  return items
    .filter((item) => item.active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item) => ({
      q: lang === 'ru' ? (item.question_ru || item.question_ro) : (item.question_ro || item.question_ru),
      a: lang === 'ru' ? (item.answer_ru || item.answer_ro) : (item.answer_ro || item.answer_ru),
    }))
    .filter((item) => item.q.trim() && item.a.trim());
}
