import { useLanguage } from '../contexts/LanguageContext';
import { SeoHead } from '../components/SeoHead';
import { Link } from 'react-router';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const content = {
  ro: {
    seoTitle: 'Despre Sporto (SPORTOSFERA S.R.L.) | Echipamente Italiene, Moldova 2023',
    seoDesc: 'Sporto (SPORTOSFERA S.R.L.) fondată în 2023 în Chișinău. Distribuitor B2C, B2B și B2G de echipamente sportive și fitness din Italia și Europa.',
    heading: 'Despre Noi',
    tag: 'Sporto · SPORTOSFERA S.R.L.',
    paragraphs: [
      'Sporto (SPORTOSFERA S.R.L.) a fost înființată în anul 2023, având ca domeniu principal de activitate comercializarea articolelor destinate sportului. Activăm în mai multe segmente de piață: B2C, B2B și B2G.',
      'Clienților noștri le oferim o abordare individuală, prețuri competitive și soluții avantajoase, adaptate necesităților fiecăruia. Pentru noi nu este importantă doar comercializarea produselor, ci și contribuția la dezvoltarea sportului în Republica Moldova, făcându-l mai accesibil pentru toți.',
      'Reieșind din experiența noastră, am implementat mai multe procese care ne permit să oferim soluții personalizate pentru a satisface cerințele clienților din orice segment de activitate.',
      'Marea majoritate a articolelor pe care le comercializăm provine din Italia și din alte state ale Uniunii Europene — branduri consacrate, producători de renume, calitate certificată. Pe lângă produsele comercializate, Sporto prestează și servicii specifice domeniului sportiv.',
    ],
    slogan: 'Sporto te încurajează să adopți un mod activ de viață prin practicarea sportului!',
    ctaLabel: 'Solicită Ofertă',
    catalogLabel: 'Vezi Catalogul',
    segments: ['B2C', 'B2B', 'B2G'],
    segmentsLabel: 'Segmente de activitate',
    founded: '2023',
    foundedLabel: 'Anul fondării',
    origin: 'Italia & UE',
    originLabel: 'Origine produse',
  },
  ru: {
    seoTitle: 'О Sporto (SPORTOSFERA S.R.L.) | Итальянское оборудование, Молдова 2023',
    seoDesc: 'Sporto (SPORTOSFERA S.R.L.) основана в 2023 году в Кишинёве. Дистрибьютор B2C, B2B и B2G итальянского и европейского спортивного и фитнес-оборудования.',
    heading: 'О нас',
    tag: 'Sporto · SPORTOSFERA S.R.L.',
    paragraphs: [
      'Sporto (SPORTOSFERA S.R.L.) была основана в 2023 году, и основным направлением её деятельности является продажа товаров, предназначенных для спорта. Мы работаем в нескольких рыночных сегментах: B2C, B2B и B2G.',
      'Нашим клиентам мы предлагаем индивидуальный подход, конкурентные цены и выгодные решения, адаптированные к их потребностям. Для нас важно не только продавать спортивные товары, но и вносить вклад в развитие спорта в Республике Молдова, делая его более доступным для всех.',
      'Исходя из нашего опыта, мы внедрили ряд процессов, которые позволяют нам предлагать персонализированные решения и удовлетворять требования клиентов из любого сегмента рынка.',
      'Большинство товаров, которые мы предлагаем, поступают из Италии и других стран Европейского союза — признанные бренды, производители с репутацией, сертифицированное качество. Помимо продажи товаров, Sporto также оказывает услуги, связанные со спортивной сферой.',
    ],
    slogan: 'Sporto призывает вас вести активный образ жизни и заниматься спортом!',
    ctaLabel: 'Запросить Предложение',
    catalogLabel: 'Смотреть Каталог',
    segments: ['B2C', 'B2B', 'B2G'],
    segmentsLabel: 'Сегменты деятельности',
    founded: '2023',
    foundedLabel: 'Год основания',
    origin: 'Италия & ЕС',
    originLabel: 'Происхождение товаров',
  },
};

