import { redirect } from 'next/navigation';
import { getAdminUser } from '@/lib/auth/server';
import { AdminPage } from '@/app/_components/admin/AdminPage';

export default async function Page() {
  if (!await getAdminUser()) redirect('/admin/login');
  return <AdminPage />;
}
