'use client';

import { useSyncExternalStore } from 'react';
import type { User } from '@supabase/supabase-js';

const initial = { user: null as User | null, loading: true };
let state = initial;
let started = false;
const listeners = new Set<() => void>();
function publish(user: User | null) {
  state = { user, loading: false };
  listeners.forEach(listener => listener());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!started) {
    started = true;
    // Keep the auth SDK out of the initial public-page bundle.
    import('../../../lib/supabase/client').then(({ createClient }) => {
      const client = createClient();
      let revision = 0;
      client.auth.onAuthStateChange((_event, session) => {
        revision++;
        publish(session?.user ?? null);
      });
      const currentRevision = revision;
      client.auth.getUser().then(({ data, error }) => {
        if (revision === currentRevision) publish(error ? null : data.user);
      }).catch(() => { if (revision === currentRevision) publish(null); });
    }).catch(() => { started = false; publish(null); });
  }
  return () => { listeners.delete(listener); };
}
export function customerName(user: User | null): string {
  const metadata = user?.user_metadata;
  for (const value of [metadata?.full_name, metadata?.name, metadata?.given_name]) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}
export function useCustomerSession() {
  const snapshot = useSyncExternalStore(subscribe, () => state, () => initial);
  return { ...snapshot, name: customerName(snapshot.user) };
}