// ── Static FAQ (bilingual, SEO-optimised) ────────────────────────────────────
const FAQ = {
  ro: [
    {
      q: 'Livrați echipamente sportive în toată Moldova?',
      a: 'Da, livrăm în toată Republica Moldova. Comenzile din Chișinău sunt procesate în 1–2 zile lucrătoare, iar în restul țării — în 3–5 zile. Livrarea se efectuează prin curierat sau transport propriu pentru comenzi mari.',
    },
    {
      q: 'Oferiți prețuri wholesale pentru echipamente fitness?',
      a: 'Da, oferim condiții speciale B2B pentru cluburi fitness, săli de sport, magazine sportive și instituții. Prețurile se stabilesc individual în funcție de volumul comenzii. Contactați-ne — consultanța este gratuită.',
    },
    {
      q: 'Ce garanție oferiți pe echipamentele sportive?',
      a: 'Toate echipamentele comercializate de Sporto (SPORTOSFERA S.R.L.) beneficiază de garanție de minimum 12 luni. Produsele provin din Italia și UE — branduri certificate cu reputație internațională. Serviciul post-vânzare este asigurat de echipa noastră.',
    },
    {
      q: 'Puteți echipa o sală de sport pentru o școală sau instituție publică?',
      a: 'Da, lucrăm activ în segmentul B2G — dotăm școli, licee, grădinițe, instituții publice și primării. Oferim inventar sportiv conform normativelor, prețuri speciale pentru licitații și documentație completă pentru proiecte la cheie.',
    },
  ],
  ru: [
    {
      q: 'Доставляете ли вы спортивное оборудование по всей Молдове?',
      a: 'Да, доставляем по всей Молдове. Заказы по Кишинёву выполняются за 1–2 рабочих дня, по остальным регионам — за 3–5 дней. Доставка осуществляется курьером или собственным транспортом для крупных партий.',
    },
    {
      q: 'Предоставляете ли вы оптовые цены на фитнес-оборудование?',
      a: 'Да, предлагаем специальные условия B2B для фитнес-клубов, спортивных залов, магазинов и учреждений. Условия рассчитываются индивидуально в зависимости от объёма заказа. Свяжитесь с нами — консультация бесплатна.',
    },
    {
      q: 'Какая гарантия предоставляется на спортивное оборудование?',
      a: 'Всё оборудование Sporto (SPORTOSFERA S.R.L.) имеет гарантию не менее 12 месяцев. Продукция поставляется из Италии и ЕС — сертифицированные бренды с международной репутацией. Постпродажное обслуживание обеспечивает наша команда.',
    },
    {
      q: 'Можете ли вы оснастить спортзал для школы или государственного учреждения?',
      a: 'Да, работаем в сегменте B2G — оснащаем школы, лицеи, детские сады, государственные учреждения и муниципальные объекты. Предлагаем инвентарь по нормативам, специальные цены для тендеров и полный пакет документации.',
    },
  ],
};

