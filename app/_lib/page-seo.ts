import type { Metadata } from 'next';

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.VITE_SITE_URL || 'https://www.sporto.md').replace(/\/+$/, '');
export function localizedMetadata(language: 'ro' | 'ru', path: string, title: string, description: string, image?: string | null): Metadata {
  const url = `${siteUrl}/${language}${path}`;
  return {
    title, description,
    alternates: { canonical: url, languages: { ro: `${siteUrl}/ro${path}`, ru: `${siteUrl}/ru${path}`, 'x-default': `${siteUrl}/ro${path}` } },
    openGraph: { title: `${title} | SPORTO`, description, url, type: 'website', siteName: 'SPORTO', locale: language === 'ro' ? 'ro_MD' : 'ru_MD', alternateLocale: language === 'ro' ? 'ru_MD' : 'ro_MD', ...(image ? { images: [image] } : {}) },
    twitter: { card: 'summary_large_image', title: `${title} | SPORTO`, description, ...(image ? { images: [image] } : {}) },
  };
}
export const contentSeo: Record<string, { ro: [string, string]; ru: [string, string] }> = {
  about: { ro: ['Despre companie — echipamente sportive în Moldova', 'SPORTO (SPORTOSFERA S.R.L.): echipamente sportive pentru persoane, companii și instituții din Moldova. Descoperă compania și serviciile noastre.'], ru: ['О компании — спортивное оборудование в Молдове', 'SPORTO (SPORTOSFERA S.R.L.): спортивное оборудование для частных покупателей, компаний и учреждений Молдовы. Информация о компании и услугах.'] },
  contacts: { ro: ['Contacte — Chișinău, Moldova', 'Contactează SPORTO pentru echipamente sportive, oferte și servicii în Moldova. Telefon, email, adresă și formular de contact.'], ru: ['Контакты — Кишинёв, Молдова', 'Свяжитесь с SPORTO по вопросам спортивного оборудования, предложений и услуг в Молдове. Телефон, email, адрес и форма обращения.'] },
  'turnkey-solutions': { ro: ['Echiparea sălilor de fitness la cheie în Moldova', 'Soluții SPORTO pentru echiparea sălilor de fitness: consultanță, selecția echipamentelor, livrare și montaj. Discută proiectul tău cu noi.'], ru: ['Оснащение фитнес-залов под ключ в Молдове', 'Решения SPORTO для оснащения фитнес-залов: консультация, подбор оборудования, доставка и монтаж. Обсудите с нами ваш проект.'] },
  'maintenance-service': { ro: ['Service și mentenanță echipamente fitness în Moldova', 'Servicii SPORTO de mentenanță și service pentru echipamente fitness în Moldova. Află despre întreținere și solicită o consultație.'], ru: ['Сервис и обслуживание фитнес-оборудования в Молдове', 'Сервис и обслуживание фитнес-оборудования SPORTO в Молдове. Информация об услугах и обращение за консультацией.'] },
  'terms-of-cooperation': { ro: ['Condiții de colaborare', 'Condițiile de colaborare cu SPORTO pentru achiziția echipamentelor sportive: comenzi, plată și relația cu clienții.'], ru: ['Условия сотрудничества', 'Условия сотрудничества с SPORTO при покупке спортивного оборудования: оформление заказов, оплата и взаимодействие с клиентами.'] },
  'delivery-terms': { ro: ['Condiții de livrare în Moldova', 'Informații despre livrarea echipamentelor sportive SPORTO: organizarea livrării, recepția produselor și condițiile aplicabile.'], ru: ['Условия доставки в Молдове', 'Информация о доставке спортивного оборудования SPORTO: организация доставки, получение товаров и действующие условия.'] },
  'privacy-policy': { ro: ['Politica de confidențialitate', 'Politica de confidențialitate SPORTO: prelucrarea datelor personale, utilizarea site-ului și drepturile utilizatorilor.'], ru: ['Политика конфиденциальности', 'Политика конфиденциальности SPORTO: обработка персональных данных, использование сайта и права пользователей.'] },
};
