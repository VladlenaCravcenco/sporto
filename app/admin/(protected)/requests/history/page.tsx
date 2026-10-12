import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAdminUser } from '@/lib/auth/server';
import { createClient } from '@/lib/supabase/server';

type RequestRow = {
  id: string; client_id: string | null; client_name: string; client_email: string;
  client_phone: string; client_company: string | null; client_type: string;
  delivery_address: string | null; notes: string | null; status: string; created_at: string;
  total_price: number; cart_items: Array<{id: string; name_ro: string; name_ru: string; sku: string | null; qty: number; price: number}>;
};
export default async function RequestsPage({searchParams}: {searchParams: Promise<{client?: string; page?: string}>}) {
  if (!await getAdminUser()) redirect('/admin/login');
  const params = await searchParams;
  const client = params.client && /^[0-9a-f-]{36}$/i.test(params.client) ? params.client : undefined;
  const page = Math.max(1, Math.min(10000, Number(params.page) || 1));
  const db = await createClient();
  let query = db.from('order_requests').select('*').order('created_at', {ascending: false}).range((page-1)*30, page*30-1);
  if (client) query = query.eq('client_id', client);
  const {data, error} = await query;
  if (error) return <p role="alert">Не удалось загрузить заявки. Проверьте доступ администратора к таблице order_requests.</p>;
  const requests = (data || []) as unknown as RequestRow[];
  const pageLink = (n: number) => `/admin/requests/history?page=${n}${client ? `&client=${client}` : ''}`;
  return <div className="mx-auto max-w-6xl p-6 space-y-5">
    <Link href="/admin" className="underline">← Админка</Link>
    <h2 className="text-2xl font-semibold">{client ? 'История заявок клиента' : 'Заявки с сайта'}</h2>
    {client && <Link href="/admin/requests" className="block underline">Все заявки</Link>}
    {!requests.length && <p>Заявок нет.</p>}
    {requests.map(row => <details key={row.id} className="rounded border border-gray-200 bg-white p-5">
      <summary className="cursor-pointer"><strong>№ {row.id.slice(0,8).toUpperCase()} · {row.client_name}</strong><span className="ml-3">{row.total_price} MDL · {row.status}</span><span className="ml-3 text-sm text-gray-500">{new Date(row.created_at).toLocaleString('ru-RU', {timeZone:'Europe/Chisinau'})}</span></summary>
      <div className="mt-4 space-y-2 text-sm">
        <p>{row.client_email} · {row.client_phone}</p>
        <p>{row.client_type === 'company' ? `Юрлицо · ${row.client_company || '—'}` : 'Физлицо'}</p>
        <p>Адрес: {row.delivery_address || 'Не указан'}</p>
        <p className="whitespace-pre-wrap">Пожелания: {row.notes || 'Нет'}</p>
        {row.client_id ? <Link href={`/admin/requests/history?client=${row.client_id}`} className="block underline">История заявок этого клиента</Link> : <p className="text-gray-500">Не привязана к профилю клиента. Перед объединением проверьте контакты.</p>}
        <ul className="divide-y border-t">{(Array.isArray(row.cart_items) ? row.cart_items : []).map((item, i) => <li key={`${item.id}-${i}`} className="py-3">{item.name_ru || item.name_ro} {item.sku ? `· ${item.sku}` : ''}<br/>{item.qty} × {item.price} MDL = {(item.qty*item.price).toFixed(2)} MDL</li>)}</ul>
        <p>Стоимость товаров: {row.total_price} MDL. Условия доставки и итоговую стоимость согласуйте с клиентом.</p>
      </div>
    </details>)}
    <nav className="flex gap-5">{page > 1 && <Link href={pageLink(page-1)}>← Назад</Link>}{requests.length === 30 && <Link href={pageLink(page+1)}>Далее →</Link>}</nav>
  </div>;
}
