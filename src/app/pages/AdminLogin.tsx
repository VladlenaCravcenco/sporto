import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { loginAdmin, isAdminLoggedIn } from '../../lib/adminAuth';
import { Lock, Eye, EyeOff, AlertCircle, Mail } from 'lucide-react';
import { Logo } from '../components/Logo';
import { SeoHead } from '../components/SeoHead';

export function AdminLogin() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow]         = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  // Redirect if already authenticated as ADMIN (not just any Supabase session)
  useEffect(() => {
    isAdminLoggedIn().then((ok) => {
      if (ok) navigate('/admin', { replace: true });
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const err = await loginAdmin(email.trim(), password);
    if (err) {
      setError('Email sau parolă incorectă. Încearcă din nou.');
      setPassword('');
    } else {
      navigate('/admin', { replace: true });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
      <SeoHead title="Admin Login | Sporto" canonical="/admin/login" noIndex />

      {/* Grid pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid-admin" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0 L0 0 0 40" fill="none" stroke="#fff" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-admin)" />
      </svg>

      <div className="relative z-10 w-full max-w-sm">

        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Logo className="h-7 w-auto" color="#ffffff" />
        </div>

        {/* Card */}
        <div className="bg-white p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 bg-black flex items-center justify-center flex-shrink-0">
              <Lock className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm text-gray-900">Panou de administrare</h1>
              <p className="text-[11px] text-gray-400 mt-0.5">Sportosfera S.R.L. — acces restricționat</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-gray-400 mb-1.5 block">
                Email administrator
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  autoFocus
                  autoComplete="username"
                  className={`w-full h-10 pl-9 pr-3 text-sm border bg-white focus:outline-none transition-colors ${
                    error ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-black'
                  }`}
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-gray-400 mb-1.5 block">
                Parolă
              </label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  autoComplete="current-password"
                  className={`w-full h-10 pl-3 pr-10 text-sm border bg-white focus:outline-none transition-colors ${
                    error ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-black'
                  }`}
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShow(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                >
                  {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-1.5 mt-2">
                  <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                  <p className="text-[11px] text-red-500">{error}</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full h-10 bg-black text-white text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verificare...
                </span>
              ) : (
                'Intră în panou'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-gray-700 mt-6">
          Sesiunea este gestionată securizat prin Supabase Auth
        </p>
      </div>
    </div>
  );
}
