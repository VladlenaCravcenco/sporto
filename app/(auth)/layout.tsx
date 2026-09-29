import { Suspense, type ReactNode } from 'react';
import { AuthHeader } from '../_components/AuthHeader';
import { getFooterData } from '../_lib/footer-data';
import { getCatalogNavigation } from '../_lib/catalog-data';

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const [contacts, categories] = await Promise.all([getFooterData(), getCatalogNavigation()]);
  return (
    <div className="min-h-screen bg-[#f5f6f7]">
      <Suspense><AuthHeader contacts={contacts} categories={categories} /></Suspense>
      <main className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
