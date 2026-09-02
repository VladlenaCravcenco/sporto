import {
  ArrowUpRight,
  ExternalLink,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  Youtube,
} from 'lucide-react';
import { Logo } from '../../src/app/components/Logo';
import type { FooterData, SocialType } from '../_lib/footer-data';
import type { Language } from './HeaderPreview';
import { CookieSettingsButton } from './CookieSettingsButton';

const copy = {
  ro: {
    about: 'Activăm în mai multe segmente de piață: B2C, B2B și B2G.',
    links: 'Link-uri utile', legal: 'Informații juridice', contact: 'Contact', schedule: 'Program',
    home: 'Acasă', aboutLink: 'Despre noi', catalog: 'Catalog', turnkey: 'Soluții la cheie',
    maintenance: 'Service și mentenanță', terms: 'Condiții de colaborare', delivery: 'Condiții de livrare',
    privacy: 'Politica de confidențialitate', rights: 'Toate drepturile rezervate',
  },
  ru: {
    about: 'Мы работаем в нескольких рыночных сегментах: B2C, B2B и B2G.',
    links: 'Полезные ссылки', legal: 'Правовая информация', contact: 'Контакты', schedule: 'График',
    home: 'Главная', aboutLink: 'О нас', catalog: 'Каталог', turnkey: 'Решения под ключ',
    maintenance: 'Сервис и обслуживание', terms: 'Условия сотрудничества', delivery: 'Условия доставки',
    privacy: 'Политика конфиденциальности', rights: 'Все права защищены',
  },
} as const;

const socialLabels: Record<SocialType, string> = {
  instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', youtube: 'YouTube',
  linkedin: 'LinkedIn', telegram: 'Telegram', whatsapp: 'WhatsApp', viber: 'Viber',
};

function SocialIcon({ type }: { type: SocialType }) {
  const className = 'h-4 w-4';
  if (type === 'instagram') return <Instagram className={className} />;
  if (type === 'facebook') return <Facebook className={className} />;
  if (type === 'youtube') return <Youtube className={className} />;
  if (type === 'linkedin') return <Linkedin className={className} />;
  if (type === 'telegram') return <Send className={className} />;
  return <MessageCircle className={className} />;
}

export function FooterPreview({ language, contacts }: { language: Language; contacts: FooterData }) {
  const text = copy[language];
  const localePath = (path = '') => `/${language}${path}`;
  const address = language === 'ro' ? contacts.address_ro : contacts.address_ru;
  const hours = language === 'ro' ? contacts.hours_ro : contacts.hours_ru;
  const links = [
    [localePath(), text.home],
    [localePath('/about'), text.aboutLink],
    [localePath('/catalog'), text.catalog],
    [localePath('/turnkey-solutions'), text.turnkey],
    [localePath('/maintenance-service'), text.maintenance],
  ] as const;
  const legal = [
    [localePath('/terms-of-cooperation'), text.terms],
    [localePath('/delivery-terms'), text.delivery],
    [localePath('/privacy-policy'), text.privacy],
  ] as const;

  return (
    <footer className="bg-black text-gray-500">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0 border-b border-gray-900">
          <div className="md:col-span-3 py-10 md:border-r border-gray-900 md:pr-8">
            <Logo className="h-8 w-auto mb-4" color="#ffffff" />
            <p className="text-xs text-gray-500 leading-relaxed max-w-xs">{text.about}</p>
          </div>

          <div className="md:col-span-3 py-10 md:border-r border-gray-900 md:px-8">
            <h2 className="text-xs font-semibold text-gray-400 mb-4">{text.links}</h2>
            <ul className="space-y-2">
              {links.map(([href, label]) => (
                <li key={href}><a href={href} className="text-xs text-gray-500 hover:text-white transition-colors inline-flex items-center gap-1 group">{label}<ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></a></li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2 py-10 md:border-r border-gray-900 md:px-8">
            <h2 className="text-xs font-semibold text-gray-400 mb-4">{text.legal}</h2>
            <ul className="space-y-2">
              {legal.map(([href, label]) => (
                <li key={href}><a href={href} className="text-xs text-gray-500 hover:text-white transition-colors inline-flex items-center gap-1 group">{label}<ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></a></li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2 py-10 md:border-r border-gray-900 md:px-8">
            <h2 className="text-xs font-semibold text-gray-400 mb-4">{text.contact}</h2>
            <ul className="space-y-3">
              <li><a href={`mailto:${contacts.email}`} className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors"><Mail className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />{contacts.email}</a></li>
              <li><a href={`tel:${contacts.phone}`} className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors"><Phone className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />{contacts.phoneDisplay}</a></li>
              <li>
                <a href={contacts.mapsDirectionsUrl} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 text-xs text-gray-500 hover:text-white transition-colors group">
                  <MapPin className="w-3.5 h-3.5 text-gray-600 flex-shrink-0 mt-0.5" />
                  <span>{address}<ExternalLink className="inline w-2.5 h-2.5 ml-1 opacity-0 group-hover:opacity-60 transition-opacity" /></span>
                </a>
              </li>
              {contacts.socials.length > 0 && (
                <li className="flex items-center gap-3 pt-1">
                  {contacts.socials.map(social => (
                    <a key={social.id} href={social.url} target="_blank" rel="noopener noreferrer" aria-label={socialLabels[social.type]} title={socialLabels[social.type]} className="text-gray-600 hover:text-white transition-colors"><SocialIcon type={social.type} /></a>
                  ))}
                </li>
              )}
            </ul>
          </div>

          <div className="md:col-span-2 py-10 md:pl-8">
            <h2 className="text-xs font-semibold text-gray-400 mb-4">{text.schedule}</h2>
            <div className="text-xs text-gray-500 whitespace-pre-line leading-relaxed">{hours}</div>
          </div>
        </div>

        <div className="py-5 border-t border-gray-900 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-600">© 2026 SPORTOSFERA S.R.L. {text.rights}.</p>
          <div className="flex items-center gap-4">
            <CookieSettingsButton language={language} />
            <p className="text-xs text-gray-700">Moldova · B2B Wholesale</p>
          </div>
        </div>
        <div className="py-3 border-t border-gray-900 flex items-center justify-center">
          <a href="https://godevca.com" target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-1.5 text-[11px] text-gray-700 hover:text-gray-500 transition-colors">
            <span className="w-1 h-1 rounded-full bg-gray-700 group-hover:bg-gray-500 transition-colors" />
            Разработано &amp; создано <span className="text-gray-600 group-hover:text-gray-400 font-medium">GODEVCA</span><ArrowUpRight className="w-2.5 h-2.5 opacity-50" />
          </a>
        </div>
      </div>
    </footer>
  );
}
