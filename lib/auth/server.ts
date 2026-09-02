import { createClient } from './supabase/server';

/**
 * Get the current admin user
 * Returns the user object if authenticated and email matches ADMIN_EMAIL
 * Otherwise returns null
 */
export async function getAdminUser() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Check if user email matches admin email from environment
  const adminEmail = process.env.VITE_ADMIN_LOGIN_EMAIL || 'sporto-admin@gmail.com';
  
  if (user.email === adminEmail) {
    return user;
  }

  return null;
}

/**
 * Verify admin access for a request
 * Throws error if user is not authenticated or not admin
 */
export async function requireAdmin() {
  const adminUser = await getAdminUser();

  if (!adminUser) {
    throw new Error('Unauthorized: Admin access required');
  }

  return adminUser;
}

/**
 * Get current authenticated user (any role)
 */
export async function getCurrentUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}
