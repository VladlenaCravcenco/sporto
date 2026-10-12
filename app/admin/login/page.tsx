import { redirect } from 'next/navigation';
import { getAdminUser } from '@/lib/auth/server';
import { AdminLoginForm } from '@/app/_components/admin/AdminLoginForm';

export default async function AdminLoginPage() {
  if (await getAdminUser()) redirect('/admin');
  return <AdminLoginForm />;
}
