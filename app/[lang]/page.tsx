import { getCategoryIconData } from '../_lib/category-icon-data';
import { getCatalogNavigation } from '../_lib/catalog-data';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { HomeMigrationPreview } from '../_components/HomeMigrationPreview';
import { getHomeHeroData } from '../_lib/home-data';
import type { Language } from '../_components/HeaderPreview';

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.VITE_SITE_URL || 'https://www.sporto.md').replace(/\/+$/, '');
const languages = new Set<Language>(['ro', 'ru']);

interface LocalePageProps {
  params: Promise<{ lang: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const { lang } = await params;
  if (!languages.has(lang as Language)) return {};

  const isRo = lang === 'ro';
  const canonical = `${siteUrl}/${lang}`;

  return {
    title: isRo
      ? 'Echipamente sportive și aparate fitness în Moldova'
      : 'Спортивное оборудование и тренажёры в Молдове',
    description: isRo
      ? 'Aparate cardio, echipamente de forță și accesorii sportive pentru acasă, săli și instituții. Catalog SPORTO, livrare și servicii în Moldova.'
      : 'Кардиотренажёры, силовое оборудование и спортивный инвентарь для дома, залов и учреждений. Каталог SPORTO, доставка и обслуживание в Молдове.',
    alternates: {
      canonical,
      languages: {
        ro: `${siteUrl}/ro`,
        ru: `${siteUrl}/ru`,
        'x-default': `${siteUrl}/ro`,
      },
    },
    openGraph: {
      type: 'website',
      url: canonical,
      locale: isRo ? 'ro_MD' : 'ru_MD',
      alternateLocale: isRo ? ['ru_MD'] : ['ro_MD'],
      siteName: 'SPORTO',
      title: isRo
        ? 'Echipamente sportive și aparate fitness în Moldova'
        : 'Спортивное оборудование и тренажёры в Молдове',
      description: isRo
        ? 'Echipamente sportive profesionale și soluții la cheie în Moldova.'
        : 'Профессиональное спортивное оборудование и решения под ключ в Молдове.',
    },
  };
}

export default async function LocalizedHomePage({ params }: LocalePageProps) {
  const { lang } = await params;
  if (!languages.has(lang as Language)) notFound();

  const [data, categories] = await Promise.all([getHomeHeroData(), getCatalogNavigation()]);
  return <HomeMigrationPreview language={lang as Language} {...data} categories={categories} categoryIcons={getCategoryIconData(categories)} />;
}
