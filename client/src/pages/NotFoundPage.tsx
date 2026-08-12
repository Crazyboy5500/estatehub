import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="container-x flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="text-8xl font-extrabold text-primary-600">404</p>
      <h1 className="mt-4 text-2xl font-bold">{t('notfound.title')}</h1>
      <p className="mt-2 text-gray-500">{t('notfound.subtitle')}</p>
      <Link to="/" className="btn-primary mt-6">{t('notfound.backHome')}</Link>
    </div>
  );
}