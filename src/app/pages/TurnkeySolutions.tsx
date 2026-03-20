import { Link } from 'react-router';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowRight, Check, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ConsultationModal } from '../components/ConsultationModal';
import { SeoHead, SEO_PAGES } from '../components/SeoHead';

type Lang = 'ro' | 'ru';

export function TurnkeySolutions() {
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
        setLocalOverride(parsed?.turnkey || null);
      }
    } catch {}
  }, []);

  const C = {
    ro: {
      eyebrow: 'Soluții complete · B2B',
      heroTitle: 'Sala ta de fitness,\nde la idee la realitate..',
      heroBody:
        'Suntem furnizorul care preia tot: analiza spațiului, selecția echipamentelor, livrarea și montajul. Tu te concentrezi pe afacere — noi facem restul.',
      cta: 'Solicită ofertă gratuită',
      ctaSub: 'Răspundem în 24 ore',
      stats: [
        { n: '3+', label: 'Ani pe piață' },
        { n: '15+', label: 'Furnizori - echipament comercial' },
        { n: '100%', label: 'Transparență' },
      ],
      servicesEyebrow: 'Ce facem noi',
      servicesTitle: 'Ce primești în cadrul -\nSoluții la Cheie?',
      services: [
        {
          num: '01',
          title: 'Consultanță & Concept',
          body: 'Analizăm spațiul, bugetul și publicul țintă. Îți livrăm un concept clar, nu promisiuni vagi.',
        },
        {
          num: '02',
          title: 'Design & Planificare',
          body: 'Plan de amplasare a echipamentului, varietate mare de design a echipamentului, cantitatea optimală pentru start. Știi exact ce cumperi înainte så semnezi.',
        },
        {
          num: '03',
          title: 'Echipamente Profesionale',
          body: 'Selecție din catalogul de 8 000+ produse, prețuri angros, livrare directă de la depozit.',
        },
        {
          num: '04',
          title: 'Instalare & Training',
          body: 'Montajul echipamentului și instruirea personalului täu, garanție și suport pe termen lung.',
        },
      ],
      processEyebrow: 'Cum funcționează',
      processTitle: 'De la idee -\nla realitate.',
      steps: [
        { n: '01', title: 'Discuție inițială', body: 'Trimiteți o solicitare. Vă contactăm în 24h pentru a înțelege nevoile și bugetul.' },
        { n: '02', title: 'Concept & Ofertă', body: 'Primești planul de etaj, lista de echipamente și prețul final — fără costuri ascunse.' },
        { n: '03', title: 'Aprobare & Producție', body: 'Confirmi comanda. Pregătim echipamentele și programăm livrarea.' },
        { n: '04', title: 'Livrare & Montaj', body: 'Echipa noastră instalează tot la sediul tău, la data stabilită.' },
        { n: '05', title: 'Deschidere & Suport', body: 'Instruim personalul și rămânem disponibili după lansare pentru orice întrebare.' },
      ],
      whyEyebrow: 'De ce să ne alegi',
      whyTitle: 'Partenerul care\nîți apără investiția',
      why: [
        { title: 'Un singur interlocutor', body: 'Nu coordonezi furnizori diferiți. Noi preluăm tot, tu ai o singură persoană de contact.' },
        { title: 'Prețuri angros garantate', body: 'Aceleași prețuri ca pentru clienții instituționali, indiferent de dimensiunea proiectului.' },
        { title: 'Termene respectate', body: 'Data de livrare e scrisă în contract. Nu lucrăm cu estimări vagi.' },
        { title: 'Garanție extinsă', body: 'Garanție pe echipamente și pe instalare. Intervenție în 48h dacă ceva nu funcționează.' },
      
        { title: 'Suport post-lansare', body: 'Rămânem disponibili. Inspecție gratuită la 3 luni după deschidere.' },
      ],
      ctaTitle: 'Gata să începem?',
      ctaBody: 'Trimiteți-ne detaliile proiectului. Consultanța inițială și oferta sunt complet gratuite.',
      ctaBtn: 'Discutăm proiectul tău',
      ctaLink: 'sau explorează catalogul →',
    },
    ru: {
      eyebrow: 'Полный комплекс · B2B',
      heroTitle: 'Ваш фитнес-клуб,\nот нуля до открытия.',
      heroBody:
        'Мы партнёр, который берёт на себя всё: анализ помещения, подбор оборудвания, доставку и монтаж. Вы сосредоточены на бизнесе — мы делаем остальное.',
      cta: 'Запросить бесплатное предложение',
      ctaSub: 'Ответим в течение 24 часов',
      stats: [
        { n: '10+', label: 'Лет на рынке' },
        { n: '50+', label: 'Завершённых проектов' },
        { n: '100%', label: 'Поставка под ключ' },
      ],
      servicesEyebrow: 'Что мы делаем',
      servicesTitle: 'Один партнёр\nдля всего процесса',
      services: [
        {
          num: '01',
          title: 'Консультация & Конепция',
          body: 'Анализируем помещение, бюджет и целевую аудиторию. Предоставляем чёткую концепцию, а не расплывчатые обещания.',
        },
        {
          num: '02',
          title: 'Дизайн & Планирование',
          body: 'Детальный план этажа, оптимизированный поток пользователей, 3D-визуализация. Вы знаете, что покупаете, до подписания.',
        },
        {
          num: '03',
          title: 'Профессиональное оборудование',
          body: 'Подбор из каталога 8 000+ товаров, оптовые цены, прямая доставка со склада.',
        },
        {
          num: '04',
          title: 'Монтаж & Обучение',
          body: 'Сертифицированный профессиональный монтаж, обучение вашего персонала, полная гарантийная документация.',
        },
      ],
      processEyebrow: 'Как это работает',
      processTitle: 'От первого разговора\nдо открытия',
      steps: [
        { n: '01', title: 'Первичное обращение', body: 'Отправьте заявку. Мы свяжемся в течение 24ч, чтобы понять ваши потребности и бюджет.' },
        { n: '02', title: 'Концепция & Предложение', body: 'Вы получите план этажа, список оборудования и финальную цену — без скрытых расходов.' },
        { n: '03', title: 'Подтверждение & Подготовка', body: 'Подтверждаете заказ. Мы готовим оборудование и согласовываем дату доставки.' },
        { n: '04', title: 'Доставка & Мнтаж', body: 'Наша команда устанавливает всё на вашем объекте в согласованную дату.' },
        { n: '05', title: 'Открытие & Поддержка', body: 'Обучаем персонал и остаёмся на связи после запуска по любым вопросам.' },
      ],
      whyEyebrow: 'Почему мы',
      whyTitle: 'Партнёр, который\nзащищает ваши инвестиции',
      why: [
        { title: 'Единый контакт', body: 'Не координируете разных поставщиков. Мы берём всё на себя, у вас один контктный менеджер.' },
        { title: 'Гарантированные оптовые цены', body: 'Те же цены, что для институциональных клиентов, независимо от размера проекта.' },
        { title: 'Соблюдение сроков', body: 'Дата постаки зафисирована в договоре. Мы не работаем с расплывчатыми оценками.' },
        { title: 'Расширенная гарантия', body: 'Гарантия на оборудование и монтаж. Выезд в течение 48ч при неисправности.' },
        { title: 'Доказанный опыт', body: '50+ завершённых проектов: фитнес-залы, отели, школы, муниципальные объекты.' },
        { title: 'Поддержка после запуска', body: 'Остаёмся на связи. Бесплатная инспекция через 3 месяца после открытия.' },
      ],
      ctaTitle: 'Готовы начать?',
      ctaBody: 'Отправьте нам детали проекта. Первичная консультация и предложение — полностью бесплатно.',
      ctaBtn: 'Обсудить ваш проект',
      ctaLink: 'или посмотреть каталог ',
    },
  }[lang];

  // Override with admin localStorage data if available
  const heroTitle = (lang === 'ro' ? localOverride?.hero_title_ro : localOverride?.hero_title_ru) || C.heroTitle;
  const heroBody  = (lang === 'ro' ? localOverride?.hero_body_ro  : localOverride?.hero_body_ru)  || C.heroBody;
  const heroCta   = (lang === 'ro' ? localOverride?.cta_ro        : localOverride?.cta_ru)        || C.cta;
  const stats = (localOverride?.stats_json?.length > 0
    ? localOverride.stats_json.map((s: any) => ({ n: s[`n_${lang}`] || s.n_ro || '', label: s[`label_${lang}`] || s.label_ro || '' }))
    : null) || C.stats;

  return (
    <div className="min-h-screen bg-white text-black overflow-x-hidden">

      <ConsultationModal open={modalOpen} onClose={() => setModalOpen(false)} type="turnkey" />
      <SeoHead
        title={SEO_PAGES.turnkey[lang].title}
        description={SEO_PAGES.turnkey[lang].description}
        keywords={SEO_PAGES.turnkey[lang].keywords}
        canonical="/turnkey-solutions"
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
              {heroCta}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs text-gray-400">{C.ctaSub}</span>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          STATS
      ──────���────────────────────────────────────────────────────────── */}
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-16 py-10 sm:py-16 border-b border-gray-100">
        <div className="grid grid-cols-3 divide-x divide-gray-100">
          {stats.map((s: any, i: number) => (
            <div key={i} className="px-3 sm:px-8 first:pl-0 last:pr-0 py-4">
              <div className="text-[clamp(1.5rem,5vw,4rem)] tabular-nums tracking-tight text-black leading-none mb-2 sm:mb-3">
                {s.n}
              </div>
              <div className="text-[9px] sm:text-[11px] uppercase tracking-[0.08em] sm:tracking-[0.15em] text-gray-400 leading-snug">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────────
          SERVICES
      ───────────────────────────────────────────────────────────────── */}
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-16 py-16 sm:py-24 border-b border-gray-100">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-24">

          {/* Left: title */}
          <div className="lg:col-span-4">
            <h2 className="text-[clamp(1.6rem,3vw,2.8rem)] leading-[1.1] tracking-tight whitespace-pre-line mb-8">
              {C.servicesTitle}
            </h2>
            <div className="w-8 h-px bg-black" />
          </div>

          {/* Right: services list */}
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
          PROCESS
      ──────────────────────────────────────────────────────────────── */}
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
                  style={{ width: 100 }}
                >
                  {/* Indicator */}
                  <div className="relative flex items-center justify-center">
                    {/* Active ring */}
                    {i === activeStep && (
                      <motion.div
                        layoutId="step-ring"
                        className="absolute w-14 h-14 border border-black/20"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                    <div
                      className={`w-10 h-10 flex items-center justify-center transition-all duration-300 ${
                        i < activeStep
                          ? 'bg-black text-white'
                          : i === activeStep
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
                    style={{ maxWidth: 90 }}
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
          <div className="mt-10 relative overflow-hidden">
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
                    className="w-full flex items-center gap-4 py-5 text-left group"
                  >
                    {/* Circle indicator */}
                    <div className={`relative z-10 w-10 h-10 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                      isOpen ? 'bg-black text-white' : i < (mobileStep ?? -1) ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-400'
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

      {/* ───────────────────────────────────────────────────────────────
          WHY US
      ──────────────────────────────────────────────────────────────── */}
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-16 py-16 sm:py-24 border-b border-gray-100">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-24">

          {/* Left */}
          <div className="lg:col-span-4">
            <h2 className="text-[clamp(1.6rem,3vw,2.8rem)] leading-[1.1] tracking-tight whitespace-pre-line">
              {C.whyTitle}
            </h2>
          </div>

          {/* Right: grid of reasons */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6 sm:gap-y-8">
            {C.why.map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <Check className="w-3.5 h-3.5 text-black mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm text-black mb-1.5">{item.title}</h4>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────
          CTA
      ───────────────────────────────────────────────────────────────── */}
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-16 py-16 sm:py-24">
        <div className="bg-black text-white px-6 sm:px-12 md:px-20 py-14 sm:py-20">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-[clamp(1.8rem,4vw,3.5rem)] leading-[1.05] tracking-tight text-white mb-6">
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