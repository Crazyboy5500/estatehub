import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  const columns = [
    {
      title: t('footer.company'),
      links: [
        { label: t('footer.about'), to: '/' },
        { label: t('footer.careers'), to: '/' },
        { label: t('footer.press'), to: '/' },
        { label: t('footer.blog'), to: '/' },
      ],
    },
    {
      title: t('footer.explore'),
      links: [
        { label: t('footer.buy'), to: '/properties?purpose=sale' },
        { label: t('footer.rent'), to: '/properties?purpose=rent' },
        { label: t('footer.compare'), to: '/compare' },
        { label: t('footer.post'), to: '/dashboard/add-property' },
      ],
    },
    {
      title: t('footer.support'),
      links: [
        { label: t('footer.help'), to: '/' },
        { label: t('footer.contact'), to: '/' },
        { label: t('footer.privacy'), to: '/' },
        { label: t('footer.terms'), to: '/' },
      ],
    },
  ];

  return (
    <footer className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="container-x py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2 text-xl font-extrabold text-primary-600">
              <span className="text-2xl">🏠</span> EstateHub
            </Link>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              {t('footer.tagline')}
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-900 dark:text-gray-100">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-sm text-gray-500 hover:text-primary-600 dark:text-gray-400">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-6 dark:border-gray-800 sm:flex-row">
          <p className="text-xs text-gray-500 dark:text-gray-400">© {new Date().getFullYear()} EstateHub. {t('footer.rights')}</p>
          <div className="flex gap-3">
            {['X', 'Facebook', 'Instagram', 'LinkedIn'].map((s) => (
              <a key={s} href="#" className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-primary-50 hover:text-primary-600 dark:bg-gray-800 dark:text-gray-300">
                {s}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}