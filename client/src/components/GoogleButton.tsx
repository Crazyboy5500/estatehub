import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

const GSI_SCRIPT = 'https://accounts.google.com/gsi/client';

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleAccounts {
  id: {
    initialize: (options: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void;
    renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
  };
}

declare global {
  interface Window {
    google?: { accounts: GoogleAccounts };
  }
}

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts) return resolve();
    const existing = document.querySelector(`script[src="${GSI_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Google SDK')));
      return;
    }
    const s = document.createElement('script');
    s.src = GSI_SCRIPT;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Google SDK'));
    document.head.appendChild(s);
  });
}

export default function GoogleButton({ label }: { label?: string }) {
  const { googleLogin, notify, catchError } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const defaultLabel = t('auth.googleContinue');
  const [clientId, setClientId] = useState('');
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const renderedRef = useRef(false);

  useEffect(() => {
    api
      .get('/config')
      .then(({ data }) => setClientId(data.googleClientId || ''))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!clientId || !containerRef.current || renderedRef.current) return;
    let cancelled = false;
    const el = containerRef.current;
    setLoading(true);
    loadScript()
      .then(() => {
        if (cancelled || !window.google?.accounts) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            try {
              const user = await googleLogin(response.credential);
              notify(t('notify.welcome', { name: user.name }));
              navigate(user.role === 'admin' ? '/admin' : user.role === 'owner' ? '/dashboard/owner' : '/dashboard/buyer');
            } catch (error) {
              catchError(error, t('notify.googleLoginFailed'));
            }
          },
        });
        window.google.accounts.id.renderButton(el, {
          theme: 'outline',
          size: 'large',
          width: el.offsetWidth || 360,
          text: 'continue_with',
          shape: 'pill',
        });
        renderedRef.current = true;
      })
      .catch((err) => catchError(err, t('notify.googleLoadFailed')))
      .finally(() => setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  if (loading) {
    return (
      <button type="button" disabled className="btn-outline w-full opacity-60">
        {t('auth.googleLoading')}
      </button>
    );
  }

  if (!clientId) {
    return (
      <button
        type="button"
        disabled
        className="btn-outline w-full opacity-60"
        title="Set GOOGLE_CLIENT_ID on the server to enable"
      >
        <span className="mr-2 font-semibold">G</span>
        {label || defaultLabel} <span className="ml-1 text-xs text-gray-400">{t('auth.googleNotConfigured')}</span>
      </button>
    );
  }

  return (
    <div>
      <div ref={containerRef} className="flex justify-center" />
      <p className="mt-1 text-center text-[10px] text-gray-400">{t('auth.googleOneTap')}</p>
    </div>
  );
}