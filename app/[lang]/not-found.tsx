import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found',
  description: 'The page you are looking for does not exist.',
  robots: 'noindex, nofollow',
};

const translations = {
  ro: {
    title: 'Pagina nu a fost găsită',
    description: 'Pagina pe care o cauți nu există sau a fost mutată.',
    backHome: 'Înapoi acasă',
  },
  ru: {
    title: 'Страница не найдена',
    description: 'Страница, которую вы ищете, не существует или была удалена.',
    backHome: 'На главную',
  },
} as const;

export default async function NotFoundLocale({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const t = translations[lang as keyof typeof translations] || translations.ro;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-600 mb-4">404</h1>
        <p className="text-xl text-gray-700 mb-2">{t.title}</p>
        <p className="text-gray-600 mb-12 max-w-md">{t.description}</p>
        <Link
          href={`/${lang}`}
          className="inline-block px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          {t.backHome}
        </Link>
      </div>
    </div>
  );
}
