'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { SiteBreadcrumbs } from '../../src/app/components/SiteBreadcrumbs';
import { brands } from '../../src/app/data/brands';
import type { CatalogNavigationCategory } from '../_lib/catalog-data';

const labels: Record<string, [string, string]> = {
  about: ['Despre noi', 'О нас'], contacts: ['Contact', 'Контакты'],
  'turnkey-solutions': ['Soluții la cheie', 'Решения под ключ'],
  'maintenance-service': ['Service și mentenanță', 'Сервис и обслуживание'],
  'terms-of-cooperation': ['Condiții de colaborare', 'Условия сотрудничества'],
  'delivery-terms': ['Condiții de livrare', 'Условия доставки'],
  'privacy-policy': ['Politica de confidențialitate', 'Политика конфиденциальности'],
  'order-request': ['Coș de cumpărături', 'Корзина'],
  login: ['Autentificare', 'Вход'], register: ['Înregistrare', 'Регистрация'],
  account: ['Contul meu', 'Личный кабинет'], 'forgot-password': ['Recuperare parolă', 'Восстановление пароля'],
  'reset-password': ['Parolă nouă', 'Новый пароль'], callback: ['Confirmare autentificare', 'Подтверждение входа'],
};

export function PageBreadcrumbs({ categories }: { categories: CatalogNavigationCategory[] }) {
  const pathname = usePathname();
  const query = useSearchParams();
  const parts = pathname.split('/').filter(Boolean);
  const localized = parts[0] === 'ro' || parts[0] === 'ru';
  const language = (localized ? parts.shift() : query.get('lang')) === 'ru' ? 'ru' : 'ro';
  const route = parts[0];
  // Product pages supply the product and its database category hierarchy.
  if (route === 'product') return null;
  const items = [{ label: language === 'ro' ? 'Acasă' : 'Главная', href: '/' + language }];
  if (route === 'catalog' || route === 'brands') {
    items.push({ label: language === 'ro' ? 'Catalog' : 'Каталог', href: '/' + language + '/catalog' });
    if (route === 'catalog') {
      const selected = query.getAll('category');
      const category = selected.length === 1 ? categories.find(c => c.id === selected[0]) : undefined;
      if (category) {
        items.push({ label: category.name[language], href: '/' + language + '/catalog?' + new URLSearchParams({ category: category.id }) });
        const sub = query.getAll('subcategory');
        const child = sub.length === 1 ? category.subcategories.find(s => s.id === sub[0]) : undefined;
        if (child) items.push({ label: child.name[language], href: '/' + language + '/catalog?' + new URLSearchParams({ category: category.id, subcategory: child.id }) });
      }
    } else {
      const brand = brands.find(b => b.id === parts[1]);
      items.push({ label: brand?.name || decodeURIComponent(parts[1] || ''), href: pathname });
    }
  } else if (route && labels[route]) {
    items.push({ label: labels[route][language === 'ru' ? 1 : 0], href: pathname });
  } else if (route) return null;
  return <SiteBreadcrumbs items={items} language={language} className="mx-auto w-full max-w-[1920px] px-4 pt-5 sm:px-6 lg:px-8" />;
}
