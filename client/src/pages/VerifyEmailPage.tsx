import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authService } from '../services/authService';
import { useAuth } from '../hooks/useAuth';

export default function VerifyEmailPage() {
  const { token } = useParams();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const { notify } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    if (!token) return;
    authService
      .verifyEmail(token)
      .then(() => {
        setStatus('success');
        notify(t('notify.emailVerified'));
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.message || t('notify.verifyFailed'));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="container-x flex min-h-[70vh] items-center justify-center py-12">
      <div className="card w-full max-w-md p-8 text-center">
        <div className="text-5xl">
          {status === 'verifying' ? '⏳' : status === 'success' ? '✅' : '❌'}
        </div>
        <h1 className="mt-4 text-xl font-bold">
          {status === 'verifying' ? t('auth.verifyTitleVerifying') : status === 'success' ? t('auth.verifyTitleSuccess') : t('auth.verifyTitleFailed')}
        </h1>
        <p className="mt-2 text-sm text-gray-500">{message || t('auth.verifyDescSuccess')}</p>
        <Link to="/login" className="btn-primary mt-6 w-full">{t('auth.continueToLogin')}</Link>
      </div>
    </div>
  );
}