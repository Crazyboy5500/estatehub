import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { PROPERTY_TYPES } from '../utils/format';
import { saveRecentSearch } from '../utils/recentSearches';

export default function SearchBar({ compact = false }: { compact?: boolean }) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const [purpose, setPurpose] = useState('sale');
  const [bedrooms, setBedrooms] = useState('');
  const navigate = useNavigate();
  const { t } = useTranslation();

  const submit = (e: FormEvent): void => {
    e.preventDefault();
    saveRecentSearch({ keyword: query, type, purpose, bedrooms });
    const params = new URLSearchParams();
    if (query) params.set('keyword', query);
    if (type) params.set('type', type);
    if (purpose) params.set('purpose', purpose);
    if (bedrooms) params.set('bedrooms', bedrooms);
    navigate(`/properties?${params.toString()}`);
  };

  if (compact) {
    return (
      <form onSubmit={submit} className="flex gap-2">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-10"
            placeholder={t('browse.searchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary">{t('browse.searchBtn')}</button>
      </form>
    );
  }

  return (
    <form onSubmit={submit} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label className="label">{t('browse.location')}</label>
        <input className="input" placeholder={t('browse.locationPlaceholder')} value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <div>
        <label className="label">{t('browse.purpose')}</label>
        <select className="input" value={purpose} onChange={(e) => setPurpose(e.target.value)}>
          <option value="sale">{t('browse.buy')}</option>
          <option value="rent">{t('browse.rent')}</option>
        </select>
      </div>
      <div>
        <label className="label">{t('browse.propertyType')}</label>
        <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">{t('common.any')}</option>
          {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label className="label">{t('browse.bedrooms')}</label>
        <select className="input" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)}>
          <option value="">{t('common.any')}</option>
          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{t('card.bhk', { count: n })}</option>)}
        </select>
      </div>
      <button type="submit" className="btn-primary sm:px-8">
        <MagnifyingGlassIcon className="h-5 w-5" /> {t('browse.searchBtn')}
      </button>
    </form>
  );
}