import '@/src/app/admin.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Админ-панель',
  robots: { index: false, follow: false },
};

// Login must remain outside the protected layout.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
