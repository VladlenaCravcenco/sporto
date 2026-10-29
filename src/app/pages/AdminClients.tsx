import { useState, useEffect, useCallback } from 'react';
import { supabase, type ClientRow } from '../../lib/supabase';
import {
  Users, RefreshCw, Search, X, Copy, Check, Mail,
  Phone, Building2, User, AlertCircle, ChevronDown,
  Send, UserCircle, Briefcase, Download, Trash2,
} from 'lucide-react';
import { useAdminLang } from '../contexts/AdminLangContext';

const SQL_SETUP = `CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  company text,
  email text NOT NULL UNIQUE,
  phone text,
  address text,
  client_type text DEFAULT 'company',
  notes text,
  created_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS clients_email_unique_idx ON public.clients (email);
CREATE UNIQUE INDEX IF NOT EXISTS clients_phone_unique_idx
  ON public.clients (REGEXP_REPLACE(phone, '\\D', '', 'g'))
  WHERE NULLIF(REGEXP_REPLACE(phone, '\\D', '', 'g'), '') IS NOT NULL;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON public.clients;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'Sporto admin manages clients'
  ) THEN
    CREATE POLICY "Sporto admin manages clients"
      ON public.clients FOR ALL TO authenticated
      USING (lower(coalesce(auth.jwt() ->> 'email', '')) = 'sporto-admin@gmail.com')
      WITH CHECK (lower(coalesce(auth.jwt() ->> 'email', '')) = 'sporto-admin@gmail.com');
  END IF;
END $$;`;

type Filter = 'all' | 'company' | 'individual';

