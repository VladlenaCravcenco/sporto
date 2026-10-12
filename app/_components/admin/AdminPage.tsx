'use client';

import dynamic from 'next/dynamic';
const Workspace = dynamic(() => import('./AdminWorkspace'), {
  ssr: false,
  loading: () => <p className="p-8 text-center text-gray-600" role="status">Загрузка админ-панели…</p>,
});

export function AdminPage() { return <Workspace />; }
