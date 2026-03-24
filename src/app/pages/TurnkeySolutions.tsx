import { Link } from 'react-router';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowRight, Check, ChevronLeft, ChevronRight, ChevronDown, Expand } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ConsultationModal } from '../components/ConsultationModal';
import { SeoHead, SEO_PAGES } from '../components/SeoHead';
import { useTurnkeyContent } from './turnkeyContent';
import type { Case, Stat, Service, Step, Why } from './turnkeyContent';

type Lang = 'ro' | 'ru';

export function TurnkeySolutions() {
  const { language } = useLanguage();
  const lang = language as Lang;
  const content = useTurnkeyContent();

  const [modalOpen,  setModalOpen]  = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [mobileStep, setMobileStep] = useState<number | null>(0);

  const t = (bi: { ro: string; ru: string } | undefined) => bi?.[lang] || bi?.ro || '';
  const ctaLink = lang === 'ro' ? 'sau explorează catalogul →' : 'или посмотреть каталог →';

  // ── Слайдер проектов ──────────────────────────────────────────────────────
  const cases       = content.cases.filter((c: Case) => c.image);
  const totalSlides = cases.length;
  const [caseSlide, setCaseSlide] = useState(0);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const caseTimerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX   = useRef(0);
  const touchEndX     = useRef(0);

  const stopTimer = () => {
    if (caseTimerRef.current) clearInterval(caseTimerRef.current);
  };

  const goTo = (idx: number) => setCaseSlide((idx + totalSlides) % totalSlides);

  useEffect(() => {
    if (totalSlides < 2) return;
    caseTimerRef.current = setInterval(() => {
      setCaseSlide(s => (s + 1) % totalSlides);
    }, 4500);
    return stopTimer;
  }, [totalSlides]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) {
      stopTimer();
      goTo(caseSlide + (diff > 0 ? 1 : -1));
    }
  };

  return (
    <div className="min-h-screen bg-white text-black overflow-x-hidden">

      <ConsultationModal open={modalOpen} onClose={() => setModalOpen(false)} type="turnkey" />
      <AnimatePresence>
        {selectedCase && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/92 p-4 sm:p-8"
            onClick={() => setSelectedCase(null)}
          >
            <div className="w-full h-full flex items-center justify-center">
              <motion.img
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.96, opacity: 0 }}
                transition={{ duration: 0.2 }}
                src={selectedCase.image}
                alt={lang === 'ro' ? selectedCase.label_ro : selectedCase.label_ru}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <SeoHead
        title={SEO_PAGES.turnkey[lang].title}
        description={SEO_PAGES.turnkey[lang].description}
        keywords={SEO_PAGES.turnkey[lang].keywords}
        canonical="/turnkey-solutions"
        lang={lang}
      />

      {/* ─── HERO ─── */}
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-16 pt-16 sm:pt-20 pb-16 sm:pb-24 border-b border-gray-100">
        <div className="max-w-4xl">
          <h1 className="text-[clamp(2rem,5.5vw,5rem)] leading-[1.05] tracking-tight text-black whitespace-pre-line mb-6 sm:mb-8">
            {t(content.hero_title)}
          </h1>
          <p className="text-base text-gray-500 leading-relaxed max-w-xl mb-8 sm:mb-12">
            {t(content.hero_body)}
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 bg-black text-white px-6 sm:px-8 py-4 text-xs uppercase tracking-widest hover:bg-gray-900 transition-colors"
            >
              {t(content.hero_cta)}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs text-gray-400">{t(content.hero_sub)}</span>
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      {content.show_stats && (
        <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-16 py-10 sm:py-16 border-b border-gray-100">
          <div className="grid grid-cols-3 divide-x divide-gray-100">
            {content.stats.map((s: Stat, i: number) => (
              <div key={i} className="px-3 sm:px-8 first:pl-0 last:pr-0 py-4">
                <div className="text-[clamp(1.5rem,5vw,4rem)] tabular-nums tracking-tight text-black leading-none mb-2 sm:mb-3">
                  {t(s.n)}
                </div>
                <div className="text-[9px] sm:text-[11px] uppercase tracking-[0.08em] sm:tracking-[0.15em] text-gray-400 leading-snug">
                  {t(s.label)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── SERVICES ─── */}
      {content.show_services && (
        <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-16 py-16 sm:py-24 border-b border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-24">
            <div className="lg:col-span-4">
              <h2 className="text-[clamp(1.6rem,3vw,2.8rem)] leading-[1.1] tracking-tight whitespace-pre-line mb-8">
                {t(content.services_title)}
              </h2>
              <div className="w-8 h-px bg-black" />
            </div>
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-8 sm:gap-y-10">
              {content.services.map((s: Service) => (
                <div key={s.num}>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-gray-300 mb-4">{s.num}</div>
                  <h3 className="text-sm text-black mb-3">{t(s.title)}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{t(s.body)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── PROCESS ─── */}
      {content.show_process && (
        <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-16 py-16 sm:py-24 border-b border-gray-100">
          <div className="mb-10 sm:mb-16">
            <h2 className="text-[clamp(1.6rem,3vw,2.8rem)] leading-[1.1] tracking-tight whitespace-pre-line">
              {t(content.process_title)}
            </h2>
          </div>

          {/* DESKTOP */}
          <div className="hidden lg:block">
            <div className="flex items-start mb-0">
              {content.steps.map((step: Step, i: number) => (
                <div key={step.n} className="flex items-start flex-1 last:flex-none">
                  <button
                    onClick={() => setActiveStep(i)}
                    className="flex flex-col items-center gap-4 group flex-shrink-0 focus:outline-none"
                    style={{ width: 100 }}
                  >
                    <div className="relative flex items-center justify-center">
                      {i === activeStep && (
                        <motion.div
                          layoutId="step-ring"
                          className="absolute w-14 h-14 border border-black/20"
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                      )}
                      <div className={`w-10 h-10 flex items-center justify-center transition-all duration-300 ${
                        i <= activeStep ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-300'
                      }`}>
                        {i < activeStep
                          ? <Check className="w-3.5 h-3.5" />
                          : <span className="text-[10px] tracking-widest">{step.n}</span>
                        }
                      </div>
                    </div>
                    <span
                      className={`text-[11px] text-center leading-snug transition-colors duration-300 ${
                        i === activeStep ? 'text-black' : i < activeStep ? 'text-gray-500' : 'text-gray-300'
                      }`}
                      style={{ maxWidth: 90 }}
                    >
                      {t(step.title)}
                    </span>
                  </button>

                  {i < content.steps.length - 1 && (
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
                    <div className="col-span-2 border-r border-gray-100 p-10 flex flex-col justify-between">
                      <span className="text-[5rem] leading-none tabular-nums text-gray-100 select-none">
                        {content.steps[activeStep].n}
                      </span>
                      <div className="flex gap-2 mt-6">
                        <button
                          onClick={() => setActiveStep(s => Math.max(0, s - 1))}
                          disabled={activeStep === 0}
                          className="w-9 h-9 flex items-center justify-center border border-gray-200 text-gray-400 hover:border-black hover:text-black disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setActiveStep(s => Math.min(content.steps.length - 1, s + 1))}
                          disabled={activeStep === content.steps.length - 1}
                          className="w-9 h-9 flex items-center justify-center border border-gray-200 text-gray-400 hover:border-black hover:text-black disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="col-span-7 p-10 flex flex-col justify-center">
                      <h3 className="text-2xl tracking-tight text-black mb-5">
                        {t(content.steps[activeStep].title)}
                      </h3>
                      <p className="text-sm text-gray-500 leading-relaxed max-w-lg">
                        {t(content.steps[activeStep].body)}
                      </p>
                    </div>
                    <div className="col-span-3 border-l border-gray-100 p-10 flex flex-col justify-center gap-3">
                      {content.steps.map((s: Step, i: number) => (
                        <button key={s.n} onClick={() => setActiveStep(i)} className="flex items-center gap-3 text-left group/dot">
                          <div className={`w-1.5 h-1.5 flex-shrink-0 transition-all duration-200 ${
                            i === activeStep ? 'bg-black scale-150' : i < activeStep ? 'bg-gray-400' : 'bg-gray-200'
                          }`} />
                          <span className={`text-[11px] transition-colors duration-200 ${
                            i === activeStep ? 'text-black' : 'text-gray-400 group-hover/dot:text-gray-600'
                          }`}>
                            {t(s.title)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* MOBILE */}
          <div className="lg:hidden relative">
            <div className="absolute left-[19px] top-0 bottom-0 w-px bg-gray-100" />
            <div className="space-y-0">
              {content.steps.map((step: Step, i: number) => {
                const isOpen = mobileStep === i;
                return (
                  <div key={step.n} className="relative">
                    <button
                      onClick={() => setMobileStep(isOpen ? null : i)}
                      className="w-full flex items-center gap-4 py-5 text-left group"
                    >
                      <div className={`relative z-10 w-10 h-10 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                        isOpen
                          ? 'bg-black text-white'
                          : i < (mobileStep ?? -1)
                          ? 'bg-black text-white'
                          : 'bg-white border border-gray-200 text-gray-400'
                      }`}>
                        <span className="text-[10px] tracking-widest">{step.n}</span>
                      </div>
                      <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                        <h3 className={`text-sm transition-colors ${isOpen ? 'text-black' : 'text-gray-600'}`}>
                          {t(step.title)}
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
                            <p className="text-sm text-gray-500 leading-relaxed">{t(step.body)}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {i < content.steps.length - 1 && <div className="h-px bg-gray-50 ml-14" />}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─── WHY US ─── */}
      {content.show_why && (
        <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-16 py-16 sm:py-24 border-b border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-24">
            <div className="lg:col-span-4">
              <h2 className="text-[clamp(1.6rem,3vw,2.8rem)] leading-[1.1] tracking-tight whitespace-pre-line">
                {t(content.why_title)}
              </h2>
            </div>
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6 sm:gap-y-8">
              {content.why.map((item: Why, i: number) => (
                <div key={i} className="flex items-start gap-4">
                  <Check className="w-3.5 h-3.5 text-black mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm text-black mb-1.5">{t(item.title)}</h4>
                    <p className="text-sm text-gray-500 leading-relaxed">{t(item.body)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── CASES SLIDER ─── */}
      {content.show_cases && cases.length > 0 && (
        <section className="border-b border-gray-100 py-16 sm:py-24">

          {/* Заголовок + стрелки */}
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-16 flex items-end justify-between mb-8 sm:mb-12">
            <h2 className="text-[clamp(1.6rem,3vw,2.8rem)] leading-[1.1] tracking-tight">
              {t(content.cases_title)}
            </h2>
            {totalSlides > 1 && (
              <div className="hidden sm:flex items-center gap-2 ml-6 flex-shrink-0">
                <button
                  onClick={() => { stopTimer(); goTo(caseSlide - 1); }}
                  className="w-10 h-10 flex items-center justify-center border border-gray-200 text-gray-400 hover:border-black hover:text-black transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { stopTimer(); goTo(caseSlide + 1); }}
                  className="w-10 h-10 flex items-center justify-center border border-gray-200 text-gray-400 hover:border-black hover:text-black transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Слайдер */}
          <div
            className="overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <motion.div
              className="flex"
              animate={{ x: `-${caseSlide * 100}%` }}
              transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
            >
              {cases.map((c: Case, i: number) => (
                <div
                  key={i}
                  style={{ width: '100%', flexShrink: 0 }}
                  className="px-4 sm:px-6 lg:px-16"
                >
                  <div className="group">
                    <div className="relative overflow-hidden bg-gray-50 aspect-[16/8] sm:aspect-[16/7] lg:aspect-[16/6]">
                      <img
                        src={c.image}
                        alt={lang === 'ro' ? c.label_ro : c.label_ru}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      {(c.label_ro || c.label_ru || c.year) && (
                        <div className="absolute left-4 right-4 bottom-4 sm:left-6 sm:right-6 sm:bottom-6 flex items-end justify-between gap-4">
                          <div className="bg-black/80 text-white px-4 py-3 max-w-[80%]">
                            <div className="text-xs sm:text-sm">{lang === 'ro' ? c.label_ro : c.label_ru}</div>
                          </div>
                          {c.year && (
                            <div className="bg-white text-black px-3 py-2 text-[10px] sm:text-xs uppercase tracking-[0.2em] flex-shrink-0">
                              {c.year}
                            </div>
                          )}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedCase(c)}
                        className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 bg-black/70 text-white flex items-center justify-center hover:bg-black transition-colors"
                      >
                        <Expand className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Точки */}
          {totalSlides > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              {cases.map((_: Case, i: number) => (
                <button
                  key={i}
                  onClick={() => { stopTimer(); goTo(i); }}
                  className={`transition-all duration-300 ${
                    i === caseSlide
                      ? 'w-6 h-1.5 bg-black'
                      : 'w-1.5 h-1.5 bg-gray-200 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          )}

        </section>
      )}

      {/* ─── CTA ─── */}
      {content.show_cta && (
        <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-16 py-16 sm:py-24">
          <div className="bg-black text-white px-6 sm:px-12 md:px-20 py-14 sm:py-20">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-[clamp(1.8rem,4vw,3.5rem)] leading-[1.05] tracking-tight text-white mb-6">
                {t(content.cta_title)}
              </h2>
              <p className="text-base text-gray-400 leading-relaxed mb-8 sm:mb-10">
                {t(content.cta_body)}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => setModalOpen(true)}
                  className="inline-flex items-center gap-2 bg-white text-black px-8 sm:px-10 py-4 text-xs uppercase tracking-widest hover:bg-gray-100 transition-colors"
                >
                  {t(content.cta_btn)}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <Link to="/catalog" className="text-xs text-gray-500 hover:text-white transition-colors">
                  {ctaLink}
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
