import React, { createContext, useContext, useState, useEffect } from 'react';
import { SITE_URL, supabase } from '../../lib/supabase';
import { ensureClientRecord } from '../../lib/clients';

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
  login:         (email: string, password: string) => Promise<LoginResult>;
  register:      (data: RegisterData) => Promise<boolean | 'already_exists' | 'server_error'>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  logout:        () => Promise<void>;
}

export type LoginResult = 'success' | 'email_not_confirmed' | 'invalid_credentials' | 'error';

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
    const ADMIN_EMAIL = (
      import.meta.env.VITE_ADMIN_LOGIN_EMAIL ||
      import.meta.env.VITE_ADMIN_EMAIL ||
      ''
    ).toLowerCase();

    const isActualAdminSession = (email?: string | null) =>
      !!ADMIN_EMAIL && email?.toLowerCase() === ADMIN_EMAIL;

    supabase.auth.getSession().then(async ({ data }) => {
      const session = data.session;
      if (session && !isActualAdminSession(session.user.email)) {
        localStorage.removeItem(ADMIN_FLAG);
        const profile = await loadProfile(session.user.id, session.user.email ?? '');
        setUser(profile);
      }
      setLoading(false);
    });

    // Keep user state in sync with Supabase auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const actualAdmin = isActualAdminSession(session?.user.email);
      if (event === 'SIGNED_IN' && session && !actualAdmin) {
        localStorage.removeItem(ADMIN_FLAG);
        const profile = await loadProfile(session.user.id, session.user.email ?? '');
        setUser(profile);
      } else if (event === 'SIGNED_OUT' && !actualAdmin) {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = async (email: string, password: string): Promise<LoginResult> => {
    localStorage.removeItem('sporto_admin_ok');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) return 'email_not_confirmed';
      if (error.message.toLowerCase().includes('invalid login credentials')) return 'invalid_credentials';
      return 'error';
    }
    if (!data.user) return 'error';

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
    return 'success';
  };

  // ── Register ──────────────────────────────────────────────────────────────
  const register = async (data: RegisterData): Promise<boolean | 'already_exists' | 'server_error'> => {
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email:    data.email,
      password: data.password,
      options:  {
        emailRedirectTo: `${SITE_URL}/account`,
        data: {
          name: data.name,
          company: data.company,
          phone: data.phone,
          client_type: data.clientType || 'company',
        },
      },
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
    if (authData.user.identities?.length === 0) return 'already_exists';

    try {
      await ensureClientRecord({
        name: data.name,
        company: data.company,
        email: data.email,
        phone: data.phone,
        address: data.address,
        clientType: data.clientType,
      });
    } catch (clientError) {
      console.warn('[AuthContext] clients save failed:', clientError);
      return false;
    }

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
    if (authData.session) setUser(profile);

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
