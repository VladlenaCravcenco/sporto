import Link from 'next/link';
import type { Metadata } from 'next';
import { headers } from 'next/headers';

export const metadata: Metadata = {
  title: 'Page Not Found',
  description: 'The page you are looking for does not exist.',
  robots: 'noindex, nofollow',
};

export default async function NotFound() {
  const language = (await headers()).get('x-sporto-locale') === 'ru' ? 'ru' : 'ro';
  const ru = language === 'ru';
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f5f6f7] px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-600 mb-4">404</h1>
        <p className="text-xl text-gray-700 mb-8">{ru ? 'Страница не найдена' : 'Pagina nu a fost găsită'}</p>
        <p className="text-gray-600 mb-12 max-w-md">
          {ru ? 'Страница не существует или была перемещена.' : 'Pagina nu există sau a fost mutată.'}
        </p>
        <Link
          href={`/${language}`}
          className="inline-block px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          {ru ? 'На главную' : 'Înapoi acasă'}
        </Link>
      </div>
    </div>
  );
}
