'use server';

import { createClient } from '@/lib/supabase/server';
import { getAdminEmail } from '@/lib/auth/server';

export async function signInAdmin(email: string, password: string) {
  const allowed = getAdminEmail();
  if (!allowed) return { error: 'Email администратора не настроен на сервере.' };
  if (typeof email !== 'string' || typeof password !== 'string' || email.trim().toLowerCase() !== allowed) {
    return { error: 'Неверный email или пароль.' };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error || !data.user || data.user.email?.toLowerCase() !== allowed) {
    if (data.session) await supabase.auth.signOut();
    return { error: 'Не удалось войти. Проверьте email и пароль.' };
  }
  return { success: true };
}
