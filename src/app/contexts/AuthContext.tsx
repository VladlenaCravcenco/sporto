import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { sendWelcomeEmail } from '../../lib/emailService';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  company: string;
  phone: string;
  address?: string;
  clientType?: 'individual' | 'company';
  emailVerified?: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login:         (email: string, password: string) => Promise<boolean>;
  register:      (data: RegisterData) => Promise<boolean | 'already_exists' | 'server_error'>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  logout:        () => Promise<void>;
}

export interface RegisterData {
  email:       string;
  password:    string;
  name:        string;
  company:     string;
  phone:       string;
  address?:    string;
  clientType?: 'individual' | 'company';
  language?:   'ru' | 'ro';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Load a user profile from public.clients by Supabase Auth user id. */
async function loadProfile(userId: string, email: string): Promise<UserProfile | null> {
  const { data } = await supabase
    .from('clients')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (!data) return null;

  return {
    id:            userId,
    email:         data.email,
    name:          data.name        ?? '',
    company:       data.company     ?? '',
    phone:         data.phone       ?? '',
    address:       data.address     ?? '',
    clientType:    (data.client_type as 'individual' | 'company') ?? 'company',
    emailVerified: true,
  };
}

// ── Provider ───────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<UserProfile | null>(null);
  const [isLoading, setLoading] = useState(true);

  // On mount: restore session if Supabase has one (but NOT if it's an admin session)
  useEffect(() => {
    const ADMIN_FLAG = 'sporto_admin_ok';

    supabase.auth.getSession().then(async ({ data }) => {
      const session = data.session;
      // If session belongs to admin, don't hijack it for the public user context
      if (session && localStorage.getItem(ADMIN_FLAG) !== 'true') {
        const profile = await loadProfile(session.user.id, session.user.email ?? '');
        setUser(profile);
      }
      setLoading(false);
    });

    // Keep user state in sync with Supabase auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const ADMIN = localStorage.getItem(ADMIN_FLAG) === 'true';
      if (event === 'SIGNED_IN' && session && !ADMIN) {
        const profile = await loadProfile(session.user.id, session.user.email ?? '');
        setUser(profile);
      } else if (event === 'SIGNED_OUT' && !ADMIN) {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = async (email: string, password: string): Promise<boolean> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) return false;

    const profile = await loadProfile(data.user.id, email);
    if (profile) {
      setUser(profile);
    } else {
      setUser({
        id:      data.user.id,
        email,
        name:    email.split('@')[0],
        company: '',
        phone:   '',
      });
    }
    return true;
  };

  // ── Register ──────────────────────────────────────────────────────────────
  const register = async (data: RegisterData): Promise<boolean | 'already_exists' | 'server_error'> => {
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email:    data.email,
      password: data.password,
      options:  { data: { name: data.name } },
    });

    if (signUpError) {
      if (
        signUpError.message.toLowerCase().includes('already registered') ||
        signUpError.message.toLowerCase().includes('already been registered') ||
        signUpError.message.toLowerCase().includes('user already registered') ||
        signUpError.status === 422 || signUpError.status === 400
      ) {
        return 'already_exists';
      }
      // 500 — проблема на стороне Supabase (SMTP и т.д.)
      if (signUpError.status === 500) {
        return 'server_error';
      }
      return false;
    }

    if (!authData.user) return false;

    // Сохраняем профиль в public.clients
    supabase.from('clients').insert({
      name:        data.name,
      company:     data.company    || null,
      email:       data.email,
      phone:       data.phone      || null,
      address:     data.address    || null,
      client_type: data.clientType || 'company',
      notes:       null,
    }).then(({ error: insertError }) => {
      if (insertError) console.warn('[AuthContext] clients insert failed:', insertError.message);
    });

    const profile: UserProfile = {
      id:            authData.user.id,
      email:         data.email,
      name:          data.name,
      company:       data.company  ?? '',
      phone:         data.phone    ?? '',
      address:       data.address  ?? '',
      clientType:    data.clientType || 'company',
      emailVerified: false,
    };
    setUser(profile);

    const verificationToken = crypto.randomUUID().replace(/-/g, '');
    const verificationLink  = `${window.location.origin}/verify?token=${verificationToken}`;
    sendWelcomeEmail({
      email:            data.email,
      name:             data.name,
      verificationLink,
      language:         (data.language as 'ru' | 'ro') || 'ru',
    });

    return true;
  };

  // ── Update profile ────────────────────────────────────────────────────────
  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);

    // Persist to Supabase
    await supabase
      .from('clients')
      .update({
        name:        updated.name,
        company:     updated.company  || null,
        phone:       updated.phone    || null,
        address:     updated.address  || null,
        client_type: updated.clientType || 'company',
      })
      .eq('email', user.email);
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = async () => {
    setUser(null);
    // Only sign out Supabase if NOT an admin session (admin has its own logout)
    if (localStorage.getItem('sporto_admin_ok') !== 'true') {
      await supabase.auth.signOut();
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      updateProfile,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
