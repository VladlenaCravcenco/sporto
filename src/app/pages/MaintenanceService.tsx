import { Link } from 'react-router';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowRight, Check, ChevronLeft, ChevronRight, ChevronDown, MapPin, Truck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ConsultationModal } from '../components/ConsultationModal';
import { SeoHead, SEO_PAGES } from '../components/SeoHead';

type Lang = 'ro' | 'ru';

export function MaintenanceService() {
  const { language } = useLanguage();
  const lang = language as Lang;
  const [modalOpen, setModalOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [mobileStep, setMobileStep] = useState<number | null>(0);
  const [localOverride, setLocalOverride] = useState<any>(null);

  // Read admin overrides from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('sporto_services');
      if (raw) {
        const parsed = JSON.parse(raw);
        setLocalOverride(parsed?.maintenance || null);
      }
    } catch {}
  }, []);

  const C = {
    ro: {
      eyebrow: 'Service & Mentenanță · B2B',
      heroTitle: 'Echipamentele tale\nfuncționează mereu.',
      heroBody:
        'Mentenanță preventivă, reparații rapide și contracte de service personalizate. Reducem costurile de exploatare și prelungim durata de viață a echipamentelor tale.',
      cta: 'Programează o inspecție gratuită',
      ctaSub: 'Tehnicianul te contactează în 4 ore',
      stats: [
        { n: '24/7', label: 'Suport tehnic disponibil' },
        { n: '<4h', label: 'Timp de răspuns garantat' },
        { n: '5 ani', label: 'Garanție extinsă pe lucrări' },
      ],
      servicesEyebrow: 'Serviciile noastre',
      servicesTitle: 'Tot ce ai nevoie\npentru echipamentul tău',
      services: [
        {
          num: '01',
          title: 'Mentenanță Preventivă',
          body: 'Inspecții regulate la intervale stabilite: lubrifiere, ajustări, curățare, înlocuire piese uzate. Problemele sunt detectate înainte să apară defecțiunea.',
        },
        {
          num: '02',
          title: 'Reparații Profesionale',
          body: 'Diagnosticare precisă și reparație rapidă cu piese originale. Garanție pe fiecare lucrare. Intervenție la sediul tău fără transport costisitor.',
        },
        {
          num: '03',
          title: 'Suport Tehnic 24/7',
          body: 'Linie telefonică dedicată non-stop. Dacă nu rezolvăm problema remote, un tehnician ajunge la tine în maximum 4 ore.',
        },
        {
          num: '04',
          title: 'Contracte de Service',
          body: 'Pachete lunare cu prețuri fixe și intervenții prioritare. Planifici bugetul fără surprize. Reduceri față de tarifele la cerere.',
        },
      ],
      packagesEyebrow: 'Pachete de service',
      packagesTitle: 'Alege planul\npotrivit sălii tale',
      packages: [
        {
          name: 'Basic',
          price: '199',
          currency: '€',
          period: lang === 'ro' ? '/lună' : '/мес',
          note: 'Săli până la 20 aparate',
          features: [
            'Inspecție lunară complet',
            'Mentenanță preventivă de bază',
            'Raport tehnic detaliat',
            'Suport telefonic în program',
          ],
          featured: false,
          cta: 'Alege Basic',
        },
        {
          name: 'Professional',
          price: '399',
          currency: '€',
          period: '/lună',
          note: 'Recomandat pentru săli medii',
          features: [
            'Inspecții de 2×/lună',
            'Mentenanță preventivă completă',
            'Reparații minore incluse',
            'Piese de schimb la preț redus',
            'Suport prioritar 24/7',
            'Rapoarte detaliate cu istoric',
          ],
          featured: true,
          cta: 'Alege Professional',
        },
        {
          name: 'Premium',
          price: 'Custom',
          currency: '',
          period: '',
          note: 'Centre fitness & hoteluri',
          features: [
            'Inspecții săptămânale',
            'Tot ce include Professional',
            'Toate reparațiile incluse',
            'Piese de schimb incluse',
            'Tehnician dedicat on-site',
            'Garanție extinsă 5 ani',
          ],
          featured: false,
          cta: 'Solicită ofertă',
        },
      ],
      processEyebrow: 'Cum funcționează',
      processTitle: 'De la apel\nla echipamente funcționale',
      steps: [
        { n: '01', title: 'Inspecție gratuită', body: 'Trimiți o solicitare sau suni. Tehnicianul vine și evaluează starea echipamentelor — fără costuri.' },
        { n: '02', title: 'Plan & Ofertă', body: 'Primești un plan de mentenanță și oferta contractului, cu prețuri clare și fără costuri ascunse.' },
        { n: '03', title: 'Execuție lucrări', body: 'Tehnicianul certificat efectuează lucrările la sediul tău, în intervalul orar agreat.' },
        { n: '04', title: 'Raport & Garanție', body: 'Documentăm fiecare intervenție. Primești raport scris și garanție pe lucrare.' },
      ],
      ctaTitle: 'Programează o\ninspecție gratuită',
      ctaBody: 'Un tehnician certificat evaluează starea echipamentelor tale fără niciun cost. Afli exact ce ai nevoie — fără obligații.',
      ctaBtn: 'Vreau inspecție gratuită',
      ctaLink: 'sau cumpără echipamente noi →',
      deliveryEyebrow: 'Livrare & Logistică',
      deliveryTitle: 'Livrare rapidă\nîn toată Moldova',
      deliveryDesc: 'Livrăm piese de schimb și echipamente la sediul tău. Aceleași standarde de calitate ca pentru vânzările de echipamente noi.',
      deliveryZones: [
        { city: 'Chișinău', time: '1–2 zile', price: 'Gratuit de la 500 MDL' },
        { city: 'Alte orașe RM', time: '2–5 zile', price: 'Calculat individual' },
      ],
    },
    ru: {
      eyebrow: 'Сервис & Обслуживание · B2B',
      heroTitle: 'Ваше оборудование\nработает всегда.',
      heroBody:
        'Профилактическое обслуживание, быстрый ремонт и индивидуальные сервисные контракты. Снижаем эксплуатационные расходы и продлеваем срок службы вашего оборудования.',
      cta: 'Записаться на бесплатный осмотр',
      ctaSub: 'Техник свяжется в течение 4 часов',
      stats: [
        { n: '24/7', label: 'Техническая поддержка' },
        { n: '<4ч', label: 'Гарантированное время отклика' },
        { n: '5 лет', label: 'Расширенная гарантия на работы' },
      ],
      servicesEyebrow: 'Наши услуги',
      servicesTitle: 'Всё что нужно\nвашему оборудованию',
      services: [
        {
          num: '01',
          title: 'Профилактическое обслуживание',
          body: 'Регулярные осмотры по графику: смазка, регулировки, очистка, замена изношенных деталей. Проблемы выявляются до поломки.',
        },
        {
          num: '02',
          title: 'Профессиональный ремонт',
          body: 'Точная диагностика и быстрый ремонт оригинальными запчастями. Гарантия на каждую работу. Выезд к вам без дорогостоящей транспортировки.',
        },
        {
          num: '03',
          title: 'Техническая поддержка 24/7',
          body: 'Выделенная линия круглосуточно. Если не решаем проблему удалённо — техник приедет к вам максимум за 4 часа.',
        },
        {
          num: '04',
          title: 'Сервисные контракты',
          body: 'Ежемесячные пакеты с фиксированными ценами и приоритетным обслуживанием. Планируете бюджет без сюрпризов. Скидки к разовым тарифам.',
        },
      ],
      packagesEyebrow: 'Пакеты обслуживания',
      packagesTitle: 'Выберите план\nдля вашего зала',
      packages: [
        {
          name: 'Basic',
          price: '199',
          currency: '€',
          period: '/мес',
          note: 'Залы до 20 единиц',
          features: [
            'Полный ежемесячный осмотр',
            'Базовое профилактическое ТО',
            'Детальный технический отчёт',
            'Телефонная поддержка в рабочее время',
          ],
          featured: false,
          cta: 'Выбрать Basic',
        },
        {
          name: 'Professional',
          price: '399',
          currency: '€',
          period: '/мес',
          note: 'Рекомендуется для средних залов',
          features: [
            'Осмотры 2 раза в месяц',
            'Полное профилактическое ТО',
            'Мелкий ремонт включён',
            'Запчасти по сниженной цене',
            'Приоритетная поддержка 24/7',
            'Детальные отчёты с историей',
          ],
          featured: true,
          cta: 'Выбрать Professional',
        },
        {
          name: 'Premium',
          price: 'Custom',
          currency: '',
          period: '',
          note: 'Фитнес-центры & отели',
          features: [
            'Еженедельные осмотры',
            'Всё из Professional',
            'Весь ремонт включён',
            'Запчасти включены',
            'Выделенный техник on-site',
            'Расширенная гарантия 5 лет',
          ],
          featured: false,
          cta: 'Запросить предложение',
        },
      ],
      processEyebrow: 'Как это работает',
      processTitle: 'От звонка\nдо работающего оборудования',
      steps: [
        { n: '01', title: 'Бесплатный осмотр', body: 'Оставляете заявку или звоните. Техник приезжает и оценивает состояние оборудования — без оплаты.' },
        { n: '02', title: 'План & Предложение', body: 'Получаете план обслуживания и предложение по контракту с прозрачными ценами и без скрытых расходов.' },
        { n: '03', title: 'Выполнение работ', body: 'Сертифицированный техник проводит работы на вашем объекте в согласованное время.' },
        { n: '04', title: 'Отчёт & Гарантия', body: 'Документируем каждое вмешательство. Получаете письменный отчёт и гарантию на работу.' },
      ],
      ctaTitle: 'Запишитесь на\nбесплатный осмотр',
      ctaBody: 'Сертифицированный техник оценит состояние вашего оборудования без какой-либо оплаты. Узнаете точно, что нужно — без обязательств.',
      ctaBtn: 'Хочу бесплатный осмотр',
      ctaLink: 'или купить новое оборудование →',
      deliveryEyebrow: 'Доставка & Логистика',
      deliveryTitle: 'Быстрая доставка\nпо всей Молдове',
      deliveryDesc: 'Доставляем запчасти и оборудование на ваш объект. Те же стандарты качества, что и для продажи нового оборудования.',
      deliveryZones: [
        { city: 'Кишинёв', time: '1–2 дня', price: 'Бесплатно от 500 MDL' },
        { city: 'Другие города РМ', time: '2–5 дней', price: 'Рассчитывается отдельно' },
      ],
    },
  }[lang];

  // Hardcoded — override with localStorage admin data if available
  const heroTitle = (lang === 'ro' ? localOverride?.hero_title_ro : localOverride?.hero_title_ru) || C.heroTitle;
  const heroBody  = (lang === 'ro' ? localOverride?.hero_body_ro  : localOverride?.hero_body_ru)  || C.heroBody;
  const cta       = (lang === 'ro' ? localOverride?.cta_ro        : localOverride?.cta_ru)        || C.cta;
  const stats = (localOverride?.stats_json?.length > 0
    ? localOverride.stats_json.map((s: any) => ({ n: s[`n_${lang}`] || s.n_ro || '', label: s[`label_${lang}`] || s.label_ro || '' }))
    : null) || C.stats;
  const packages = (localOverride?.packages_json?.length > 0
    ? localOverride.packages_json.map((p: any) => ({
        name:     p.name     || '',
        price:    p.price    || '',
        currency: p.currency || '€',
        period:   p[`period_${lang}`] || p.period_ro || '',
        note:     p[`note_${lang}`]   || p.note_ro   || '',
        features: (p[`features_${lang}`] || p.features_ro || '').split('\n').filter(Boolean),
        featured: p.featured || false,
        cta:      p[`cta_${lang}`] || p.cta_ro || '',
      }))
    : null) || C.packages;

  return (
    <div className="min-h-screen bg-white text-black overflow-x-hidden">

      <ConsultationModal open={modalOpen} onClose={() => setModalOpen(false)} type="maintenance" />
      <SeoHead
        title={SEO_PAGES.maintenance[lang].title}
        description={SEO_PAGES.maintenance[lang].description}
        keywords={SEO_PAGES.maintenance[lang].keywords}
        canonical="/maintenance-service"
        lang={lang}
      />

      {/* ─────────────────────────────────────────────────────────────────
          HERO
      ───────────────────────────────────────────────────────────────── */}
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-16 pt-16 sm:pt-20 pb-16 sm:pb-24 border-b border-gray-100">
        <div className="max-w-4xl">
          <h1 className="text-[clamp(2rem,5.5vw,5rem)] leading-[1.05] tracking-tight text-black whitespace-pre-line mb-6 sm:mb-8">
            {heroTitle}
          </h1>
          <p className="text-base text-gray-500 leading-relaxed max-w-xl mb-8 sm:mb-12">
            {heroBody}
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 bg-black text-white px-6 sm:px-8 py-4 text-xs uppercase tracking-widest hover:bg-gray-900 transition-colors"
            >
              {cta}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs text-gray-400">{C.ctaSub}</span>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          STATS
      ───────────────────────────────────────────────────────────────── */}
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-16 py-10 sm:py-16 border-b border-gray-100">
        <div className="grid grid-cols-3 divide-x divide-gray-100">
          {stats.map((s: any, i: number) => (
            <div key={i} className="px-3 sm:px-8 first:pl-0 last:pr-0 py-4">
              <div className="text-[clamp(1.5rem,5vw,3.5rem)] tabular-nums tracking-tight text-black leading-none mb-2 sm:mb-3">
                {s.n}
              </div>
              <div className="text-[9px] sm:text-[11px] uppercase tracking-[0.08em] sm:tracking-[0.15em] text-gray-400 leading-snug">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          SERVICES
      ───────────────────────────────────────────────────────────────── */}
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-16 py-16 sm:py-24 border-b border-gray-100">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-24">

          <div className="lg:col-span-4">
            <h2 className="text-[clamp(1.6rem,3vw,2.8rem)] leading-[1.1] tracking-tight whitespace-pre-line mb-8">
              {C.servicesTitle}
            </h2>
            <div className="w-8 h-px bg-black" />
          </div>

          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-8 sm:gap-y-10">
            {C.services.map((s) => (
              <div key={s.num}>
                <div className="text-[11px] uppercase tracking-[0.2em] text-gray-300 mb-4">{s.num}</div>
                <h3 className="text-sm text-black mb-3">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          PACKAGES
      ───────────────────────────────────────────────────────────────── */}
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-16 py-16 sm:py-24 border-b border-gray-100">
        <div className="mb-10 sm:mb-16">
          <h2 className="text-[clamp(1.6rem,3vw,2.8rem)] leading-[1.1] tracking-tight whitespace-pre-line">
            {C.packagesTitle}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {packages.map((pkg: any) => (
            <div
              key={pkg.name}
              className={`flex flex-col p-6 sm:p-10 border transition-colors ${
                pkg.featured
                  ? 'bg-black text-white border-black'
                  : 'bg-white border-gray-200 hover:border-gray-400'
              }`}
            >
              {/* Package name + note */}
              <div className="mb-6 sm:mb-8">
                <div className={`text-[11px] uppercase tracking-[0.2em] mb-1 ${pkg.featured ? 'text-gray-500' : 'text-gray-400'}`}>
                  {pkg.name}
                </div>
                <div className={`text-xs ${pkg.featured ? 'text-gray-600' : 'text-gray-400'}`}>{pkg.note}</div>
              </div>

              {/* Price */}
              <div className="mb-8 sm:mb-10 pb-8 sm:pb-10 border-b border-current" style={{ borderColor: pkg.featured ? '#333' : '#e5e7eb' }}>
                <div className="flex items-end gap-1.5 leading-none">
                  <span className={`text-[3rem] tabular-nums tracking-tight ${pkg.featured ? 'text-white' : 'text-black'}`}>
                    {pkg.price}
                  </span>
                  {pkg.currency && (
                    <span className={`text-base mb-1.5 ${pkg.featured ? 'text-gray-500' : 'text-gray-400'}`}>
                      {pkg.currency}{pkg.period}
                    </span>
                  )}
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-4 flex-1 mb-8 sm:mb-10">
                {pkg.features.map((f: string, j: number) => (
                  <li key={j} className="flex items-start gap-3">
                    <Check className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${pkg.featured ? 'text-gray-500' : 'text-gray-400'}`} />
                    <span className={`text-sm leading-relaxed ${pkg.featured ? 'text-gray-300' : 'text-gray-600'}`}>{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                to="/order-request"
                className={`flex items-center justify-center gap-2 py-3.5 text-[10px] uppercase tracking-widest transition-colors border ${
                  pkg.featured
                    ? 'bg-white text-black border-white hover:bg-gray-100'
                    : 'border-gray-200 text-gray-600 hover:border-black hover:text-black'
                }`}
                onClick={e => { e.preventDefault(); setModalOpen(true); }}
              >
                {pkg.cta}
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          PROCESS
      ───────────────────────────────────────────────────────────────── */}
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-16 py-16 sm:py-24 border-b border-gray-100">
        <div className="mb-10 sm:mb-16">
          <h2 className="text-[clamp(1.6rem,3vw,2.8rem)] leading-[1.1] tracking-tight whitespace-pre-line">
            {C.processTitle}
          </h2>
        </div>

        {/* ── DESKTOP STEPPER ── */}
        <div className="hidden lg:block">

          {/* Step nodes + connecting lines */}
          <div className="flex items-start mb-0">
            {C.steps.map((step, i) => (
              <div key={step.n} className="flex items-start flex-1 last:flex-none">

                {/* Node */}
                <button
                  onClick={() => setActiveStep(i)}
                  className="flex flex-col items-center gap-4 group flex-shrink-0 focus:outline-none"
                  style={{ width: 120 }}
                >
                  {/* Indicator */}
                  <div className="relative flex items-center justify-center">
                    {i === activeStep && (
                      <motion.div
                        layoutId="maint-step-ring"
                        className="absolute w-14 h-14 border border-black/20"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                    <div
                      className={`w-10 h-10 flex items-center justify-center transition-all duration-300 ${
                        i <= activeStep
                          ? 'bg-black text-white'
                          : 'bg-white border border-gray-200 text-gray-300'
                      }`}
                    >
                      {i < activeStep ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <span className="text-[10px] tracking-widest">{step.n}</span>
                      )}
                    </div>
                  </div>

                  {/* Step title */}
                  <span
                    className={`text-[11px] text-center leading-snug transition-colors duration-300 ${
                      i === activeStep ? 'text-black' : i < activeStep ? 'text-gray-500' : 'text-gray-300'
                    }`}
                    style={{ maxWidth: 100 }}
                  >
                    {step.title}
                  </span>
                </button>

                {/* Connector line */}
                {i < C.steps.length - 1 && (
                  <div className="flex-1 relative mt-5 mx-1" style={{ height: 1 }}>
                    <div className="absolute inset-0 bg-gray-100" />
                    <motion.div
                      className="absolute inset-0 bg-black origin-left"
                      initial={false}
                      animate={{ scaleX: i < activeStep ? 1 : 0 }}
                      transition={{ duration: 0.4, ease: 'easeInOut' }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Detail panel */}
          <div className="mt-10 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                className="border border-gray-100 bg-gray-50"
              >
                <div className="grid grid-cols-12 gap-0">

                  {/* Big number accent */}
                  <div className="col-span-2 border-r border-gray-100 p-10 flex flex-col justify-between">
                    <span className="text-[5rem] leading-none tabular-nums text-gray-100 select-none">
                      {C.steps[activeStep].n}
                    </span>
                    {/* Nav arrows */}
                    <div className="flex gap-2 mt-6">
                      <button
                        onClick={() => setActiveStep(s => Math.max(0, s - 1))}
                        disabled={activeStep === 0}
                        className="w-9 h-9 flex items-center justify-center border border-gray-200 text-gray-400 hover:border-black hover:text-black disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setActiveStep(s => Math.min(C.steps.length - 1, s + 1))}
                        disabled={activeStep === C.steps.length - 1}
                        className="w-9 h-9 flex items-center justify-center border border-gray-200 text-gray-400 hover:border-black hover:text-black disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="col-span-7 p-10 flex flex-col justify-center">
                    <h3 className="text-2xl tracking-tight text-black mb-5">
                      {C.steps[activeStep].title}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed max-w-lg">
                      {C.steps[activeStep].body}
                    </p>
                  </div>

                  {/* Progress dots */}
                  <div className="col-span-3 border-l border-gray-100 p-10 flex flex-col justify-center gap-3">
                    {C.steps.map((s, i) => (
                      <button
                        key={s.n}
                        onClick={() => setActiveStep(i)}
                        className="flex items-center gap-3 text-left group/dot"
                      >
                        <div className={`w-1.5 h-1.5 flex-shrink-0 transition-all duration-200 ${
                          i === activeStep ? 'bg-black scale-150' : i < activeStep ? 'bg-gray-400' : 'bg-gray-200'
                        }`} />
                        <span className={`text-[11px] transition-colors duration-200 ${
                          i === activeStep ? 'text-black' : 'text-gray-400 group-hover/dot:text-gray-600'
                        }`}>
                          {s.title}
                        </span>
                      </button>
                    ))}
                  </div>

                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ── MOBILE ACCORDION ── */}
        <div className="lg:hidden relative">
          {/* Vertical line */}
          <div className="absolute left-[19px] top-0 bottom-0 w-px bg-gray-100" />

          <div className="space-y-0">
            {C.steps.map((step, i) => {
              const isOpen = mobileStep === i;
              return (
                <div key={step.n} className="relative">
                  <button
                    onClick={() => setMobileStep(isOpen ? null : i)}
                    className="w-full flex items-center gap-4 py-5 text-left"
                  >
                    <div className={`relative z-10 w-10 h-10 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                      isOpen ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-400'
                    }`}>
                      <span className="text-[10px] tracking-widest">{step.n}</span>
                    </div>
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                      <h3 className={`text-sm transition-colors ${isOpen ? 'text-black' : 'text-gray-600'}`}>
                        {step.title}
                      </h3>
                      <ChevronDown className={`w-4 h-4 flex-shrink-0 text-gray-300 transition-transform duration-300 ${isOpen ? 'rotate-180 text-black' : ''}`} />
                    </div>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="overflow-hidden"
                      >
                        <div className="ml-14 pb-6 pr-2">
                          <p className="text-sm text-gray-500 leading-relaxed">{step.body}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {i < C.steps.length - 1 && <div className="h-px bg-gray-50 ml-14" />}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          DELIVERY & LOGISTICS
      ───────────────────────────────────────────────────────────────── */}
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-16 py-16 sm:py-24 border-b border-gray-100 bg-gray-50">
        <div className="mb-10 sm:mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Truck className="w-5 h-5 text-gray-400" />
            <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400">{C.deliveryEyebrow}</p>
          </div>
          <h2 className="text-[clamp(1.6rem,3vw,2.8rem)] leading-[1.1] tracking-tight whitespace-pre-line mb-4">
            {C.deliveryTitle}
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-xl">
            {C.deliveryDesc}
          </p>
        </div>

        {/* Delivery zones table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {C.deliveryZones.map((zone: any, i: number) => (
            <div
              key={i}
              className="bg-white border border-gray-200 p-6 sm:p-8 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start gap-3 mb-4">
                <MapPin className="w-4 h-4 text-black mt-0.5 flex-shrink-0" />
                <h3 className="text-base text-black">{zone.city}</h3>
              </div>
              <div className="ml-7 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <span className="text-sm text-gray-600">{zone.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <span className="text-sm text-gray-600">{zone.price}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional info link */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <Link
            to="/delivery-terms"
            className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-black transition-colors group"
          >
            <span>{lang === 'ro' ? 'Condiții complete de livrare' : 'Полные условия доставки'}</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          CTA
      ───────────────────────────────────────────────────────────────── */}
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-16 py-16 sm:py-24">
        <div className="bg-black text-white px-6 sm:px-12 md:px-20 py-14 sm:py-20">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-[clamp(1.8rem,4vw,3.5rem)] leading-[1.05] tracking-tight text-white whitespace-pre-line mb-6">
              {C.ctaTitle}
            </h2>
            <p className="text-base text-gray-400 leading-relaxed mb-8 sm:mb-10">
              {C.ctaBody}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 bg-white text-black px-8 sm:px-10 py-4 text-xs uppercase tracking-widest hover:bg-gray-100 transition-colors"
              >
                {C.ctaBtn}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <Link to="/catalog" className="text-xs text-gray-500 hover:text-white transition-colors">
                {C.ctaLink}
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}