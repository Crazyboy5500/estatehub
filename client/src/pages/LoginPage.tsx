import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import GoogleButton from '../components/GoogleButton';
import { handleError } from '../services/api';

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginPage() {
  const { register, handleSubmit } = useForm<LoginFormData>();
  const [loading, setLoading] = useState(false);
  const { login, notify } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '';

  const onSubmit = async (data: LoginFormData): Promise<void> => {
    setLoading(true);
    try {
      const user = await login(data.email, data.password);
      notify(t('notify.welcomeBack', { name: user.name }));
      if (redirect) navigate(redirect);
      else if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'owner') navigate('/dashboard/owner');
      else navigate('/dashboard/buyer');
    } catch (error) {
      notify(handleError(error, t('notify.loginFailed')), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-x flex min-h-[70vh] items-center justify-center py-12">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-center">{t('auth.loginTitle')}</h1>
        <p className="mt-1 text-center text-sm text-gray-500">{t('auth.loginSubtitle')}</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label className="label">{t('auth.email')}</label>
            <input type="email" className="input" placeholder="you@example.com" {...register('email', { required: true })} />
          </div>
          <div>
            <label className="label">{t('auth.password')}</label>
            <input type="password" className="input" placeholder="••••••••" {...register('password', { required: true })} />
          </div>
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <input type="checkbox" className="h-4 w-4 rounded" /> {t('auth.rememberMe')}
            </label>
            <Link to="/forgot-password" className="text-primary-600 hover:underline">{t('auth.forgotPassword')}</Link>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? t('auth.loggingIn') : t('auth.login')}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-gray-400">
          <hr className="flex-1" /> {t('auth.or')} <hr className="flex-1" />
        </div>
        <GoogleButton />

        <p className="mt-6 text-center text-sm text-gray-500">
          {t('auth.noAccount')} <Link to="/register" className="font-semibold text-primary-600 hover:underline">{t('auth.registerLink')}</Link>
        </p>
        <p className="mt-3 text-center text-xs text-gray-400">
          {t('auth.demoAccounts')}
        </p>
      </div>
    </div>
  );
}
