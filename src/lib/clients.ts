import { supabase } from './supabase';

export interface ClientDraft {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  address?: string;
  clientType?: 'individual' | 'company';
}

export type ClientConflict = 'email' | 'phone' | null;

export async function findClientConflict(emailInput: string, phoneInput: string): Promise<ClientConflict> {
  const email = emailInput.trim().toLowerCase();
  const phoneDigits = phoneInput.replace(/\D/g, '');

  const { data, error } = await supabase
    .from('clients')
    .select('email,phone');

  if (error) throw error;

  for (const client of data ?? []) {
    if (client.email?.trim().toLowerCase() === email) return 'email';
    if (phoneDigits && client.phone?.replace(/\D/g, '') === phoneDigits) return 'phone';
  }
  return null;
}

/**
 * Ensure a contact exists in public.clients for the given email.
 * We update an existing row if found; otherwise we create a new one.
 */
export async function ensureClientRecord(input: ClientDraft): Promise<void> {
  const email = input.email.trim().toLowerCase();
  if (!email) throw new Error('Client email is required');

  const payload = {
    name: input.name.trim(),
    company: input.company?.trim() || null,
    email,
    phone: input.phone?.trim() || null,
    address: input.address?.trim() || null,
    client_type: input.clientType || 'company',
  };

  const { data: existing, error: findError } = await supabase
    .from('clients')
    .select('id')
    .eq('email', email)
    .limit(1)
    .maybeSingle();

  if (findError) throw findError;

  if (existing?.id) {
    const { error: updateError } = await supabase
      .from('clients')
      .update(payload)
      .eq('id', existing.id);

    if (updateError) throw updateError;
    return;
  }

  const { error: insertError } = await supabase
    .from('clients')
    .insert(payload);

  if (!insertError) return;

  // A unique email index prevents duplicate contacts when two requests arrive together.
  if (insertError.code === '23505') {
    const { error: updateError } = await supabase
      .from('clients')
      .update(payload)
      .eq('email', email);
    if (!updateError) return;
  }

  throw insertError;
}
