// ─── Admin Authentication via Supabase Auth ───────────────────────────────────
// Regular site users ALSO use Supabase Auth after the migration.
// To distinguish admin from regular users we set a localStorage flag
// ONLY when loginAdmin() is called via /admin/login.

import { supabase } from './supabase';

const ADMIN_FLAG = 'sporto_admin_ok';
const ADMIN_EMAIL = (
  import.meta.env.VITE_ADMIN_LOGIN_EMAIL ||
  import.meta.env.VITE_ADMIN_EMAIL ||
  ''
).toLowerCase();

function isAllowedAdminEmail(email?: string | null) {
  return !!ADMIN_EMAIL && email?.toLowerCase() === ADMIN_EMAIL;
}

/** Sign in with email + password. Sets admin flag on success. Returns error message or null. */
export async function loginAdmin(email: string, password: string): Promise<string | null> {
  if (!ADMIN_EMAIL) {
    return 'Admin email is not configured. Contact the site owner.';
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail !== ADMIN_EMAIL) {
    return 'Email sau parolă incorectă.';
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
  if (error || !data.session) {
    return error?.message || 'Email sau parolă incorectă.';
  }

  if (!isAllowedAdminEmail(data.session.user.email)) {
    await supabase.auth.signOut();
    return 'Email sau parolă incorectă.';
  }

  // Mark this session as an admin session
  localStorage.setItem(ADMIN_FLAG, 'true');
  return null;
}

/**
 * Check if the current session belongs to an admin.
 * Conditions:
 *   1. The sporto_admin_ok flag is set in localStorage
 *   2. There is a live Supabase Auth session
 *   3. The session user email matches the configured admin email
 */
export async function isAdminLoggedIn(): Promise<boolean> {
  if (localStorage.getItem(ADMIN_FLAG) !== 'true') return false;
  const { data } = await supabase.auth.getSession();
  const email = data.session?.user.email;
  return !!data.session && isAllowedAdminEmail(email);
}

/** Sign out from Supabase and clear the admin flag. */
export async function logoutAdmin(): Promise<void> {
  localStorage.removeItem(ADMIN_FLAG);
  await supabase.auth.signOut();
}
