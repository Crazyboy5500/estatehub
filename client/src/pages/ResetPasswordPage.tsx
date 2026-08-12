import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authService } from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import { handleError } from '../services/api';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const { notify } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (password !== confirm) {
      notify(t('auth.passwordMismatch'), 'error');
      return;
    }
    setLoading(true);
    try {
      if (!token) throw new Error('Missing reset token');
      await authService.resetPassword(token, password);
      notify(t('notify.resetSuccess'));
      navigate('/login');
    } catch (error) {
      notify(handleError(error, t('notify.resetFailed')), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-x flex min-h-[70vh] items-center justify-center py-12">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-center">{t('auth.resetTitle')}</h1>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="label">{t('auth.newPassword')}</label>
            <input type="password" required minLength={6} className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div>
            <label className="label">{t('auth.confirmPassword')}</label>
            <input type="password" required minLength={6} className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? t('auth.updating') : t('auth.updatePassword')}
          </button>
        </form>
      </div>
    </div>
  );
}
