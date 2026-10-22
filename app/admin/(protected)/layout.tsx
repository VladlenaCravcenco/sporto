import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getAdminUser } from '@/lib/auth/server';

export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  if (!await getAdminUser()) redirect('/admin/login');
  return children;
}
