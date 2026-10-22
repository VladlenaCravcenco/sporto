import { notFound, redirect } from 'next/navigation';
import { getAdminUser } from '@/lib/auth/server';
import { adminSections } from '@/lib/admin/sections';
import { AdminPage } from '@/app/_components/admin/AdminPage';

export default async function Page({ params }: { params: Promise<{ section: string }> }) {
  if (!await getAdminUser()) redirect('/admin/login');
  const { section } = await params;
  if (section === 'content') redirect('/admin/content-pages');
  if (!adminSections.includes(section)) notFound();
  return <AdminPage />;
}
