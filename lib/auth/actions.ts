'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string, redirectUrl?: string) {
  const supabase = await createClient();

  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  if (data?.user) {
    // Redirect to dashboard or specified URL
    redirect(redirectUrl || '/ro/account');
  }

  return { error: 'Unknown error' };
}

/**
 * Sign up new user
 */
export async function signUp(email: string, password: string, redirectUrl?: string) {
  const supabase = await createClient();

  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.sporto.md'}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data?.user) {
    return {
      success: true,
      message: 'Check your email to confirm your account',
    };
  }

  return { error: 'Failed to create account' };
}

/**
 * Sign out current user
 */
export async function signOut(redirectUrl?: string) {
  const supabase = await createClient();

  await supabase.auth.signOut();

  redirect(redirectUrl || '/ro');
}

/**
 * Request password reset email
 */
export async function requestPasswordReset(email: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.sporto.md'}/auth/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return {
    success: true,
    message: 'Check your email for password reset instructions',
  };
}

/**
 * Update password with reset token
 */
export async function updatePassword(newPassword: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

/**
 * Get current session
 */
export async function getSession() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    return null;
  }

  return data.session;
}

/**
 * Get current user
 */
export async function getUser() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return data.user;
}