export function About() {
  const { language } = useLanguage();
  const c = content[language as 'ro' | 'ru'];
  const lang = language as 'ro' | 'ru';
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const faqItems = FAQ[lang];

  return (
    <div className="min-h-screen bg-white">
      <SeoHead
        title={c.seoTitle}
        description={c.seoDesc}
        keywords={language === 'ro'
          ? 'Sporto, SPORTOSFERA despre noi, echipament sportiv italian Moldova 2023, distribuitor sport Chisinau, B2B B2C B2G sport Moldova'
          : 'Sporto, SPORTOSFERA о нас, итальянское спортивное оборудование Молдова 2023, дистрибьютор спорт Кишинёв, B2B B2C B2G спорт Молдова'}
        canonical="/about"
        lang={language as 'ro' | 'ru'}
      />

      {/* ── PAGE HEADER ── */}
      <section className="bg-black text-white">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-end">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-px h-4 bg-gray-600" />
                <span className="text-xs text-gray-500 uppercase tracking-[0.2em]">{c.tag}</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl text-white leading-tight">
                {c.heading}
              </h1>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-3 gap-px bg-gray-800">
              <div className="bg-black p-6 text-center">
                <div className="text-3xl text-white tabular-nums">{c.founded}</div>
                <div className="text-xs text-gray-600 mt-1 uppercase tracking-widest">{c.foundedLabel}</div>
              </div>
              <div className="bg-black p-6 text-center">
                <div className="text-3xl text-white">3</div>
                <div className="text-xs text-gray-600 mt-1 uppercase tracking-widest">{c.segmentsLabel}</div>
              </div>
              <div className="bg-black p-6 text-center">
                <div className="text-xl text-white">🌍</div>
                <div className="text-xs text-gray-600 mt-1 uppercase tracking-widest">{c.originLabel}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ── */}
      <section className="py-16 md:py-24">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12">

            {/* Segments sidebar */}
            <div className="lg:col-span-3">
              <div className="sticky top-24">
                <p className="text-xs text-gray-400 uppercase tracking-[0.15em] mb-4">
                  {c.segmentsLabel}
                </p>
                <div className="flex flex-row lg:flex-col gap-2">
                  {c.segments.map((seg) => (
                    <div
                      key={seg}
                      className="border border-black px-4 py-3 text-sm text-black uppercase tracking-wider"
                    >
                      {seg}
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-8 border-t border-gray-100">
                  <p className="text-xs text-gray-400 uppercase tracking-[0.15em] mb-3">
                    {c.originLabel}
                  </p>
                  <p className="text-sm text-gray-900">{c.origin}</p>
                </div>
              </div>
            </div>

            {/* Text content */}
            <div className="lg:col-span-9">
              <div className="space-y-8">
                {c.paragraphs.map((para, i) => (
                  <p
                    key={i}
                    className={`leading-relaxed ${
                      i === 0
                        ? 'text-lg md:text-xl text-gray-900'
                        : 'text-base text-gray-600'
                    }`}
                  >
                    {para}
                  </p>
                ))}
              </div>

              {/* Slogan block */}
              <div className="mt-12 border-l-2 border-black pl-6 py-2">
                <p className="text-lg md:text-xl text-black italic leading-relaxed">
                  {c.slogan}
                </p>
              </div>

              {/* CTA */}
              <div className="mt-12 flex flex-wrap gap-4">
                <Link
                  to="/contacts"
                  className="inline-flex items-center gap-2 bg-black text-white text-xs uppercase tracking-wider px-6 py-3 hover:bg-gray-800 transition-colors"
                >
                  {c.ctaLabel}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to="/catalog"
                  className="inline-flex items-center gap-2 border border-black text-black text-xs uppercase tracking-wider px-6 py-3 hover:bg-black hover:text-white transition-colors"
                >
                  {c.catalogLabel}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BENTO BOTTOM ── */}
      <section className="py-12 md:py-16 bg-gray-50 border-t border-gray-100">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">

            {/* B2C */}
            <div className="bg-white border border-gray-200 p-6">
              <div className="text-xs text-gray-400 uppercase tracking-widest mb-3">B2C</div>
              <div className="text-sm text-gray-900 leading-relaxed">
                {language === 'ro'
                  ? 'Comercializarea echipamentelor sportive direct către consumatorul final.'
                  : 'Продажа спортивного оборудования напрямую конечному потребителю.'}
              </div>
            </div>

            {/* B2B */}
            <div className="bg-black text-white p-6">
              <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">B2B</div>
              <div className="text-sm text-gray-300 leading-relaxed">
                {language === 'ro'
                  ? 'Soluții wholesale pentru cluburi fitness, magazine sportive și antreprenori.'
                  : 'Оптовые решения для фитнес-клубов, спортивных магазинов и предпринимателей.'}
              </div>
            </div>

            {/* B2G */}
            <div className="bg-white border border-gray-200 p-6">
              <div className="text-xs text-gray-400 uppercase tracking-widest mb-3">B2G</div>
              <div className="text-sm text-gray-900 leading-relaxed">
                {language === 'ro'
                  ? 'Dotarea instituțiilor publice, școlilor și organizațiilor de stat.'
                  : 'Оснащение государственных учреждений, школ и организаций.'}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 md:py-24 border-t border-gray-100">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12">

            {/* Label */}
            <div className="lg:col-span-3">
              <p className="text-xs text-gray-400 uppercase tracking-[0.15em] mb-2">FAQ</p>
              <p className="text-sm text-gray-500 leading-relaxed">
                {lang === 'ro' ? 'Întrebări frecvente' : 'Часто задаваемые вопросы'}
              </p>
            </div>

            {/* Accordion */}
            <div className="lg:col-span-9 divide-y divide-gray-100">
              {faqItems.map((item, i) => (
                <div key={i}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between gap-4 py-5 text-left group"
                  >
                    <span className={`text-sm leading-relaxed transition-colors ${openFaq === i ? 'text-black' : 'text-gray-700 group-hover:text-black'}`}>
                      {item.q}
                    </span>
                    <ChevronDown className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform duration-200 ${openFaq === i ? 'rotate-180 text-black' : ''}`} />
                  </button>
                  {openFaq === i && (
                    <div className="pb-5">
                      <p className="text-sm text-gray-500 leading-relaxed">{item.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}