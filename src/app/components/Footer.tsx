import { Link } from 'react-router';
import { useLanguage } from '../contexts/LanguageContext';
import { Logo } from './Logo';
import { Mail, Phone, MapPin, ArrowUpRight, ExternalLink } from 'lucide-react';
import { useContacts, SOCIAL_CONFIG, SOCIAL_ICON_IMAGE_SRC, SOCIAL_SVG_PATHS } from '../hooks/useContacts';
export function Footer() {
  const { t, language } = useLanguage();
  const CONTACTS = useContacts(); 
  const address = language === 'ro' ? CONTACTS.address_ro : CONTACTS.address_ru;
  const hours = language === 'ro' ? CONTACTS.hours_ro : CONTACTS.hours_ru;
  const socials = CONTACTS.socials.filter(s => s.url);

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
                    {address}
                    <ExternalLink className="inline w-2.5 h-2.5 ml-1 opacity-0 group-hover:opacity-60 transition-opacity" />
                  </span>
                </a>
              </li>
              {/* Messengers */}
              <li className="flex items-center gap-3 pt-1">
                {socials.map((social) => {
                  const cfg = SOCIAL_CONFIG[social.type];
                  const imageSrc = SOCIAL_ICON_IMAGE_SRC[social.type];
                  const pathData = SOCIAL_SVG_PATHS[social.type];
                  const viberImageSrc = social.type === 'viber'
                    ? 'https://cdn.simpleicons.org/viber/7360F2'
                    : imageSrc;
                  return (
                    <a
                      key={social.id}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`group text-gray-700 ${cfg.hoverClass} transition-colors`}
                      title={cfg.label}
                    >
                      {viberImageSrc ? (
                        <img
                          src={viberImageSrc}
                          className={`w-4 h-4 transition-all ${social.type === 'viber' ? 'grayscale opacity-45 group-hover:grayscale-0 group-hover:opacity-100' : ''}`}
                          alt={cfg.label}
                        />
                      ) : (
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                          <path d={pathData} />
                        </svg>
                      )}
                    </a>
                  );
                })}
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div className="md:col-span-2 py-10 md:pl-8">
            <h3 className="text-xs text-gray-700 uppercase tracking-[0.15em] mb-4">
              Program
            </h3>
            <div className="text-xs text-gray-500 whitespace-pre-line leading-relaxed">{hours}</div>
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
