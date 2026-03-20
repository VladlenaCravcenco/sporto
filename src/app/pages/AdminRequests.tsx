import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase, type OrderRequestRow } from '../../lib/supabase';
import {
  ShoppingCart, RefreshCw, Search, X, Check, Mail,
  Phone, Building2, AlertCircle, ChevronDown, ChevronUp,
  Package, Clock, CheckCircle, XCircle, Loader2,
  Trash2, MapPin, User,
} from 'lucide-react';
import { useAdminLang } from '../contexts/AdminLangContext';

const SQL_SETUP = `CREATE TABLE IF NOT EXISTS public.order_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  client_company text,
  client_email text NOT NULL,
  client_phone text,
  client_type text DEFAULT 'company',
  delivery_address text,
  notes text,
  cart_items jsonb DEFAULT '[]',
  total_price numeric DEFAULT 0,
  total_items integer DEFAULT 0,
  status text DEFAULT 'new',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.order_requests ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'order_requests' AND policyname = 'Allow all'
  ) THEN
    CREATE POLICY "Allow all" ON public.order_requests FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;`;

type Status = 'new' | 'in_progress' | 'done' | 'cancelled';
type StatusFilter = Status | 'all';

/* ─── status config is built in the component (needs t) ─── */

export function AdminRequests() {
  const { t } = useAdminLang();

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
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const [toast, setToast]             = useState<{ msg: string; ok: boolean } | null>(null);
  const [updatingId, setUpdatingId]   = useState<string | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
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
    } else {
      setRows(data as OrderRequestRow[]);
      setNoTable(false);
    }
    setLoading(false);
  }, []);

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
    await supabase.from('order_requests').delete().eq('id', id);
    setRows(r => r.filter(req => req.id !== id));
    if (expandedId === id) setExpandedId(null);
    showToast(t.requests.deleted ?? 'Заявка удалена');
  };

  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      r.client_name.toLowerCase().includes(q) ||
      (r.client_company || '').toLowerCase().includes(q) ||
      r.client_email.toLowerCase().includes(q) ||
      (r.client_phone || '').includes(q);
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts: Record<StatusFilter, number> = {
    all:         rows.length,
    new:         rows.filter(r => r.status === 'new').length,
    in_progress: rows.filter(r => r.status === 'in_progress').length,
    done:        rows.filter(r => r.status === 'done').length,
    cancelled:   rows.filter(r => r.status === 'cancelled').length,
  };

  /* ── Helpers ── */
  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed top-16 right-3 left-3 sm:left-auto sm:right-4 sm:w-72 z-50 px-4 py-3 text-xs flex items-center gap-2 shadow-lg ${toast.ok ? 'bg-black text-white' : 'bg-red-600 text-white'}`}>
          {toast.ok ? <Check className="w-3.5 h-3.5 flex-shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* ════════════════════════════════
          TOP BAR  
          ════════════════════════════════ */}
      <div className="bg-white border-b border-gray-100 sticky top-12 z-20">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">

          {/* Row 1: title + counts + refresh */}
          <div className="flex items-center h-11 gap-2">
            <ShoppingCart className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-900 flex-shrink-0">
              {t.requests.title}
            </span>
            <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 tabular-nums flex-shrink-0">
              {rows.length}
            </span>
            {counts.new > 0 && (
  <button
    onClick={() => setStatusFilter('new')}
    className="text-[11px] bg-black text-white px-2 py-0.5 tabular-nums animate-pulse flex-shrink-0 hover:bg-gray-800 transition-colors"
  >
    {counts.new} {t.requests.statusNew?.toLowerCase() ?? 'новых'}
  </button>
)}
            <div className="flex-1" />
            <button
              onClick={load}
              disabled={loading}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-black transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Row 2: search — full width on mobile */}
          <div className="pb-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t.requests.searchPlaceholder ?? 'Поиск по клиенту, email, телефону…'}
                className="w-full h-8 pl-9 pr-8 text-xs border border-gray-200 focus:outline-none focus:border-black transition-colors bg-white"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-black"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════
          CONTENT
          ════════════════════════════════ */}
      <div className="max-w-[1600px] mx-auto w-full px-3 sm:px-6 lg:px-8 py-4 flex-1">

        {/* SQL notice */}
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
                  <pre className="bg-amber-100/50 border border-amber-200 p-3 text-[10px] text-amber-900 overflow-x-auto leading-relaxed mt-1 whitespace-pre-wrap break-all">
                    {SQL_SETUP}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Status filter tabs ── */}
        {!noTable && (
          <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-0.5 scrollbar-none">
            {(['all', 'new', 'in_progress', 'done', 'cancelled'] as StatusFilter[]).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-[11px] border transition-colors ${
                  statusFilter === s
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-black'
                }`}
              >
                {s !== 'all' && STATUS_CONFIG[s as Status].icon}
                <span className="whitespace-nowrap">
                  {s === 'all' ? (t.requests.filterAll ?? 'Все') : STATUS_CONFIG[s as Status].label}
                </span>
                <span className="tabular-nums text-[10px] opacity-60">{counts[s]}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Cards list ── */}
        {!noTable && (
          loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white border border-gray-100 animate-pulse h-20 sm:h-[72px]" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white border border-gray-100 py-16 text-center">
              <ShoppingCart className="w-8 h-8 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">
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

                return (
                  <div
                    key={req.id}
                    className={`bg-white border transition-all ${
                      expanded ? 'border-gray-300' : 'border-gray-100'
                    }`}
                  >

                    {/* ─── Collapsed card row ─── */}
                    <div
                      className="flex items-stretch cursor-pointer"
                      onClick={() => setExpandedId(expanded ? null : req.id)}
                    >

                      {/* Left status stripe */}
                      <div className={`w-1 flex-shrink-0 ${cfg.bg}`} />

                      {/* Main content */}
                      <div className="flex-1 min-w-0 px-3 py-3 sm:px-4">

                        {/* Row 1: status + date */}
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 uppercase tracking-wide ${cfg.bg} ${cfg.text}`}>
                            {cfg.icon}
                            {cfg.label}
                          </span>
                          <span className="text-[10px] text-gray-400 tabular-nums flex-shrink-0">
                            {fmtDate(req.created_at)}
                          </span>
                        </div>

                        {/* Row 2: name + total */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-gray-900 truncate leading-snug">
                              {req.client_name}
                            </p>
                            {req.client_company && (
                              <p className="text-[10px] text-gray-400 truncate mt-0.5">
                                {req.client_company}
                              </p>
                            )}
                            <p className="text-[10px] text-gray-400 truncate mt-0.5">
                              {req.client_email}
                            </p>
                          </div>
                          {/* Price + item count */}
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm text-gray-900 tabular-nums leading-snug">
                              {req.total_price.toLocaleString()}
                              <span className="text-[10px] text-gray-400 ml-0.5">MDL</span>
                            </p>
                            {items.length > 0 && (
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                {items.length} {t.requests.items ?? 'поз.'}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: actions */}
                      <div
                        className="flex flex-col items-center justify-center gap-1 px-2 border-l border-gray-100"
                        onClick={e => e.stopPropagation()}
                      >
                        <a
                          href={`mailto:${req.client_email}`}
                          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-black transition-colors"
                          title={req.client_email}
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </a>
                        {req.client_phone && (
                          <a
                            href={`tel:${req.client_phone}`}
                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-black transition-colors"
                            title={req.client_phone}
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => setExpandedId(expanded ? null : req.id)}
                          className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-black transition-colors"
                        >
                          {expanded
                            ? <ChevronUp className="w-3.5 h-3.5" />
                            : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* ─── Expanded detail ─── */}
                    {expanded && (
                      <div className="border-t border-gray-100 bg-gray-50">

                        {/* ── Client info strip ── */}
                        <div className="px-3 sm:px-5 py-3 bg-white border-b border-gray-100">
                          <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-2">
                            {t.requests.client ?? 'Клиент'}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            <InfoRow icon={<User className="w-3 h-3" />}     value={req.client_name} />
                            <InfoRow icon={<Building2 className="w-3 h-3" />} value={req.client_company   || '—'} />
                            <InfoRow icon={<Mail className="w-3 h-3" />}     value={req.client_email}  link={`mailto:${req.client_email}`} />
                            <InfoRow icon={<Phone     className="w-3 h-3" />} value={req.client_phone     || '—'} link={req.client_phone ? `tel:${req.client_phone}` : undefined} />
                            <InfoRow icon={<MapPin    className="w-3 h-3" />} value={req.delivery_address || '—'} />
                          </div>
                        </div>

                        {/* ── Status changer ── */}
                        <div className="px-3 sm:px-5 py-3 border-b border-gray-100 bg-white">
                          <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-2">
                            {t.requests.status ?? 'Статус'}
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                            {(Object.keys(STATUS_CONFIG) as Status[]).map(s => {
                              const sc = STATUS_CONFIG[s];
                              const isCurrent = req.status === s;
                              return (
                                <button
                                  key={s}
                                  disabled={updatingId === req.id}
                                  onClick={() => updateStatus(req.id, s)}
                                  className={`flex items-center justify-center gap-1.5 px-2 py-2 text-[11px] border transition-all ${
                                    isCurrent
                                      ? `${sc.bg} ${sc.text} ${sc.border}`
                                      : 'border-gray-200 text-gray-500 hover:border-gray-400 hover:text-black bg-white'
                                  }`}
                                >
                                  {updatingId === req.id && !isCurrent
                                    ? <Loader2 className="w-3 h-3 animate-spin" />
                                    : sc.icon}
                                  <span className="truncate">{sc.label}</span>
                                  {isCurrent && <Check className="w-3 h-3 flex-shrink-0 ml-auto" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* ── Cart items ── */}
                        <div className="px-3 sm:px-5 py-3">
                          <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-2">
                            {t.requests.cartItems ?? 'Товары'} ({items.length})
                          </p>

                          {items.length === 0 ? (
                            <p className="text-xs text-gray-400 py-4 text-center">
                              {t.requests.noItems ?? 'Нет товаров'}
                            </p>
                          ) : (
                            <div className="space-y-1.5">
                              {items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2.5 bg-white border border-gray-100 px-3 py-2.5">
                                  {/* Thumb */}
                                  <div className="w-9 h-9 flex-shrink-0 bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
                                    {item.image_url
                                      ? <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                                      : <Package className="w-3.5 h-3.5 text-gray-300" />}
                                  </div>
                                  {/* Name + SKU */}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[11px] text-gray-900 leading-tight line-clamp-2">
                                      {item.name_ru || item.name_ro}
                                    </p>
                                    {item.sku && (
                                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                                        {item.sku}
                                      </p>
                                    )}
                                  </div>
                                  {/* Qty × price */}
                                  <div className="flex-shrink-0 text-right">
                                    <p className="text-[11px] text-gray-900 tabular-nums">
                                      {(item.price * item.qty).toLocaleString()} MDL
                                    </p>
                                    <p className="text-[10px] text-gray-400">
                                      {item.qty} × {item.price.toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              ))}

                              {/* Total row */}
                              <div className="bg-black text-white px-3 py-2.5 flex items-center justify-between">
                                <span className="text-[10px] uppercase tracking-widest">
                                  {t.requests.total ?? 'Итого'}
                                </span>
                                <span className="text-sm tabular-nums">
                                  {req.total_price.toLocaleString()} MDL
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Notes */}
                          {req.notes && (
                            <div className="mt-2 bg-white border border-gray-100 px-3 py-2.5">
                              <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-1">
                                {t.requests.notes ?? 'Примечание'}
                              </p>
                              <p className="text-[11px] text-gray-700 leading-relaxed">{req.notes}</p>
                            </div>
                          )}

                          {/* Delete */}
                          <button
                            onClick={() => deleteRequest(req.id)}
                            className="mt-3 w-full flex items-center justify-center gap-2 text-[11px] text-gray-400 hover:text-red-500 border border-gray-200 hover:border-red-200 py-2.5 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {t.requests.delete ?? 'Удалить заявку'}
                          </button>
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

function InfoRow({ icon, value, link }: { icon: React.ReactNode; value: string; link?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-400 flex-shrink-0">{icon}</span>
      {link
        ? <a href={link} className="text-[11px] text-gray-700 hover:text-black hover:underline truncate">{value}</a>
        : <span className="text-[11px] text-gray-700 truncate">{value}</span>}
    </div>
  );
}