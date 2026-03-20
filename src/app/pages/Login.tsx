import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

export function Login() {
  const { t, language } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const success = await login(formData.email, formData.password);
      if (success) {
        toast.success('Successfully logged in!');
        navigate('/');
      } else {
        toast.error(t('auth.error'));
      }
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white border border-gray-200 p-8">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-gray-900 flex items-center justify-center">
                <span className="text-white text-xs tracking-wider">SP</span>
              </div>
              <span className="text-gray-400 text-sm">SportPro</span>
            </div>
            <h1 className="text-2xl text-gray-900 mb-1">
              {t('auth.login.title')}
            </h1>
            <p className="text-sm text-gray-400">{t('auth.login.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email" className="text-xs text-gray-400 uppercase tracking-wider">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-xs text-gray-400 uppercase tracking-wider">{t('auth.password')}</Label>
              <Input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="mt-1.5"
              />
              <div className="mt-1.5 text-right">
                <Link to="/forgot-password" className="text-[10px] text-gray-400 hover:text-gray-900 underline underline-offset-4 transition-colors">
                  {language === 'ro' ? 'Ai uitat parola?' : 'Забыли пароль?'}
                </Link>
              </div>
            </div>

            <Button type="submit" className="w-full bg-gray-900 text-white hover:bg-gray-700" disabled={loading}>
              {loading ? t('common.loading') : t('auth.login.button')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              {t('auth.noAccount')}{' '}
              <Link to="/register" className="text-gray-900 underline underline-offset-4">
                {t('nav.register')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}