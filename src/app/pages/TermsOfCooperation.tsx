import { useLanguage } from '../contexts/LanguageContext';
import { ArrowLeft, CheckCircle2, FileText, Shield, CreditCard, RotateCcw, Lock } from 'lucide-react';
import { SeoHead, SEO_PAGES } from '../components/SeoHead';
import type { ReactNode } from 'react';
import { Link } from 'react-router';

type Lang = 'ro' | 'ru';

export function TermsOfCooperation() {
  const { language } = useLanguage();
  const lang = language as Lang;

  const C = {
    ro: {
      back: 'Înapoi',
      eyebrow: 'Documente · B2B',
      title: 'Condiții de Colaborare',
      subtitle: 'Termeni clari pentru un parteneriat de lungă durată. Lucrăm cu companii, magazine și instituții din Republica Moldova și România.',
      updated: 'Actualizat: martie 2026',
      sections: [
        {
          icon: 'FileText',
          title: '1. Cine poate deveni partener',
          items: [
            'Persoane juridice înregistrate în Republica Moldova sau România (SRL, SA, ÎI, Î.S.)',
            'Antreprenori individuali (ÎI) cu activitate în domeniu',
            'Instituții publice: școli, grădinițe, centre sportive, primării',
            'Magazine sportive și rețele de retail',
            'Cluburi și săli de fitness',
          ],
          note: 'Accesul la prețurile angro este disponibil după înregistrare și verificarea datelor companiei.',
        },
        {
          icon: 'CheckCircle2',
          title: '2. Condiții minime de comandă',
          items: [
            'Comanda minimă: 5 000 MDL (sau echivalent în EUR/USD)',
            'Comanda minimă pe articol: conform fișei produsului (coloana "Min. comandă")',
            'Nu există limită maximă de comandă',
            'Comenzile sub minimul stabilit se procesează la prețuri de retail',
          ],
          note: 'Minimele pot fi negociate pentru partenerii cu contracte-cadru anuale.',
        },
        {
          icon: 'CreditCard',
          title: '3. Prețuri și modalități de plată',
          items: [
            'Prețurile angro sunt afișate după autentificare în cont',
            'Moneda de bază: MDL (echivalent EUR disponibil la cerere)',
            'Plată prin transfer bancar (factura se emite în 24h de la comandă)',
            'Avans 50% la confirmarea comenzii, rest 50% înainte de livrare',
            'Pentru comenzi recurente: plată la 30 zile (cu acord contractual)',
            'Plată cu cardul corporate: disponibilă la sediul nostru',
          ],
          note: 'Prețurile nu includ TVA. Factura fiscală se emite automat conform legislației RM.',
        },
        {
          icon: 'Shield',
          title: '4. Garanție și calitate',
          items: [
            'Garanție standard: 12 luni de la data livrării',
            'Garanție extinsă: 24–36 luni pentru echipamente premium (conform fișei produsului)',
            'Toate produsele sunt însoțite de certificate de conformitate',
            'Garanția acoperă: defecte de fabricație, deteriorări structurale',
            'Garanția nu acoperă: uzura normală, daune provocate de utilizare incorectă',
          ],
          note: 'Reparațiile în garanție se efectuează la Chișinău sau la sediul clientului (pentru echipamente staționare).',
        },
        {
          icon: 'RotateCcw',
          title: '5. Returnări și schimb',
          items: [
            'Returnare acceptată în termen de 14 zile de la livrare (produse nefolosite, în ambalaj original)',
            'Produse personalizate (cu logo, dimensiuni speciale): nereturnabile',
            'Defect de producție confirmat: returnare sau înlocuire gratuită',
            'Procedura de returnare: notificare scrisă la info@sportpro.md + act de returnare',
            'Rambursarea sumei: în termen de 10 zile lucrătoare de la primirea mărfii',
          ],
          note: 'Costul transportului la returnare este suportat de client, cu excepția defectelor de producție.',
        },
        {
          icon: 'Lock',
          title: '6. Confidențialitate și date',
          items: [
            'Datele companiei dvs. sunt stocate securizat și nu sunt transmise terților',
            'Prețurile angro sunt confidențiale și destinate exclusiv partenerilor înregistrați',
            'Contul de partener este personal și netransferabil',
            'Colaborăm conform Legii nr. 133/2011 privind protecția datelor cu caracter personal (RM)',
          ],
          note: null,
        },
      ],
      contact: {
        title: 'Întrebări despre condițiile de colaborare?',
        body: 'Echipa noastră de vânzări B2B este disponibilă Lun–Vin, 9:00–18:00.',
        cta: 'Contactează-ne',
      },
    },
    ru: {
      back: 'Назад',
      eyebrow: 'Документы · B2B',
      title: 'Условия сотрудничества',
      subtitle: 'Прозрачные условия для долгосрочного партнёрства. Работаем с компаниями, магазинами и учреждениями Республики Молдова.',
      updated: 'Обновлено: март 2026',
      sections: [
        {
          icon: 'FileText',
          title: '1. Кто может стать партнёром',
          items: [
            'Юридические лица, зарегистрированные в Республике Молдова или Румынии (ООО, АО, ИП, ГП)',
            'Индивидуальные предприниматели с деятельностью в отрасли',
            'Государственные учреждения: школы, детские сады, спортивные центры, примэрии',
            'Спортивные магазины и розничные сети',
            'Фитнес-клубы и спортивные залы',
          ],
          note: 'Доступ к оптовым ценам открывается после регистрации и верификации данных компании.',
        },
        {
          icon: 'CheckCircle2',
          title: '2. Минимальные условия заказа',
          items: [
            'Минимальный заказ: 5 000 MDL (или эквивалент в EUR/USD)',
            'Минимум по позиции: согласно карточке товара (колонка «Мин. заказ»)',
            'Максимальный заказ: без ограничений',
            'Заказы ниже минимума обрабатываются по розничным ценам',
          ],
          note: 'Минимумы могут быть пересмотрены для партнёров с годовыми рамочными договорами.',
        },
        {
          icon: 'CreditCard',
          title: '3. Цены и способы оплаты',
          items: [
            'Оптовые цены отображаются после входа в аккаунт',
            'Базовая валюта: MDL (эквивалент EUR доступен по запросу)',
            'Оплата банковским переводом (счёт выставляется в течение 24ч с момента заказа)',
            'Предоплата 50% при подтверждении заказа, остаток 50% перед отгрузкой',
            'Для постоянных партнёров: оплата с отсрочкой 30 дней (по договору)',
            'Оплата корпоративной картой: в нашем офисе',
          ],
          note: 'Цены без НДС. Налоговая накладная выставляется автоматически согласно законодательству РМ.',
        },
        {
          icon: 'Shield',
          title: '4. Гарантия и качество',
          items: [
            'Стандартная гарантия: 12 месяцев с даты поставки',
            'Расширенная гарантия: 24–36 месяцев на премиум-оборудование (по карточке товара)',
            'Все товары сопровождаются сертификатами соответствия',
            'Гарантия распространяется на: производственные дефекты, конструктивные повреждения',
            'Гарантия не распространяется на: естественный износ, повреждения от неправильной эксплуатации',
          ],
          note: 'Гарантийный ремонт выполняется в Кишинёве или на объекте клиента (для стационарного оборудования).',
        },
        {
          icon: 'RotateCcw',
          title: '5. Возврат и обмен',
          items: [
            'Возврат принимается в течение 14 дней с момента доставки (товар не использован, в оригинальной упаковке)',
            'Персонализированные товары (с логотипом, нестандартные размеры): возврату не подлежат',
            'Подтверждённый производственный дефект: бесплатный возврат или замена',
            'Процедура возврата: письменное уведомление на info@sportpro.md + акт возврата',
            'Возврат средств: в течение 10 рабочих дней после получения товара',
          ],
          note: 'Стоимость обратной доставки несёт покупатель, кроме случаев производственного дефекта.',
        },
        {
          icon: 'Lock',
          title: '6. Конфиденциальность и данные',
          items: [
            'Данные вашей компании хранятся в защищённом виде и не передаются третьим лицам',
            'Оптовые цены конфиденциальны и предназначены исключительно для зарегистрированных партнёров',
            'Партнёрский аккаунт является личным и непередаваемым',
            'Работаем в соответствии с Законом № 133/2011 о защите персональных данных (РМ)',
          ],
          note: null,
        },
      ],
      contact: {
        title: 'Вопросы об условиях сотрудничества?',
        body: 'Наш B2B-отдел продаж доступен Пн–Пт, 9:00–18:00.',
        cta: 'Связаться с нами',
      },
    },
  };

  const content = C[lang];

  const iconMap: Record<string, ReactNode> = {
    FileText: <FileText className="w-4 h-4" />,
    CheckCircle2: <CheckCircle2 className="w-4 h-4" />,
    CreditCard: <CreditCard className="w-4 h-4" />,
    Shield: <Shield className="w-4 h-4" />,
    RotateCcw: <RotateCcw className="w-4 h-4" />,
    Lock: <Lock className="w-4 h-4" />,
  };

  return (
    <div className="min-h-screen bg-white">
      <SeoHead
        title={SEO_PAGES.terms[lang].title}
        description={SEO_PAGES.terms[lang].description}
        keywords={SEO_PAGES.terms[lang].keywords}
        canonical="/terms-of-cooperation"
        lang={lang}
      />

      {/* Hero */}
      <section className="border-b border-gray-100">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-black transition-colors mb-10 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            {content.back}
          </Link>

          <div className="max-w-3xl">
            <p className="text-xs text-gray-400 uppercase tracking-[0.2em] mb-4">{content.eyebrow}</p>
            <h1 className="text-4xl lg:text-5xl text-black mb-6">{content.title}</h1>
            <p className="text-gray-500 leading-relaxed max-w-xl">{content.subtitle}</p>
            <p className="text-xs text-gray-300 mt-6 tracking-wide">{content.updated}</p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Sticky sidebar nav */}
          <aside className="lg:col-span-3 hidden lg:block">
            <div className="sticky top-8">
              <p className="text-xs text-gray-400 uppercase tracking-[0.15em] mb-4">
                {lang === 'ro' ? 'Cuprins' : 'Содержание'}
              </p>
              <nav className="space-y-1">
                {content.sections.map((s, i) => (
                  <a
                    key={i}
                    href={`#section-${i}`}
                    className="flex items-center gap-2 text-xs text-gray-400 hover:text-black transition-colors py-1.5 border-l-2 border-transparent hover:border-black pl-3"
                  >
                    <span className="tabular-nums text-gray-300">{String(i + 1).padStart(2, '0')}</span>
                    {s.title.replace(/^\d+\.\s/, '')}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <div className="lg:col-span-9 space-y-0 divide-y divide-gray-100">
            {content.sections.map((section, i) => (
              <div key={i} id={`section-${i}`} className="py-10 first:pt-0">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-8 h-8 bg-black text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                    {iconMap[section.icon]}
                  </div>
                  <h2 className="text-lg text-black">{section.title}</h2>
                </div>

                <ul className="space-y-3 mb-4 ml-12">
                  {section.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <span className="w-1 h-1 rounded-full bg-gray-300 flex-shrink-0 mt-2" />
                      <span className="text-sm text-gray-600 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>

                {section.note && (
                  <div className="ml-12 mt-4 pl-4 border-l-2 border-gray-100">
                    <p className="text-xs text-gray-400 leading-relaxed">{section.note}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-100 bg-gray-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-xl">
            <h3 className="text-2xl text-black mb-3">{content.contact.title}</h3>
            <p className="text-sm text-gray-500 mb-6">{content.contact.body}</p>
            <Link
              to="/contacts"
              className="inline-flex items-center gap-2 bg-black text-white text-xs px-6 py-3 hover:bg-gray-900 transition-colors"
            >
              {content.contact.cta}
              <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
