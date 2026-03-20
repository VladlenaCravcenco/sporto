import { Link } from 'react-router';
import { useLanguage } from '../contexts/LanguageContext';
import { Logo } from './Logo';
import { Mail, Phone, MapPin, ArrowUpRight, ExternalLink } from 'lucide-react';
import { useContacts } from '../hooks/useContacts';
export function Footer() {
  const { t } = useLanguage();
  const CONTACTS = useContacts(); 

  return (
    <footer className="bg-black text-gray-500">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0 border-b border-gray-900">

          {/* Brand */}
          <div className="md:col-span-3 py-10 md:border-r border-gray-900 md:pr-8">
            <div className="flex items-center gap-3 mb-4">
              <Logo className="h-8 w-auto" color="#ffffff" />
            </div>
            <p className="text-xs text-gray-600 leading-relaxed max-w-xs">{t('footer.about.text')}</p>
          </div>

          {/* Links */}
          <div className="md:col-span-3 py-10 md:border-r border-gray-900 md:px-8">
            <h3 className="text-xs text-gray-700 uppercase tracking-[0.15em] mb-4">{t('footer.links')}</h3>
            <ul className="space-y-2">
              {[
                { to: '/', label: t('nav.home') },
                { to: '/about', label: t('footer.about') },
                { to: '/catalog', label: t('nav.catalog') },
                { to: '/turnkey-solutions', label: t('nav.turnkey') },
                { to: '/maintenance-service', label: t('nav.maintenance') },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1 group"
                  >
                    {label}
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="md:col-span-2 py-10 md:border-r border-gray-900 md:px-8">
            <h3 className="text-xs text-gray-700 uppercase tracking-[0.15em] mb-4">{t('footer.legal')}</h3>
            <ul className="space-y-2">
              {[
                { to: '/terms-of-cooperation', label: t('footer.terms') },
                { to: '/delivery-terms', label: t('footer.delivery') },
                { to: '/privacy-policy', label: t('footer.privacy') },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1 group"
                  >
                    {label}
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-2 py-10 md:border-r border-gray-900 md:px-8">
            <h3 className="text-xs text-gray-700 uppercase tracking-[0.15em] mb-4">{t('footer.contact')}</h3>
            <ul className="space-y-3">
              <li>
                <a href={`mailto:${CONTACTS.email}`} className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors">
                  <Mail className="w-3.5 h-3.5 text-gray-700 flex-shrink-0" />
                  {CONTACTS.email}
                </a>
              </li>
              <li>
                <a href={`tel:${CONTACTS.phone}`} className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors">
                  <Phone className="w-3.5 h-3.5 text-gray-700 flex-shrink-0" />
                  {CONTACTS.phoneDisplay}
                </a>
              </li>
              <li>
                <a
                  href={CONTACTS.mapsDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 text-xs text-gray-500 hover:text-white transition-colors group"
                >
                  <MapPin className="w-3.5 h-3.5 text-gray-700 flex-shrink-0 mt-0.5" />
                  <span>
                    str. Uzinelor 104, Chișinău
                    <ExternalLink className="inline w-2.5 h-2.5 ml-1 opacity-0 group-hover:opacity-60 transition-opacity" />
                  </span>
                </a>
              </li>
              {/* Messengers */}
              <li className="flex items-center gap-3 pt-1">
                <a href={CONTACTS.whatsapp} target="_blank" rel="noopener noreferrer"
                   className="text-gray-700 hover:text-green-400 transition-colors" title="WhatsApp">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.116.555 4.104 1.523 5.826L.044 23.428a.5.5 0 0 0 .612.612l5.602-1.479A11.946 11.946 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.882a9.868 9.868 0 0 1-5.034-1.376l-.36-.214-3.733.985.999-3.642-.235-.374A9.869 9.869 0 0 1 2.118 12C2.118 6.533 6.533 2.118 12 2.118c5.467 0 9.882 4.415 9.882 9.882 0 5.467-4.415 9.882-9.882 9.882z"/></svg>
                </a>
                <a href={CONTACTS.telegram} target="_blank" rel="noopener noreferrer"
                   className="text-gray-700 hover:text-sky-400 transition-colors" title="Telegram">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 13.5l-2.95-.924c-.64-.203-.654-.64.135-.954l11.566-4.458c.537-.194 1.006.131.973.057z"/></svg>
                </a>
                <a href={CONTACTS.viber} className="text-gray-700 hover:text-purple-400 transition-colors" title="Viber">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M11.4 0C6.143.04 2.76 2.018 2.76 2.018 0 4.246 0 8.553 0 8.553l-.001.614c-.018 3.45.172 6.753 2.467 8.868 0 0 .265.24.533.416v2.75c0 .025-.003.05-.003.075 0 .424.348.768.776.768.213 0 .404-.083.548-.218l2.31-2.145c.52.07 1.055.11 1.612.122l.155.003c.172 0 .343-.004.514-.01l-.033.002c5.174-.195 10.013-2.888 10.013-2.888C21.168 16.77 24 11.643 24 7.163v-.11C24 1.753 19.188.175 15.3.05A21.01 21.01 0 0 0 11.4 0zm.09 2.32c.947-.006 1.985.085 3.06.32 0 0 4.762 1.094 4.762 4.532 0 3.44-2.14 8.15-6.378 9.942 0 0-4.158 2.2-8.12 2.384l-2.56 2.383V18.89c-.226-.14-.422-.302-.422-.302-1.753-1.623-1.82-4.485-1.804-7.572l.001-.567c0-3.439 2.263-5.222 4.03-5.915C5.76 4.034 8.25 2.35 11.49 2.32zm-.032 2.34c-2.354.018-4.276.87-4.276.87-1.478.605-3.222 1.944-3.222 4.635l.001.512c-.016 2.783.064 5.222 1.31 6.41v2.128l1.866-1.733c3.35-.13 6.904-2.137 6.904-2.137 3.52-1.508 5.302-5.604 5.302-8.52 0-2.756-3.763-3.62-3.763-3.62a15.24 15.24 0 0 0-4.122-.545zM9.9 6.86c.25.002.502.086.702.257l.005.004c.558.476.845 1.048 1.012 1.616.113.384.065.8-.142 1.133-.11.177-.258.32-.432.43l-.005.003a.56.56 0 0 0-.152.151c-.16.228-.08.548.08.74.72.848 1.568 1.388 2.52 1.72.33.116.73.014.944-.279.11-.152.19-.337.238-.54a.97.97 0 0 1 .1-.256c.16-.268.48-.38.776-.274.766.28 1.44.803 1.44.803.31.24.364.697.1 1.007-.696.814-1.636 1.266-2.724 1.007-2.174-.586-4.087-2.476-4.703-3.61C8.774 9.19 8.6 8.02 9.035 7.217c.152-.285.42-.468.73-.484L9.9 6.86z"/></svg>
                </a>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div className="md:col-span-2 py-10 md:pl-8">
            <h3 className="text-xs text-gray-700 uppercase tracking-[0.15em] mb-4">
              Program
            </h3>
            <ul className="space-y-2 text-xs">
              <li className="flex justify-between gap-4">
                <span className="text-gray-600">Lun–Vin</span>
                <span>9:00–18:00</span>
              </li>
              <li className="flex justify-between gap-4">
                <span className="text-gray-600">Sâm</span>
                <span>10:00–15:00</span>
              </li>
              <li className="flex justify-between gap-4">
                <span className="text-gray-600">Dum</span>
                <span className="text-gray-700">Închis</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="py-5 border-t border-gray-900 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-700">© 2026 SPORTOSFERA S.R.L. {t('footer.rights')}.</p>
          <p className="text-xs text-gray-800 uppercase tracking-widest">Moldova · B2B Wholesale</p>
        </div>

        {/* Dev credit */}
        <div className="py-3 border-t border-gray-900 flex items-center justify-center">
          <a
            href="https://godevca.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-1.5 text-[11px] text-gray-800 hover:text-gray-500 transition-colors duration-200"
          >
            <span className="w-1 h-1 rounded-full bg-gray-700 group-hover:bg-gray-500 transition-colors duration-200" />
            Разработано &amp; создано
            <span className="text-gray-600 group-hover:text-gray-400 font-medium tracking-wide transition-colors duration-200">
              GODEVCA
            </span>
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              className="opacity-40 group-hover:opacity-70 transition-opacity duration-200"
            >
              <path d="M2 8L8 2M8 2H3M8 2V7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}