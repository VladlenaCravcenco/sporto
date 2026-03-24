import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

export interface NewRequestNotification {
  id: string;
  client_name: string;
  total_price?: number;
  created_at: string;
}

// ── Sound ─────────────────────────────────────────────────────────────────────
// AudioContext must be created / resumed AFTER a user gesture (Chrome policy).
// We create it lazily on first click, then reuse it forever.
let _audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  try {
    if (!_audioCtx) _audioCtx = new AudioContext();
    return _audioCtx;
  } catch {
    return null;
  }
}

// Call this once on any user gesture so Chrome unlocks the audio
export function unlockAudio() {
  const ctx = getAudioCtx();
  if (ctx && ctx.state === 'suspended') ctx.resume();
}

export async function playNotificationSound() {
  const ctx = getAudioCtx();
  if (!ctx) return;

  // Make sure context is running (Chrome requires resume after user gesture)
  if (ctx.state === 'suspended') {
    try { await ctx.resume(); } catch { return; }
  }

  // Two-tone ding-dong
  const tones = [
    { freq: 880,  delay: 0,    dur: 0.22 },
    { freq: 1100, delay: 0.28, dur: 0.28 },
  ];

  tones.forEach(({ freq, delay, dur }) => {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    gain.gain.setValueAtTime(0,    ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + delay + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + dur + 0.05);
  });
}

// ── Browser OS notification ───────────────────────────────────────────────────
function showBrowserNotification(req: NewRequestNotification) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const amount = req.total_price
    ? ` · ${req.total_price.toLocaleString('ru-RU')} MDL`
    : '';
  try {
    new Notification('📦 Новая заявка — SPORTOSFERA', {
      body: `${req.client_name}${amount}`,
      icon: '/favicon.ico',
      tag: `order-${req.id}`,
    });
  } catch { /* safari may throw */ }
}

// ── Main hook ─────────────────────────────────────────────────────────────────
export function useAdminNotifications() {
  const [unreadCount, setUnreadCount]   = useState(0);
  const [latestRequest, setLatestRequest] = useState<NewRequestNotification | null>(null);

  // Watermark: the created_at of the newest request already in DB when admin logged in.
  // We fetch it from Supabase on init — no client-clock skew issues.
  const lastSeenAt    = useRef<string | null>(null); // null = not yet initialised
  const notifiedIds   = useRef<Set<string>>(new Set());
  const pollRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialised   = useRef(false);

  // ── Fire one notification ─────────────────────────────────────────────────
  const handleNewRequest = useCallback((row: any) => {
    if (!row?.id) return;
    if (notifiedIds.current.has(row.id)) return;
    notifiedIds.current.add(row.id);

    if (!lastSeenAt.current || row.created_at > lastSeenAt.current) {
      lastSeenAt.current = row.created_at;
    }

    const notif: NewRequestNotification = {
      id:          row.id,
      client_name: row.client_name || 'Новый клиент',
      total_price: row.total_price,
      created_at:  row.created_at,
    };

    setLatestRequest(notif);
    setUnreadCount(c => c + 1);
    playNotificationSound();
    showBrowserNotification(notif);
  }, []);

  // ── Poll Supabase for requests newer than watermark ───────────────────────
  const poll = useCallback(async () => {
    if (!lastSeenAt.current) return; // not yet initialised — skip
    try {
      const { data } = await supabase
        .from('order_requests')
        .select('id, client_name, total_price, created_at')
        .gt('created_at', lastSeenAt.current)
        .order('created_at', { ascending: true });

      if (data && data.length > 0) {
        data.forEach(handleNewRequest);
      }
    } catch { /* network/table error — silently skip */ }
  }, [handleNewRequest]);

  // ── Init: fetch latest existing request to set watermark ─────────────────
  const init = useCallback(async () => {
    if (initialised.current) return;
    initialised.current = true;

    try {
      const { data } = await supabase
        .from('order_requests')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1);

      // Watermark = latest existing request OR now (if table is empty)
      lastSeenAt.current = data?.[0]?.created_at ?? new Date().toISOString();
    } catch {
      lastSeenAt.current = new Date().toISOString();
    }

    // Ask for browser notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Start polling every 10 seconds
    pollRef.current = setInterval(poll, 10_000);

    // Supabase Realtime as instant bonus layer
    // (requires: Supabase Dashboard → Database → Replication → enable order_requests)
    supabase
      .channel('admin-order-inserts')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'order_requests' },
        (payload) => handleNewRequest(payload.new)
      )
      .subscribe();
  }, [poll, handleNewRequest]);

  useEffect(() => {
    init();

    // Unlock AudioContext on first user interaction in admin
    document.addEventListener('click', unlockAudio, { once: true });

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      document.removeEventListener('click', unlockAudio);
      supabase.removeChannel(supabase.channel('admin-order-inserts'));
    };
  }, [init]);

  const clearUnread = useCallback(() => setUnreadCount(0), []);

  return { unreadCount, latestRequest, clearUnread };
}
