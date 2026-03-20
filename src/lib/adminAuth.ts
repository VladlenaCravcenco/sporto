// ─── Admin Authentication via Supabase Auth ───────────────────────────────────
// Regular site users ALSO use Supabase Auth after the migration.
// To distinguish admin from regular users we set a localStorage flag
// ONLY when loginAdmin() is called via /admin/login.

import { supabase } from './supabase';

const ADMIN_FLAG = 'sporto_admin_ok';

/** Sign in with email + password. Sets admin flag on success. Returns error message or null. */
export async function loginAdmin(email: string, password: string): Promise<string | null> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return error.message;
  // Mark this session as an admin session
  localStorage.setItem(ADMIN_FLAG, 'true');
  return null;
}

/**
 * Check if the current session belongs to an admin.
 * Both conditions must be true:
 *   1. The sporto_admin_ok flag is set in localStorage
 *   2. There is a live Supabase Auth session
 */
export async function isAdminLoggedIn(): Promise<boolean> {
  if (localStorage.getItem(ADMIN_FLAG) !== 'true') return false;
  const { data } = await supabase.auth.getSession();
  return !!data.session;
}

/** Sign out from Supabase and clear the admin flag. */
export async function logoutAdmin(): Promise<void> {
  localStorage.removeItem(ADMIN_FLAG);
  await supabase.auth.signOut();
}
