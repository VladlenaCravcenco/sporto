import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase, type OrderRequestRow } from '../../lib/supabase';
import {
  ShoppingCart, RefreshCw, Search, X, Check, Mail,
  Phone, Building2, AlertCircle, ChevronDown, ChevronUp,
  Package, Clock, CheckCircle, XCircle, Loader2,
  Trash2, MapPin, User, SendHorizonal, MessageSquare, History,
} from 'lucide-react';
import { useAdminLang } from '../contexts/AdminLangContext';
import { dispatchClearAdminRequestUnread } from '../hooks/useAdminNotifications';

const SQL_SETUP = `CREATE TABLE IF NOT EXISTS public.order_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid,
  client_name text NOT NULL,
  client_company text,
  client_email text NOT NULL,
  client_phone text,
  client_type text DEFAULT 'company',
  delivery_address text,
  notes text,
  admin_comment text,
  cart_items jsonb DEFAULT '[]',
  total_price numeric DEFAULT 0,
  total_items integer DEFAULT 0,
  status text DEFAULT 'new',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.order_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON public.order_requests;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'order_requests' AND policyname = 'Sporto admin manages order requests'
  ) THEN
    CREATE POLICY "Sporto admin manages order requests"
      ON public.order_requests FOR ALL TO authenticated
      USING (lower(coalesce(auth.jwt() ->> 'email', '')) = 'sporto-admin@gmail.com')
      WITH CHECK (lower(coalesce(auth.jwt() ->> 'email', '')) = 'sporto-admin@gmail.com');
  END IF;
END $$;`;

type Status = 'new' | 'in_progress' | 'done' | 'cancelled';
type StatusFilter = Status | 'all';
const ADMIN_COMMENT_STORAGE_KEY = 'sporto_admin_request_comments';

