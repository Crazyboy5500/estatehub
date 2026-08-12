import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authService } from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import { handleError } from '../services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { notify } = useAuth();
  const { t } = useTranslation();

  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
      notify(t('notify.resetSent'));
    } catch (error) {
      notify(handleError(error, t('notify.somethingWentWrong')), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-x flex min-h-[70vh] items-center justify-center py-12">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-center">{t('auth.forgotTitle')}</h1>
        <p className="mt-1 text-center text-sm text-gray-500">
          {sent ? t('auth.forgotSentDesc') : t('auth.forgotDesc')}
        </p>
        {!sent ? (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="label">{t('auth.email')}</label>
              <input type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? t('auth.sending') : t('auth.sendReset')}
            </button>
          </form>
        ) : (
          <Link to="/login" className="btn-primary mt-6 w-full">{t('auth.backToLogin')}</Link>
        )}
      </div>
    </div>
  );
}