export function AdminClients() {
  const { t } = useAdminLang();
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [noTable, setNoTable] = useState(false);
  const [showSql, setShowSql] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [offerPanel, setOfferPanel] = useState(false);
  const [offerSubject, setOfferSubject] = useState('Специальное предложение от SPORTOSFERA S.R.L.');
  const [detailId, setDetailId] = useState<string | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      const msg = error.message || '';
      if (msg.includes('does not exist') || msg.includes('schema cache') || msg.includes('relation') || error.code === '42P01' || error.code === 'PGRST200') {
        setNoTable(true);
      } else {
        showToast(error.message, false);
      }
    } else {
      setRows(data as ClientRow[]);
      setNoTable(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Realtime — любое изменение в таблице clients сразу отражается в UI
  useEffect(() => {
    const channel = supabase
      .channel('admin-clients-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clients' },
        () => { load(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      r.name.toLowerCase().includes(q) ||
      (r.company || '').toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      (r.phone || '').includes(q);
    const matchFilter = filter === 'all' || r.client_type === filter;
    return matchSearch && matchFilter;
  });

  const detail = detailId ? rows.find(r => r.id === detailId) : null;

  const toggleSelect = (id: string) => {
    setSelected(s => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(r => r.id)));
    }
  };

  const copyEmail = (email: string, id: string) => {
    navigator.clipboard.writeText(email).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  };

  const copyAllEmails = () => {
    const emails = filtered
      .filter(r => selected.size === 0 || selected.has(r.id))
      .map(r => r.email)
      .join(', ');
    navigator.clipboard.writeText(emails).then(() => showToast(`Скопировано ${emails.split(', ').length} email`));
  };

  const openMailto = () => {
    const targets = filtered.filter(r => selected.size === 0 || selected.has(r.id));
    const bcc = targets.map(r => r.email).join(',');
    window.open(`mailto:?bcc=${encodeURIComponent(bcc)}&subject=${encodeURIComponent(offerSubject)}`);
  };

  const exportCsv = () => {
    const rows2export = filtered.filter(r => selected.size === 0 || selected.has(r.id));
    const header = 'Имя,Компания,Email,Телефон,Тип,Дата';
    const lines = rows2export.map(r =>
      `"${r.name}","${r.company || ''}","${r.email}","${r.phone || ''}","${r.client_type || ''}","${r.created_at.slice(0, 10)}"`
    );
    const csv = [header, ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'clients.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const deleteClient = async (id: string) => {
    if (!confirm(t.clients.deleteConfirm)) return;
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) {
      showToast(`${t.clients.errorDelete}: ${error.message}`, false);
      return;
    }
    setRows(r => r.filter(c => c.id !== id));
    setSelected(s => { const n = new Set(s); n.delete(id); return n; });
    if (detailId === id) setDetailId(null);
    showToast(t.clients.deleted);
  };

  const activeCount = selected.size > 0 ? selected.size : filtered.length;

  return (
    <div className="min-h-screen admin-canvas flex flex-col">

      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 text-xs flex items-center gap-2 shadow-lg ${toast.ok ? 'admin-solid admin-on-solid' : 'bg-red-600 admin-on-solid'}`}>
          {toast.ok ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
          {toast.msg}
        </div>
      )}

      <div className="admin-page-toolbar admin-surface border-b admin-border sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center min-h-12 py-2 gap-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 admin-muted" />
              <span className="text-sm admin-ink">{t.clients.title}</span>
              <span className="text-xs admin-muted-surface admin-muted px-2 py-0.5 tabular-nums">{rows.length}</span>
            </div>

            <div className="flex-1 min-w-[160px] max-w-xs relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 admin-muted" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t.clients.searchPlaceholder}
                className="w-full h-8 pl-9 pr-3 text-xs border admin-border focus:outline-none admin-focus-border transition-colors admin-surface"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 admin-muted admin-hover-ink">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex items-center border admin-border overflow-hidden rounded-lg">
              {(['all', 'company', 'individual'] as Filter[]).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 h-7 text-xs   transition-colors border-r admin-border last:border-0 ${filter === f ? 'admin-solid admin-on-solid' : 'admin-muted admin-hover-ink'}`}>
                  {f === 'all' ? t.common.all : f === 'company' ? t.clients.filterCompany : t.clients.filterIndividual}
                </button>
              ))}
            </div>

            <div className="admin-client-tools ml-auto">
              <button onClick={load} disabled={loading} className="flex items-center gap-1.5 text-xs admin-muted admin-hover-ink transition-colors">
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={exportCsv} className="flex items-center gap-1.5 text-xs border admin-border hover:border-gray-400 px-3 py-1.5 admin-muted admin-hover-ink transition-colors">
                <Download className="w-3 h-3" />
                {t.clients.exportCsv}
              </button>
              <button onClick={copyAllEmails} className="flex items-center gap-1.5 text-xs border admin-border hover:border-gray-400 px-3 py-1.5 admin-muted admin-hover-ink transition-colors">
                <Copy className="w-3 h-3" />
                {t.clients.copyEmail}
              </button>
              <button
                onClick={() => setOfferPanel(v => !v)}
                className="flex items-center gap-2 admin-solid admin-on-solid px-4 py-2 text-xs   admin-hover-solid transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                {t.clients.newsletter} {activeCount > 0 && `(${activeCount})`}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-page-body max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1">

        {noTable && (
          <div className="mb-6 border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-amber-800 mb-1">Таблица <code className="bg-amber-100 px-1">clients</code> не существует в Supabase.</p>
                <p className="text-xs text-amber-600 mb-3">Запустите SQL ниже в Supabase Dashboard → SQL Editor:</p>
                <button onClick={() => setShowSql(v => !v)}
                  className="text-xs text-amber-700 border border-amber-300 px-3 py-1.5 hover:bg-amber-100 transition-colors mb-2">
                  {showSql ? t.common.noResults : 'SQL'}
                </button>
                {showSql && (
                  <pre className="bg-amber-100/50 border border-amber-200 p-3 text-xs text-amber-900 overflow-x-auto leading-relaxed mt-2">
                    {SQL_SETUP}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )}

        {offerPanel && (
          <div className="mb-4 admin-surface border admin-border p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm admin-ink">{t.clients.newsletterTitle}</p>
                <p className="text-xs admin-muted mt-0.5">
                  {t.clients.recipients}: <strong className="admin-ink">{activeCount}</strong> {t.clients.clientsWord}
                  {selected.size > 0 ? ` (${t.clients.selectedLabel})` : ` (${t.clients.allLabel})`}
                </p>
              </div>
              <button onClick={() => setOfferPanel(false)} className="admin-muted admin-hover-ink">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 max-w-lg">
              <div>
                <label className="text-xs   admin-muted mb-1 block">{t.clients.emailSubject}</label>
                <input
                  type="text"
                  value={offerSubject}
                  onChange={e => setOfferSubject(e.target.value)}
                  className="w-full h-9 px-3 text-xs border admin-border focus:outline-none admin-focus-border transition-colors"
                />
              </div>
              <div className="admin-canvas border admin-border p-3 text-xs admin-muted leading-relaxed">
                {t.clients.bccNote}
              </div>
              <div className="flex gap-2">
                <button onClick={openMailto}
                  className="flex items-center gap-2 admin-solid admin-on-solid px-5 py-2.5 text-xs   admin-hover-solid transition-colors">
                  <Mail className="w-3.5 h-3.5" />
                  {t.clients.openInEmail}
                </button>
                <button onClick={copyAllEmails}
                  className="flex items-center gap-2 border admin-border admin-muted px-4 py-2.5 text-xs   admin-hover-border admin-hover-ink transition-colors">
                  <Copy className="w-3.5 h-3.5" />
                  {t.clients.copyBcc}
                </button>
              </div>
            </div>
          </div>
        )}

        {!noTable && (
          <div className="admin-surface border admin-border">

            <div className="grid grid-cols-[auto_1fr_1fr_140px_120px_110px_80px] gap-0 border-b admin-border text-xs   admin-muted hidden lg:grid">
              <div className="px-4 py-3 flex items-center">
                <button onClick={toggleAll}
                  className={`w-4 h-4 border flex items-center justify-center transition-colors ${selected.size === filtered.length && filtered.length > 0 ? 'admin-solid admin-border-strong' : 'admin-border hover:border-gray-500'}`}>
                  {selected.size === filtered.length && filtered.length > 0 && <Check className="w-2.5 h-2.5 admin-on-solid" />}
                </button>
              </div>
              <div className="px-4 py-3">{t.clients.colName}</div>
              <div className="px-4 py-3">{t.clients.colEmail}</div>
              <div className="px-4 py-3">{t.clients.colPhone}</div>
              <div className="px-4 py-3">{t.clients.colType}</div>
              <div className="px-4 py-3">{t.clients.colDate}</div>
              <div className="px-4 py-3" />
            </div>

            {loading ? (
              <div className="divide-y divide-gray-50">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-4 animate-pulse">
                    <div className="w-4 h-4 admin-muted-surface" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 admin-muted-surface w-48" />
                      <div className="h-2.5 admin-canvas w-32" />
                    </div>
                    <div className="h-3 admin-muted-surface w-40" />
                    <div className="h-3 admin-muted-surface w-28" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center">
                <Users className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                <p className="text-sm admin-muted">
                  {search ? t.clients.noResults : t.clients.noData}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filtered.map(row => (
                  <div
                    key={row.id}
                    className={`group transition-colors ${selected.has(row.id) ? 'admin-canvas' : 'hover:bg-gray-50/50'}`}
                  >

                    <div className="hidden lg:grid grid-cols-[auto_1fr_1fr_140px_120px_110px_80px] items-center gap-0">
                      <div className="px-4 py-3.5">
                        <button onClick={() => toggleSelect(row.id)}
                          className={`w-4 h-4 border flex items-center justify-center flex-shrink-0 transition-colors ${selected.has(row.id) ? 'admin-solid admin-border-strong' : 'admin-border hover:border-gray-500'}`}>
                          {selected.has(row.id) && <Check className="w-2.5 h-2.5 admin-on-solid" />}
                        </button>
                      </div>
                      <div className="px-4 py-3.5 min-w-0 cursor-pointer" onClick={() => setDetailId(detailId === row.id ? null : row.id)}>
                        <p className="text-sm admin-ink truncate">{row.name}</p>
                        {row.company && <p className="text-xs admin-muted truncate mt-0.5">{row.company}</p>}
                      </div>
                      <div className="px-4 py-3.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs admin-muted truncate">{row.email}</span>
                          <button onClick={() => copyEmail(row.email, row.id)}
                            className="flex-shrink-0 admin-muted admin-hover-ink transition-colors opacity-0 group-hover:opacity-100">
                            {copiedId === row.id ? <Check className="w-3 h-3 admin-ink" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                      <div className="px-4 py-3.5">
                        <span className="text-xs admin-muted">{row.phone || '—'}</span>
                      </div>
                      <div className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 ${row.client_type === 'individual' ? 'admin-canvas admin-muted border admin-border' : 'admin-solid admin-on-solid'}`}>
                          {row.client_type === 'individual'
                            ? <><UserCircle className="w-2.5 h-2.5" />{t.clients.typeIndividual}</>
                            : <><Briefcase className="w-2.5 h-2.5" />{t.clients.typeCompany}</>}
                        </span>
                      </div>
                      <div className="px-4 py-3.5">
                        <span className="text-xs admin-muted tabular-nums">{row.created_at.slice(0, 10)}</span>
                      </div>
                      <div className="px-4 py-3.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a href={`mailto:${row.email}`}
                          className="w-7 h-7 flex items-center justify-center border admin-border admin-hover-border admin-muted admin-hover-ink transition-colors">
                          <Mail className="w-3 h-3" />
                        </a>
                        <button onClick={() => deleteClient(row.id)}
                          className="w-7 h-7 flex items-center justify-center border admin-border hover:border-red-300 admin-muted hover:text-red-500 transition-colors">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="lg:hidden p-4">
                      <div className="flex flex-wrap items-start gap-3">
                        <button onClick={() => toggleSelect(row.id)}
                          className={`w-4 h-4 border flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${selected.has(row.id) ? 'admin-solid admin-border-strong' : 'admin-border'}`}>
                          {selected.has(row.id) && <Check className="w-2.5 h-2.5 admin-on-solid" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <button className="text-sm admin-ink text-left underline underline-offset-4" aria-expanded={detailId === row.id} onClick={() => setDetailId(detailId === row.id ? null : row.id)}>{row.name}</button>
                            <span className={`text-xs px-1.5 py-0.5 ${row.client_type === 'individual' ? 'admin-muted-surface admin-muted' : 'admin-solid admin-on-solid'}`}>
                              {row.client_type === 'individual' ? t.clients.typeIndividual : t.clients.typeCompany}
                            </span>
                          </div>
                          {row.company && <p className="text-xs admin-muted">{row.company}</p>}
                          <p className="text-xs admin-muted mt-1">{row.email}</p>
                          {row.phone && <p className="text-xs admin-muted">{row.phone}</p>}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => copyEmail(row.email, row.id)}
                            className="w-7 h-7 flex items-center justify-center border admin-border admin-muted">
                            {copiedId === row.id ? <Check className="w-3 h-3 admin-ink" /> : <Copy className="w-3 h-3" />}
                          </button>
                          <a href={`mailto:${row.email}`}
                            className="w-7 h-7 flex items-center justify-center border admin-border admin-muted">
                            <Mail className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>

                    {detailId === row.id && (
                      <div className="border-t admin-border admin-canvas px-4 lg:px-14 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                          <div>
                            <span className="text-xs   admin-muted">{t.clients.colAddress}</span>
                            <p className="admin-ink mt-1">{row.address || '—'}</p>
                          </div>
                          <div>
                            <span className="text-xs   admin-muted">{t.clients.colNotes}</span>
                            <p className="admin-ink mt-1">{row.notes || '—'}</p>
                          </div>
                          <div>
                            <span className="text-xs   admin-muted">{t.clients.colId}</span>
                            <p className="admin-muted mt-1 font-mono text-xs break-all">{row.id}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!loading && filtered.length > 0 && (
              <div className="border-t admin-border px-4 py-3 flex items-center justify-between">
                <span className="text-xs admin-muted">
                  {filtered.length} {t.common.of} {rows.length} {t.clients.clientsWord}
                  {selected.size > 0 && <> · <span className="admin-ink">{selected.size} {t.common.selected}</span></>}
                </span>
                {selected.size > 0 && (
                  <button onClick={() => setSelected(new Set())} className="text-xs admin-muted admin-hover-ink transition-colors">
                    {t.clients.clearSel}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
