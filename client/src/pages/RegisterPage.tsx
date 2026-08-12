import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { handleError } from '../services/api';

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: 'buyer' | 'owner';
  confirm?: string;
}

export default function RegisterPage() {
  const { register, handleSubmit, watch } = useForm<RegisterFormData>();
  const [loading, setLoading] = useState(false);
  const { register: registerUser, notify } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get('role') === 'owner' ? 'owner' : 'buyer';

  const onSubmit = async (data: RegisterFormData): Promise<void> => {
    setLoading(true);
    try {
      const user = await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        role: data.role,
      });
      notify(t('notify.accountCreated'));
      if (user.role === 'owner') navigate('/dashboard/owner');
      else navigate('/dashboard/buyer');
    } catch (error) {
      notify(handleError(error, t('notify.regFailed')), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-x flex min-h-[70vh] items-center justify-center py-12">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-center">{t('auth.registerTitle')}</h1>
        <p className="mt-1 text-center text-sm text-gray-500">{t('auth.registerSubtitle')}</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label className="label">{t('auth.fullName')}</label>
            <input className="input" placeholder="Rahul Sharma" {...register('name', { required: true })} />
          </div>
          <div>
            <label className="label">{t('auth.email')}</label>
            <input type="email" className="input" placeholder="you@example.com" {...register('email', { required: true })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t('auth.phone')}</label>
              <input className="input" placeholder="+91 98xxxxxx" {...register('phone')} />
            </div>
            <div>
              <label className="label">{t('auth.role')}</label>
              <select className="input" defaultValue={defaultRole} {...register('role')}>
                <option value="buyer">{t('auth.buyerTenant')}</option>
                <option value="owner">{t('auth.ownerAgent')}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">{t('auth.password')}</label>
            <input type="password" className="input" placeholder={t('auth.passwordHint')} {...register('password', { required: true, minLength: 6 })} />
          </div>
          <div>
            <label className="label">{t('auth.confirmPassword')}</label>
            <input
              type="password"
              className="input"
              placeholder={t('auth.repeatPassword')}
              {...register('confirm', {
                validate: (value) => value === watch('password') || t('auth.passwordMismatch'),
              })}
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? t('auth.creatingAccount') : t('auth.createAccount')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          {t('auth.haveAccount')} <Link to="/login" className="font-semibold text-primary-600 hover:underline">{t('auth.loginLink')}</Link>
        </p>
      </div>
    </div>
  );
}