function readLocalAdminComments(): Record<string, string> {
  try {
    const raw = localStorage.getItem(ADMIN_COMMENT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeLocalAdminComments(next: Record<string, string>) {
  try {
    localStorage.setItem(ADMIN_COMMENT_STORAGE_KEY, JSON.stringify(next));
  } catch {}
}

export function AdminRequests() {
  const { t, lang } = useAdminLang();

  const STATUS_CONFIG: Record<Status, { label: string; bg: string; text: string; border: string; icon: ReactNode }> = {
    new:         { label: t.requests.statusNew,        bg: 'bg-black',       text: 'text-white',       border: 'border-black',       icon: <Clock       className="w-3 h-3" /> },
    in_progress: { label: t.requests.statusInProgress, bg: 'bg-amber-500',   text: 'text-white',       border: 'border-amber-500',   icon: <Loader2     className="w-3 h-3" /> },
    done:        { label: t.requests.statusDone,       bg: 'bg-green-600',   text: 'text-white',       border: 'border-green-600',   icon: <CheckCircle className="w-3 h-3" /> },
    cancelled:   { label: t.requests.statusCancelled,  bg: 'bg-gray-200',    text: 'text-gray-500',    border: 'border-gray-200',    icon: <XCircle     className="w-3 h-3" /> },
  };

  const [rows, setRows]               = useState<OrderRequestRow[]>([]);
  const [loading, setLoading]         = useState(true);
  const [noTable, setNoTable]         = useState(false);
  const [showSql, setShowSql]         = useState(false);
  const [historyClient, setHistoryClient] = useState<{ id: string; name: string } | null>(null);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const [toast, setToast]             = useState<{ msg: string; ok: boolean } | null>(null);
  const [updatingId, setUpdatingId]   = useState<string | null>(null);
  const [savingCommentId, setSavingCommentId] = useState<string | null>(null);
  const [adminComments, setAdminComments] = useState<Record<string, string>>({});

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async (): Promise<OrderRequestRow[]> => {
    setLoading(true);
    const { data, error } = await supabase
      .from('order_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      const msg = error.message || '';
      if (
        msg.includes('does not exist') || msg.includes('schema cache') ||
        msg.includes('relation') || error.code === '42P01' || error.code === 'PGRST200'
      ) {
        setNoTable(true);
      } else {
        showToast(error.message, false);
      }
      setLoading(false);
      return [];
    } else {
      const nextRows = data as OrderRequestRow[];
      setRows(nextRows);
      setNoTable(false);
      setLoading(false);
      return nextRows;
    }
  }, []);

  useEffect(() => {
    const localComments = readLocalAdminComments();
    setAdminComments(Object.fromEntries(
      rows.map(row => [row.id, row.admin_comment || localComments[row.id] || ''])
    ));
  }, [rows]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel('admin-requests-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_requests' }, () => { load(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const updateStatus = async (id: string, status: Status) => {
    setUpdatingId(id);
    const { error } = await supabase.from('order_requests').update({ status }).eq('id', id);
    if (!error) {
      setRows(r => r.map(req => req.id === id ? { ...req, status } : req));
      showToast(t.requests.statusUpdated ?? 'Статус обновлён');
    } else {
      showToast(error.message, false);
    }
    setUpdatingId(null);
  };

  const deleteRequest = async (id: string) => {
    if (!confirm(t.requests.deleteConfirm ?? 'Удалить заявку?')) return;
    const { error } = await supabase.from('order_requests').delete().eq('id', id);
    if (error) { showToast(error.message, false); return; }
    setRows(r => r.filter(req => req.id !== id));
    if (expandedId === id) setExpandedId(null);
    showToast(t.requests.deleted ?? 'Заявка удалена');
  };

  const saveAdminComment = async (id: string) => {
    setSavingCommentId(id);
    const admin_comment = adminComments[id]?.trim() || null;
    const { error } = await supabase.from('order_requests').update({ admin_comment }).eq('id', id);
    if (error) {
      if (error.message.includes('admin_comment')) {
        const nextLocalComments = {
          ...readLocalAdminComments(),
          [id]: admin_comment || '',
        };
        writeLocalAdminComments(nextLocalComments);
        setRows(r => r.map(req => req.id === id ? { ...req, admin_comment } : req));
        showToast('Комментарий сохранён локально. Для Supabase нужно добавить колонку admin_comment.');
      } else {
        showToast(error.message, false);
      }
    } else {
      setRows(r => r.map(req => req.id === id ? { ...req, admin_comment } : req));
      showToast(t.requests.statusUpdated ?? 'Сохранено');
    }
    setSavingCommentId(null);
  };

  const showNewestRequests = async () => {
    dispatchClearAdminRequestUnread();
    const nextRows = await load();
    setHistoryClient(null);
    setStatusFilter('new');
    setExpandedId(nextRows.find(r => r.status === 'new')?.id ?? null);
  };

  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      r.client_name.toLowerCase().includes(q) ||
      (r.client_company || '').toLowerCase().includes(q) ||
      r.client_email.toLowerCase().includes(q) ||
      (r.client_phone || '').includes(q);
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus && (!historyClient || r.client_id === historyClient.id);
  });

  const historyRows = historyClient ? rows.filter(row => row.client_id === historyClient.id) : rows;
  const counts: Record<StatusFilter, number> = {
    all:         historyRows.length,
    new:         historyRows.filter(r => r.status === 'new').length,
    in_progress: historyRows.filter(r => r.status === 'in_progress').length,
    done:        historyRows.filter(r => r.status === 'done').length,
    cancelled:   historyRows.filter(r => r.status === 'cancelled').length,
  };

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen admin-canvas flex flex-col">

      {toast && (
        <div className={`fixed top-16 right-3 left-3 sm:left-auto sm:right-4 sm:w-72 z-50 px-4 py-3 text-xs flex items-center gap-2 shadow-lg ${toast.ok ? 'admin-solid admin-on-solid' : 'bg-red-600 admin-on-solid'}`}>
          {toast.ok ? <Check className="w-3.5 h-3.5 flex-shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />}
          {toast.msg}
        </div>
      )}

      <div className="admin-page-toolbar admin-surface border-b admin-border sticky top-12 z-20">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex items-center h-11 gap-2">
            <ShoppingCart className="w-4 h-4 admin-muted flex-shrink-0" />
            <span className="text-sm admin-ink flex-shrink-0">
              {t.requests.title}
            </span>
            <span className="text-[11px] admin-muted-surface admin-muted px-2 py-0.5 tabular-nums flex-shrink-0">
              {rows.length}
            </span>
            {counts.new > 0 && (
              <button
                onClick={showNewestRequests}
                className="inline-flex items-center self-center rounded border border-black bg-black text-white animate-pulse motion-reduce:animate-none px-2 text-[11px] leading-none tabular-nums flex-shrink-0 admin-hover-ink transition-colors"
                style={{ minHeight: 0, height: 24 }}
              >
                {counts.new} {t.requests.statusNew?.toLowerCase() ?? 'новых'}
              </button>
            )}
            <div className="flex-1" />
            <button
              onClick={load}
              disabled={loading}
              className="w-9 h-9 rounded flex items-center justify-center admin-muted admin-hover-ink hover:bg-gray-100 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="pb-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 admin-muted pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t.requests.searchPlaceholder ?? 'Поиск по клиенту, email, телефону…'}
                className="w-full h-8 pl-9 pr-8 text-xs border admin-border focus:outline-none admin-focus-border transition-colors admin-surface"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 admin-muted admin-hover-ink"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="admin-page-body max-w-[1200px] mx-auto w-full px-3 sm:px-6 lg:px-8 py-4 flex-1">

        {noTable && (
          <div className="mb-4 border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-amber-800 mb-1">
                  Таблица <code className="bg-amber-100 px-1">order_requests</code> не существует в Supabase.
                </p>
                <button
                  onClick={() => setShowSql(v => !v)}
                  className="text-xs text-amber-700 border border-amber-300 px-3 py-1.5 hover:bg-amber-100 transition-colors mb-2"
                >
                  {showSql ? 'Скрыть SQL' : 'Показать SQL'}
                </button>
                {showSql && (
                  <pre className="bg-amber-100/50 border border-amber-200 p-3 text-xs text-amber-900 overflow-x-auto leading-relaxed mt-1 whitespace-pre-wrap break-all">
                    {SQL_SETUP}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )}

        {historyClient && <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded border admin-border admin-surface px-3 py-2 text-sm">
          <span>{lang === 'ru' ? 'История заявок' : 'Istoricul cererilor'}: <strong>{historyClient.name}</strong> · {rows.filter(row => row.client_id === historyClient.id).length}</span>
          <button type="button" onClick={() => { setHistoryClient(null); setSearch(''); setStatusFilter('all'); }} className="inline-flex items-center gap-1 px-2 py-1 text-xs underline">
            <X className="w-3 h-3" />{lang === 'ru' ? 'Все заявки' : 'Toate cererile'}
          </button>
        </div>}

        {!noTable && (
          <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-0.5 scrollbar-none">
            {(['all', 'new', 'in_progress', 'done', 'cancelled'] as StatusFilter[]).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-[11px] border transition-colors ${
                  statusFilter === s
                    ? 'admin-solid admin-on-solid admin-border-strong'
                    : 'admin-surface admin-muted admin-border hover:border-gray-400 admin-hover-ink'
                }`}
              >
                {s !== 'all' && STATUS_CONFIG[s as Status].icon}
                <span className="whitespace-nowrap">
                  {s === 'all' ? (t.requests.filterAll ?? 'Все') : STATUS_CONFIG[s as Status].label}
                </span>
                <span className="tabular-nums text-xs opacity-60">{counts[s]}</span>
              </button>
            ))}
          </div>
        )}

        {!noTable && (
          loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="admin-surface border admin-border animate-pulse h-20 sm:h-[72px]" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="admin-surface border admin-border py-16 text-center">
              <ShoppingCart className="w-8 h-8 text-gray-200 mx-auto mb-3" />
              <p className="text-sm admin-muted">
                {search || statusFilter !== 'all'
                  ? (t.requests.nothingFound ?? 'Ничего не найдено')
                  : (t.requests.empty ?? 'Заявок пока нет')}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filtered.map(req => {
                const expanded = expandedId === req.id;
                const cfg = STATUS_CONFIG[req.status as Status] ?? STATUS_CONFIG.new;
                const items = Array.isArray(req.cart_items) ? req.cart_items : [];
                const clientComment = req.notes?.trim() || t.requests.noComment || '—';
                const adminComment = adminComments[req.id] ?? req.admin_comment ?? '';
                const isCommentChanged = adminComment !== (req.admin_comment || '');

                return (
                  <div
                    key={req.id}
                    className={`admin-surface border transition-all ${
                      expanded ? 'admin-border' : 'admin-border'
                    }`}
                  >

                    <div
                      className="relative flex flex-wrap sm:flex-nowrap items-stretch cursor-pointer"
                      onClick={() => setExpandedId(expanded ? null : req.id)}
                    >

                      <div className="w-full sm:w-auto sm:flex-1 min-w-0 px-3 pt-2.5 pb-1 sm:py-3 sm:px-4">

                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div onClick={event => event.stopPropagation()} className="relative inline-flex items-center rounded focus-within:ring-2 focus-within:ring-gray-400">
                            <span className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs leading-4 ${cfg.bg} ${cfg.text}`}>
                              {cfg.icon}<span>{cfg.label}</span>
                              {updatingId === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronDown className="w-3 h-3" />}
                            </span>
                            <select
                              aria-label={lang === 'ru' ? 'Изменить статус заявки' : 'Schimbă statutul cererii'}
                              value={req.status}
                              disabled={updatingId === req.id}
                              onChange={event => updateStatus(req.id, event.target.value as Status)}
                              className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                              style={{ minHeight: 0 }}
                            >
                              {(Object.keys(STATUS_CONFIG) as Status[]).map(status => <option key={status} value={status} className="bg-white text-black">{STATUS_CONFIG[status].label}</option>)}
                            </select>
                          </div>
                          <span className="text-xs admin-muted tabular-nums flex-shrink-0">
                            {fmtDate(req.created_at)}
                          </span>
                        </div>

                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium admin-ink truncate leading-snug">
                              {req.client_name}
                            </p>
                            {req.client_company && (
                              <p className="text-xs admin-muted truncate mt-0.5">
                                {req.client_company}
                              </p>
                            )}
                            <p className="text-xs admin-muted truncate mt-0.5">
                              {req.client_email}
                            </p>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-medium admin-ink tabular-nums leading-snug whitespace-nowrap">
                              {req.total_price.toLocaleString()}
                              <span className="text-xs admin-muted ml-0.5">MDL</span>
                            </p>
                            {items.length > 0 && (
                              <p className="text-xs admin-muted mt-0.5">
                                {items.length} {t.requests.items ?? 'поз.'}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div
                        className="w-full sm:w-auto flex items-center justify-end gap-1 px-2 pb-1 sm:py-1 sm:border-l admin-border"
                        onClick={e => e.stopPropagation()}
                      >
                        <a
                          href={`mailto:${req.client_email}`}
                          className="w-9 h-9 rounded flex items-center justify-center admin-muted admin-hover-ink hover:bg-gray-100 transition-colors"
                          aria-label={lang === 'ru' ? 'Написать клиенту' : 'Scrie clientului'}
                          title={lang === 'ru' ? 'Написать клиенту' : 'Scrie clientului'}
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </a>
                        {import.meta.env.VITE_NEXT_SSR && req.client_id && (
                          <button type="button" onClick={() => {
                            setHistoryClient({ id: req.client_id!, name: req.client_name });
                            setSearch('');
                            setStatusFilter('all');
                          }} className="w-9 h-9 rounded flex items-center justify-center admin-muted admin-hover-ink hover:bg-gray-100" aria-label={lang === 'ru' ? 'История заявок клиента' : 'Istoricul cererilor clientului'} title={lang === 'ru' ? 'Все заявки этого клиента' : 'Toate cererile acestui client'}>
                            <History className="w-4 h-4" />
                          </button>
                        )}
                        {req.client_phone && (
                          <a
                            href={`tel:${req.client_phone}`}
                            className="w-9 h-9 rounded flex items-center justify-center admin-muted admin-hover-ink hover:bg-gray-100 transition-colors"
                            aria-label={lang === 'ru' ? 'Позвонить клиенту' : 'Sună clientul'}
                            title={lang === 'ru' ? 'Позвонить клиенту' : 'Sună clientul'}
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {expanded && <button
                          type="button"
                          onClick={() => deleteRequest(req.id)}
                          aria-label={t.requests.delete ?? 'Удалить заявку'}
                          title={t.requests.delete ?? 'Удалить заявку'}
                          className="w-9 h-9 rounded flex items-center justify-center admin-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>}
                        <button
                          onClick={() => setExpandedId(expanded ? null : req.id)}
                          aria-expanded={expanded}
                          aria-label={lang === 'ru' ? (expanded ? 'Свернуть заявку' : 'Открыть заявку') : (expanded ? 'Restrânge cererea' : 'Deschide cererea')}
                          className="w-9 h-9 rounded flex items-center justify-center admin-muted admin-hover-ink hover:bg-gray-100 transition-colors"
                        >
                          {expanded
                            ? <ChevronUp className="w-3.5 h-3.5" />
                            : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {expanded && (
                      <div className="border-t admin-border admin-canvas">

                        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-2 sm:gap-4 p-2 sm:p-4">
                          <div className="min-w-0">                        {/* ── Cart items ── */}
                        <div className="sm:p-4">
                          <p className="text-xs admin-muted mb-1.5">
                            {t.requests.cartItems ?? 'Товары'} ({items.length})
                          </p>

                          {items.length === 0 ? (
                            <p className="text-xs admin-muted py-4 text-center">
                              {t.requests.noItems ?? 'Нет товаров'}
                            </p>
                          ) : (
                            <div className="space-y-1.5">
                              {items.map((item, idx) => (
                                <div key={idx} className="grid grid-cols-[72px_minmax(0,1fr)] sm:grid-cols-[88px_minmax(0,1fr)_auto] items-center gap-x-2 sm:gap-x-3 gap-y-1 admin-surface border admin-border p-2 sm:p-3">

                                  <div className="row-span-2 sm:row-span-1 w-[72px] h-[72px] sm:w-[88px] sm:h-[88px] flex-shrink-0 admin-canvas border admin-border flex items-center justify-center overflow-hidden">
                                    {item.image_url
                                      ? <img src={item.image_url} alt={item.name_ru || item.name_ro || ''} loading="lazy" className="w-full h-full object-contain" />
                                      : <Package className="w-3.5 h-3.5 admin-muted" />}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs sm:text-sm admin-ink leading-snug break-words">
                                      {lang === 'ru' ? item.name_ru || item.name_ro : item.name_ro || item.name_ru}
                                    </p>
                                    {item.sku && <p className="mt-1 text-xs admin-muted">{lang === 'ru' ? 'Артикул' : 'Cod'}: {item.sku}</p>}
                                  </div>

                                  <div className="col-start-2 sm:col-start-auto sm:text-right whitespace-nowrap">
                                    <p className="text-sm font-medium admin-ink tabular-nums">
                                      {(item.price * item.qty).toLocaleString()} MDL
                                    </p>
                                    <p className="text-xs admin-muted">
                                      {item.qty} × {item.price.toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              ))}

                              <div className="admin-solid admin-on-solid px-3 py-2.5 flex items-center justify-between">
                                <span className="text-xs  ">
                                  {t.requests.total ?? 'Итого'}
                                </span>
                                <span className="text-sm tabular-nums">
                                  {req.total_price.toLocaleString()} MDL
                                </span>
                              </div>
                            </div>
                          )}

                        </div>
                          </div>
                          <aside className="min-w-0">                        {/* ── Client + comments ── */}
                        <div className="p-3 sm:p-4 admin-surface border admin-border rounded-lg">
                          <div className="grid grid-cols-1 gap-3 sm:gap-4">
                            <div>
                              <p className="text-xs admin-muted mb-1.5">
                                {t.requests.client ?? 'Клиент'}
                              </p>
                              <div className="space-y-1.5">
                                <div className="hidden sm:block"><InfoRow icon={<User className="w-3 h-3" />} value={req.client_name} /></div>
                                <InfoRow icon={<Mail className="w-3 h-3" />} value={req.client_email} link={`mailto:${req.client_email}`} />
                                <InfoRow icon={<MapPin className="w-3 h-3" />} value={req.delivery_address || t.requests.noComment || '—'} />
                              </div>
                            </div>

                            <div>
                              <p className="text-xs admin-muted mb-1.5">
                                {t.requests.clientComment ?? 'Комментарий клиента'}
                              </p>
                              <div className="space-y-1.5">
                                {req.client_company && <InfoRow icon={<Building2 className="w-3 h-3" />} value={req.client_company} />}
                                <InfoRow icon={<Phone className="w-3 h-3" />} value={req.client_phone || t.requests.noComment || '—'} link={req.client_phone ? `tel:${req.client_phone}` : undefined} />
                                <InfoRow icon={<MessageSquare className="w-3 h-3" />} value={clientComment} multiline />
                              </div>
                            </div>

                            <div>
                              <p className="text-xs admin-muted mb-1.5">
                                {t.requests.adminComment ?? 'Комментарий администратора'}
                              </p>
                              <textarea
                                value={adminComment}
                                onChange={e => setAdminComments(prev => ({ ...prev, [req.id]: e.target.value }))}
                                placeholder={t.requests.adminCommentPlaceholder ?? 'Добавить комментарий...'}
                                rows={2}
                                className="w-full min-h-16 border admin-border admin-surface px-3 py-2 text-sm admin-ink placeholder:text-gray-300 leading-relaxed align-top focus:outline-none admin-focus-border transition-colors resize-y"
                              />
                              <div className="mt-2">
                                <button
                                  onClick={() => saveAdminComment(req.id)}
                                  disabled={savingCommentId === req.id || !isCommentChanged}
                                  className={`inline-flex items-center justify-center gap-2 px-3 py-2 text-xs   transition-colors ${
                                    savingCommentId === req.id || !isCommentChanged
                                      ? 'admin-muted-surface admin-muted border admin-border cursor-default'
                                      : 'admin-solid admin-on-solid admin-hover-solid'
                                  }`}
                                >
                                  {savingCommentId === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <SendHorizonal className="w-3.5 h-3.5" />}
                                  {lang === 'ru' ? 'Сохранить' : 'Salvează'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                          </aside>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon, value, link, multiline = false }: { icon: React.ReactNode; value: string; link?: string; multiline?: boolean }) {
  return (
    <div className={`flex gap-2 ${multiline ? 'items-start' : 'items-center'}`}>
      <span className={`admin-muted flex-shrink-0 ${multiline ? 'mt-0.5' : ''}`}>{icon}</span>
      {link
        ? <a href={link} className="text-sm admin-ink admin-hover-ink hover:underline break-words min-w-0">{value}</a>
        : <span className={`text-sm min-w-0 break-words admin-ink ${multiline ? 'leading-relaxed whitespace-pre-wrap' : ''}`}>{value}</span>}
    </div>
  );
}
