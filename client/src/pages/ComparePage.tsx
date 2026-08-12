import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PropertyCard from '../components/PropertyCard';
import { Spinner, EmptyState, SafeImg } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { propertyService, type PropertyFilters } from '../services/propertyService';
import { useLocalStorage } from '../hooks/useHooks';
import type { Property } from '../types';

export default function ComparePage() {
  const [candidates, setCandidates] = useState<Property[]>([]);
  const [compareList, setCompareList] = useLocalStorage<Property[]>('estatehub_compare', []);
  const [loading, setLoading] = useState(true);
  const { notify, catchError } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    propertyService
      .getProperties({ limit: 20, status: 'verified', sort: '-views' } as PropertyFilters)
      .then(({ data }) => setCandidates(data.data))
      .catch((err) => catchError(err, t('notify.loadCompare')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleCompare = (property: Property): void => {
    const exists = compareList.some((p) => p._id === property._id);
    if (exists) {
      setCompareList(compareList.filter((p) => p._id !== property._id));
    } else if (compareList.length < 2) {
      setCompareList([...compareList, property]);
      notify(t('compare.added', { title: property.title }));
    } else {
      notify(t('compare.limit'), 'info');
    }
  };

  const rows: { label: string; get: (p: Property) => string | number }[] = [
    { label: t('compare.price'), get: (p) => `₹${p.price?.toLocaleString('en-IN')}${p.purpose === 'rent' ? '/mo' : ''}` },
    { label: t('compare.type'), get: (p) => `${p.type} • ${p.purpose}` },
    { label: t('compare.area'), get: (p) => `${p.area} sq.ft` },
    { label: t('compare.bedrooms'), get: (p) => p.bedrooms || '-' },
    { label: t('browse.bathrooms'), get: (p) => p.bathrooms || '-' },
    { label: t('compare.parking'), get: (p) => p.parking || '-' },
    { label: t('compare.furnished'), get: (p) => p.furnished || '-' },
    { label: t('compare.age'), get: (p) => `${p.age || 0} yrs` },
    { label: t('compare.rating'), get: (p) => `${p.rating || 'New'} ★` },
    { label: t('compare.views'), get: (p) => p.views?.toLocaleString() || 0 },
    { label: t('compare.location'), get: (p) => `${p.city}, ${p.state}` },
  ];

  return (
    <div className="container-x py-10">
      <h1 className="text-3xl font-bold">{t('compare.title')}</h1>
      <p className="mt-1 text-gray-500">{t('compare.subtitle')}</p>

      {loading ? (
        <Spinner />
      ) : (
        <div className="mt-8">
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {candidates.map((p) => (
              <PropertyCard
                key={p._id}
                property={p}
                compareMode
                isCompared={compareList.some((c) => c._id === p._id)}
                onCompareToggle={toggleCompare}
              />
            ))}
          </div>

          {compareList.length === 2 && (
            <div className="card mt-10 overflow-x-auto p-6">
              <div className="grid min-w-[600px]" style={{ gridTemplateColumns: '200px 1fr 1fr' }}>
                <div />
                {compareList.map((p) => (
                  <div key={p._id} className="p-4">
                    <SafeImg src={p.images?.[0]} alt={p.title} className="h-40 w-full rounded-xl object-cover" />
                    <Link to={`/properties/${p._id}`} className="mt-3 block font-semibold hover:text-primary-600">{p.title}</Link>
                    <button onClick={() => toggleCompare(p)} className="mt-2 text-xs text-red-500 hover:underline">{t('compare.remove')}</button>
                  </div>
                ))}
                {rows.map((row) => (
                  <RowCell key={row.label} label={row.label} values={compareList.map(row.get)} />
                ))}
              </div>
            </div>
          )}

          {compareList.length > 0 && compareList.length < 2 && (
            <div className="mt-10 flex justify-center">
              <button onClick={() => setCompareList([])} className="btn-outline">{t('compare.clear')}</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const RowCell = ({ label, values }: { label: string; values: (string | number)[] }) => (
  <>
    <div className="border-t border-gray-100 p-4 text-sm font-semibold dark:border-gray-800">{label}</div>
    {values.map((v, i) => (
      <div key={i} className="border-t border-gray-100 p-4 text-sm dark:border-gray-800">{v}</div>
    ))}
  </>
);