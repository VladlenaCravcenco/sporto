import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router';
import { useLanguage } from '../contexts/LanguageContext';
import { PhoneInput } from '../components/PhoneInput';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { SeoHead } from '../components/SeoHead';
import { UserCircle, Briefcase } from 'lucide-react';
import { toast } from 'sonner';

export function Register() {
  const { t, language } = useLanguage();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clientType, setClientType] = useState<'individual' | 'company'>('company');
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    password: '',
    phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try { 
      const result = await register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        company: clientType === 'company' ? formData.company : '',
        phone: formData.phone,
        clientType,
        language: language as 'ru' | 'ro',
      });
      if (result === true) {
        toast.success(isRo ? 'Cont creat cu succes!' : 'Аккаунт создан успешно!');
        navigate('/');
      } else if (result === 'already_exists') {
        toast.error(isRo
          ? 'Acest email este deja înregistrat. Autentifică-te sau resetează parola.'
          : 'Этот email уже зарегистрирован. Войдите или сбросьте пароль.');
      } else if (result === 'server_error') {
        toast.error(isRo
          ? 'Eroare de server. Vă rugăm să încercați din nou mai târziu.'
          : 'Ошибка сервера. Пожалуйста, попробуйте позже.');
      } else {
        toast.error(t('common.error'));
      }
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const isRo = language === 'ro';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <SeoHead title="Register | Sporto" canonical="/register" noIndex lang={language as 'ro' | 'ru'} />
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
              {t('auth.register.title')}
            </h1>
            <p className="text-sm text-gray-400">{t('auth.register.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* ── Тип клиента ── */}
            <div>
              <Label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">
                {isRo ? 'Tip client' : 'Тип клиента'}
              </Label>
              <div className="flex border border-gray-200 w-full">
                <button
                  type="button"
                  onClick={() => { setClientType('individual'); setFormData(p => ({ ...p, company: '' })); }}
                  className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 py-2.5 text-xs uppercase tracking-wider whitespace-normal break-words transition-colors ${
                    clientType === 'individual'
                      ? 'bg-black text-white'
                      : 'text-gray-500 hover:text-black hover:bg-gray-50'
                  }`}
                >
                  <UserCircle className="w-3.5 h-3.5" />
                  {isRo ? 'Persoană fizică' : 'Физ. лицо'}
                </button>
                <button
                  type="button"
                  onClick={() => setClientType('company')}
                  className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 py-2.5 text-xs uppercase tracking-wider whitespace-normal break-words border-l border-gray-200 transition-colors ${
                    clientType === 'company'
                      ? 'bg-black text-white'
                      : 'text-gray-500 hover:text-black hover:bg-gray-50'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  {isRo ? 'Persoană juridică' : 'Юр. лицо'}
                </button>
              </div>
            </div>

            {/* ── Имя ── */}
            <div>
              <Label htmlFor="name" className="text-xs text-gray-400 uppercase tracking-wider">
                {clientType === 'individual'
                  ? (isRo ? 'Nume și prenume' : 'Имя и фамилия')
                  : (isRo ? 'Persoana de contact' : 'Контактное лицо')}
              </Label>
              <Input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1.5"
              />
            </div>

            {/* ── Компания — только для юр. лица ── */}
            {clientType === 'company' && (
              <div>
                <Label htmlFor="company" className="text-xs text-gray-400 uppercase tracking-wider">
                  {t('auth.company')}
                </Label>
                <Input
                  id="company"
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="mt-1.5"
                  placeholder={isRo ? 'Fitness Club SRL' : 'Fitness Club SRL'}
                />
              </div>
            )}

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
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="phone" className="text-xs text-gray-400 uppercase tracking-wider">{t('auth.phone')}</Label>
              <PhoneInput
                id="phone"
                required
                value={formData.phone}
                onChange={(value) => setFormData({ ...formData, phone: value })}
                className="mt-1.5"
              />
            </div>

            <Button type="submit" className="w-full bg-gray-900 text-white hover:bg-gray-700" disabled={loading}>
              {loading ? t('common.loading') : t('auth.register.button')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              {t('auth.hasAccount')}{' '}
              <Link to="/login" className="text-gray-900 underline underline-offset-4">
                {t('nav.login')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
