import { Link } from 'react-router';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowRight, Check, ChevronLeft, ChevronRight, ChevronDown, MapPin, Truck } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ConsultationModal } from '../components/ConsultationModal';
import { SeoHead, SEO_PAGES } from '../components/SeoHead';
import { useMaintenanceContent, type BiText, type PackagePlan, type SectionKey } from './maintenanceContent';

type Lang = 'ro' | 'ru';

export function MaintenanceService() {
  const { language } = useLanguage();
  const lang = language as Lang;
  const content = useMaintenanceContent();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [mobileStep, setMobileStep] = useState<number | null>(0);

  const t = (value: BiText) => value[lang] || value.ro;
  const packageFeatures = (pkg: PackagePlan) => (lang === 'ro' ? pkg.features_ro : pkg.features_ru).split('\n').filter(Boolean);

  const sections: Record<SectionKey, React.ReactNode> = {
    stats: content.show_stats ? (
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-16 py-10 sm:py-16 border-b border-gray-100">
        <div className="grid grid-cols-3 divide-x divide-gray-100">
          {content.stats.map((s, i) => (
            <div key={i} className="px-3 sm:px-8 first:pl-0 last:pr-0 py-4">
              <div className="text-[clamp(1.5rem,5vw,3.5rem)] tabular-nums tracking-tight text-black leading-none mb-2 sm:mb-3">
                {t(s.n)}
              </div>
              <div className="text-[9px] sm:text-[11px] uppercase tracking-[0.08em] sm:tracking-[0.15em] text-gray-400 leading-snug">{t(s.label)}</div>
            </div>
          ))}
        </div>
      </section>
    ) : null,
    services: content.show_services ? (
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-16 py-16 sm:py-24 border-b border-gray-100">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-24">
          <div className="lg:col-span-4">
            <div className="text-[11px] uppercase tracking-[0.2em] text-gray-300 mb-4">{t(content.services_eyebrow)}</div>
            <h2 className="text-[clamp(1.6rem,3vw,2.8rem)] leading-[1.1] tracking-tight whitespace-pre-line mb-8">{t(content.services_title)}</h2>
            <div className="w-8 h-px bg-black" />
          </div>
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-8 sm:gap-y-10">
            {content.services.map((s) => (
              <div key={s.num}>
                <div className="text-[11px] uppercase tracking-[0.2em] text-gray-300 mb-4">{s.num}</div>
                <h3 className="text-sm text-black mb-3">{t(s.title)}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{t(s.body)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    ) : null,
    packages: content.show_packages ? (
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-16 py-16 sm:py-24 border-b border-gray-100">
        <div className="mb-10 sm:mb-16">
          <div className="text-[11px] uppercase tracking-[0.2em] text-gray-300 mb-4">{t(content.packages_eyebrow)}</div>
          <h2 className="text-[clamp(1.6rem,3vw,2.8rem)] leading-[1.1] tracking-tight whitespace-pre-line">{t(content.packages_title)}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {content.packages.map((pkg, i) => (
            <div key={`${pkg.name}-${i}`} className={`flex flex-col p-6 sm:p-10 border transition-colors ${pkg.featured ? 'bg-black text-white border-black' : 'bg-white border-gray-200 hover:border-gray-400'}`}>
              <div className="mb-6 sm:mb-8">
                <div className={`text-[11px] uppercase tracking-[0.2em] mb-1 ${pkg.featured ? 'text-gray-500' : 'text-gray-400'}`}>{pkg.name}</div>
                <div className={`text-xs ${pkg.featured ? 'text-gray-600' : 'text-gray-400'}`}>{t(pkg.note)}</div>
              </div>

              <div className="mb-8 sm:mb-10 pb-8 sm:pb-10 border-b border-current" style={{ borderColor: pkg.featured ? '#333' : '#e5e7eb' }}>
                <div className="flex items-end gap-1.5 leading-none">
                  <span className={`text-[3rem] tabular-nums tracking-tight ${pkg.featured ? 'text-white' : 'text-black'}`}>{pkg.price}</span>
                  {pkg.currency && <span className={`text-base mb-1.5 ${pkg.featured ? 'text-gray-500' : 'text-gray-400'}`}>{pkg.currency}{t(pkg.period)}</span>}
                </div>
              </div>

              <ul className="space-y-4 flex-1 mb-8 sm:mb-10">
                {packageFeatures(pkg).map((feature, j) => (
                  <li key={j} className="flex items-start gap-3">
                    <Check className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${pkg.featured ? 'text-gray-500' : 'text-gray-400'}`} />
                    <span className={`text-sm leading-relaxed ${pkg.featured ? 'text-gray-300' : 'text-gray-600'}`}>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/order-request"
                className={`flex items-center justify-center gap-2 py-3.5 text-[10px] uppercase tracking-widest transition-colors border ${pkg.featured ? 'bg-white text-black border-white hover:bg-gray-100' : 'border-gray-200 text-gray-600 hover:border-black hover:text-black'}`}
                onClick={(e) => { e.preventDefault(); setModalOpen(true); }}
              >
                {t(pkg.cta)}
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ))}
        </div>
      </section>
    ) : null,
    process: content.show_process ? (
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-16 py-16 sm:py-24 border-b border-gray-100">
        <div className="mb-10 sm:mb-16">
          <div className="text-[11px] uppercase tracking-[0.2em] text-gray-300 mb-4">{t(content.process_eyebrow)}</div>
          <h2 className="text-[clamp(1.6rem,3vw,2.8rem)] leading-[1.1] tracking-tight whitespace-pre-line">{t(content.process_title)}</h2>
        </div>

        <div className="hidden lg:block">
          <div className="flex items-start mb-0">
            {content.steps.map((step, i) => (
              <div key={step.n} className="flex items-start flex-1 last:flex-none">
                <button onClick={() => setActiveStep(i)} className="flex flex-col items-center gap-4 group flex-shrink-0 focus:outline-none" style={{ width: 120 }}>
                  <div className="relative flex items-center justify-center">
                    {i === activeStep && (
                      <motion.div layoutId="maint-step-ring" className="absolute w-14 h-14 border border-black/20" transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
                    )}
                    <div className={`w-10 h-10 flex items-center justify-center transition-all duration-300 ${i <= activeStep ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-300'}`}>
                      {i < activeStep ? <Check className="w-3.5 h-3.5" /> : <span className="text-[10px] tracking-widest">{step.n}</span>}
                    </div>
                  </div>
                  <span className={`text-[11px] text-center leading-snug transition-colors duration-300 ${i === activeStep ? 'text-black' : i < activeStep ? 'text-gray-500' : 'text-gray-300'}`} style={{ maxWidth: 100 }}>
                    {t(step.title)}
                  </span>
                </button>

                {i < content.steps.length - 1 && (
                  <div className="flex-1 relative mt-5 mx-1" style={{ height: 1 }}>
                    <div className="absolute inset-0 bg-gray-100" />
                    <motion.div className="absolute inset-0 bg-black origin-left" initial={false} animate={{ scaleX: i < activeStep ? 1 : 0 }} transition={{ duration: 0.4, ease: 'easeInOut' }} />
                  </div>
                )}
              </div>
            ))}
          </div>

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
                  <div className="col-span-2 border-r border-gray-100 p-10 flex flex-col justify-between">
                    <span className="text-[5rem] leading-none tabular-nums text-gray-100 select-none">{content.steps[activeStep].n}</span>
                    <div className="flex gap-2 mt-6">
                      <button onClick={() => setActiveStep((s) => Math.max(0, s - 1))} disabled={activeStep === 0} className="w-9 h-9 flex items-center justify-center border border-gray-200 text-gray-400 hover:border-black hover:text-black disabled:opacity-20 disabled:cursor-not-allowed">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button onClick={() => setActiveStep((s) => Math.min(content.steps.length - 1, s + 1))} disabled={activeStep === content.steps.length - 1} className="w-9 h-9 flex items-center justify-center border border-gray-200 text-gray-400 hover:border-black hover:text-black disabled:opacity-20 disabled:cursor-not-allowed">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="col-span-7 p-10 flex flex-col justify-center">
                    <h3 className="text-2xl tracking-tight text-black mb-5">{t(content.steps[activeStep].title)}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed max-w-lg">{t(content.steps[activeStep].body)}</p>
                  </div>

                  <div className="col-span-3 border-l border-gray-100 p-10 flex flex-col justify-center gap-3">
                    {content.steps.map((step, i) => (
                      <button key={step.n} onClick={() => setActiveStep(i)} className="flex items-center gap-3 text-left group/dot">
                        <div className={`w-1.5 h-1.5 flex-shrink-0 transition-all duration-200 ${i === activeStep ? 'bg-black scale-150' : i < activeStep ? 'bg-gray-400' : 'bg-gray-200'}`} />
                        <span className={`text-[11px] transition-colors duration-200 ${i === activeStep ? 'text-black' : 'text-gray-400 group-hover/dot:text-gray-600'}`}>{t(step.title)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="lg:hidden relative">
          <div className="absolute left-[19px] top-0 bottom-0 w-px bg-gray-100" />
          <div className="space-y-0">
            {content.steps.map((step, i) => {
              const isOpen = mobileStep === i;
              return (
                <div key={step.n} className="relative">
                  <button onClick={() => setMobileStep(isOpen ? null : i)} className="w-full flex items-center gap-4 py-5 text-left">
                    <div className={`relative z-10 w-10 h-10 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isOpen ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-400'}`}>
                      <span className="text-[10px] tracking-widest">{step.n}</span>
                    </div>
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
                      <h3 className={`text-sm transition-colors ${isOpen ? 'text-black' : 'text-gray-600'}`}>{t(step.title)}</h3>
                      <ChevronDown className={`w-4 h-4 flex-shrink-0 text-gray-300 transition-transform duration-300 ${isOpen ? 'rotate-180 text-black' : ''}`} />
                    </div>
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: 'easeOut' }} className="overflow-hidden">
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
    ) : null,
    delivery: content.show_delivery ? (
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-16 py-16 sm:py-24 border-b border-gray-100 bg-gray-50">
        <div className="mb-10 sm:mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Truck className="w-5 h-5 text-gray-400" />
            <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400">{t(content.delivery_eyebrow)}</p>
          </div>
          <h2 className="text-[clamp(1.6rem,3vw,2.8rem)] leading-[1.1] tracking-tight whitespace-pre-line mb-4">{t(content.delivery_title)}</h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-xl">{t(content.delivery_desc)}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {content.delivery_zones.map((zone, i) => (
            <div key={i} className="bg-white border border-gray-200 p-6 sm:p-8 hover:border-gray-300 transition-colors">
              <div className="flex items-start gap-3 mb-4">
                <MapPin className="w-4 h-4 text-black mt-0.5 flex-shrink-0" />
                <h3 className="text-base text-black">{t(zone.city)}</h3>
              </div>
              <div className="ml-7 space-y-2">
                <div className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-gray-300" /><span className="text-sm text-gray-600">{t(zone.time)}</span></div>
                <div className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-gray-300" /><span className="text-sm text-gray-600">{t(zone.price)}</span></div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <Link to="/delivery-terms" className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-black transition-colors group">
            <span>{t(content.delivery_link)}</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>
    ) : null,
    cta: content.show_cta ? (
      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-16 py-16 sm:py-24">
        <div className="bg-black text-white px-6 sm:px-12 md:px-20 py-14 sm:py-20">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-[clamp(1.8rem,4vw,3.5rem)] leading-[1.05] tracking-tight text-white whitespace-pre-line mb-6">{t(content.cta_title)}</h2>
            <p className="text-base text-gray-400 leading-relaxed mb-8 sm:mb-10">{t(content.cta_body)}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onClick={() => setModalOpen(true)} className="inline-flex items-center gap-2 bg-white text-black px-8 sm:px-10 py-4 text-xs uppercase tracking-widest hover:bg-gray-100 transition-colors">
                {t(content.cta_btn)}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <Link to="/catalog" className="text-xs text-gray-500 hover:text-white transition-colors">{t(content.cta_link)}</Link>
            </div>
          </div>
        </div>
      </section>
    ) : null,
  };

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

      <section className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-16 pt-16 sm:pt-20 pb-16 sm:pb-24 border-b border-gray-100">
        <div className="max-w-4xl">
          <div className="text-[11px] uppercase tracking-[0.2em] text-gray-300 mb-4">{t(content.hero_eyebrow)}</div>
          <h1 className="text-[clamp(2rem,5.5vw,5rem)] leading-[1.05] tracking-tight text-black whitespace-pre-line mb-6 sm:mb-8">{t(content.hero_title)}</h1>
          <p className="text-base text-gray-500 leading-relaxed max-w-xl mb-8 sm:mb-12">{t(content.hero_body)}</p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <button onClick={() => setModalOpen(true)} className="inline-flex items-center gap-2 bg-black text-white px-6 sm:px-8 py-4 text-xs uppercase tracking-widest hover:bg-gray-900 transition-colors">
              {t(content.hero_cta)}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs text-gray-400">{t(content.hero_sub)}</span>
          </div>
        </div>
      </section>

      {content.section_order.map((section) => <div key={section}>{sections[section]}</div>)}
    </div>
  );
}
