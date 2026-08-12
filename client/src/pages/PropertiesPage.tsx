import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SearchBar from '../components/SearchBar';
import PropertyCard from '../components/PropertyCard';
import { Spinner, EmptyState } from '../components/ui';
import { propertyService, type PropertyFilters } from '../services/propertyService';
import { handleError } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useDebounce, useDocumentTitle, useInfiniteScroll } from '../hooks/useHooks';
import { PROPERTY_TYPES, CITIES_INDIA } from '../utils/format';
import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import type { Property } from '../types';
import type { ChangeEvent } from 'react';

export default function PropertiesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { notify } = useAuth();
  const { t } = useTranslation();

  useDocumentTitle(t('browse.title'));

  const [properties, setProperties] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const keyword = searchParams.get('keyword') || '';
  const debouncedKeyword = useDebounce(keyword, 400);

  const filters: PropertyFilters = {
    keyword: debouncedKeyword,
    city: searchParams.get('city') || '',
    type: searchParams.get('type') || '',
    purpose: searchParams.get('purpose') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    bedrooms: searchParams.get('bedrooms') || '',
    bathrooms: searchParams.get('bathrooms') || '',
    minArea: searchParams.get('minArea') || '',
    maxArea: searchParams.get('maxArea') || '',
    featured: searchParams.get('featured') === 'true',
    sort: searchParams.get('sort') || '-createdAt',
    status: 'verified',
    limit: 12,
    page,
  };

  const fetchPage = useCallback(
    async (pageNum: number, append = false): Promise<void> => {
      const request = { ...filters, page: pageNum };
      try {
        const { data } = await propertyService.getProperties(request);
        setProperties((prev) => {
          if (!append) return data.data;
          const seen = new Set(prev.map((p: Property) => p._id));
          return [...prev, ...data.data.filter((p: Property) => !seen.has(p._id))];
        });
        setTotal(data.total);
        setPages(data.pages);
        setPage(pageNum);
      } catch (error) {
        notify(handleError(error, t('notify.loadProperties')), 'error');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filters, notify, t]
  );

  useEffect(() => {
    setLoading(true);
    setProperties([]);
    void fetchPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedKeyword, searchParams]);

  const loadMore = useCallback(() => {
    if (page < pages && !loadingMore) {
      setLoadingMore(true);
      void fetchPage(page + 1, true);
    }
  }, [page, pages, loadingMore, fetchPage]);

  useInfiniteScroll(page < pages, loadingMore || loading, loadMore);

  const setParam = (key: string, value: string): void => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  const clearAll = (): void => setSearchParams({});

  const inputProps = (key: keyof PropertyFilters) => ({
    value: String(filters[key] ?? ''),
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setParam(key, e.target.value),
  });

  return (
    <div className="container-x py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">{t('browse.title')}</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          {loading ? t('browse.searching') : t('browse.found', { total: total.toLocaleString('en-IN') })}
        </p>
      </div>

      <div className="mb-6"><SearchBar compact /></div>

      <button
        onClick={() => setShowFilters(!showFilters)}
        className="btn-outline mb-4 lg:hidden"
      >
        <AdjustmentsHorizontalIcon className="h-5 w-5" /> {t('browse.filters')}
      </button>

      <div className="flex gap-6">
        <aside className={`${showFilters ? 'block' : 'hidden'} w-64 shrink-0 lg:block`}>
          <div className="card sticky top-20 space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{t('browse.filters')}</h3>
              <button onClick={clearAll} className="text-xs text-primary-600 hover:underline">{t('common.clearAll')}</button>
            </div>

            <div>
              <label className="label">{t('browse.city')}</label>
              <select className="input" {...inputProps('city')}>
                <option value="">{t('browse.allCities')}</option>
                {CITIES_INDIA.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="label">{t('browse.purpose')}</label>
              <select className="input" {...inputProps('purpose')}>
                <option value="">{t('common.any')}</option>
                <option value="sale">{t('browse.buy')}</option>
                <option value="rent">{t('browse.rent')}</option>
              </select>
            </div>

            <div>
              <label className="label">{t('browse.propertyType')}</label>
              <select className="input" {...inputProps('type')}>
                <option value="">{t('common.any')}</option>
                {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">{t('browse.minPrice')}</label>
                <input type="number" className="input" placeholder="₹" {...inputProps('minPrice')} />
              </div>
              <div>
                <label className="label">{t('browse.maxPrice')}</label>
                <input type="number" className="input" placeholder="₹" {...inputProps('maxPrice')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">{t('browse.bedrooms')}</label>
                <select className="input" {...inputProps('bedrooms')}>
                  <option value="">{t('common.any')}</option>
                  {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{t('card.bhk', { count: n })}</option>)}
                </select>
              </div>
              <div>
                <label className="label">{t('browse.bathrooms')}</label>
                <select className="input" {...inputProps('bathrooms')}>
                  <option value="">{t('common.any')}</option>
                  {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="label">{t('browse.sortBy')}</label>
              <select className="input" {...inputProps('sort')}>
                <option value="-createdAt">{t('browse.newest')}</option>
                <option value="price">{t('browse.priceLowHigh')}</option>
                <option value="-price">{t('browse.priceHighLow')}</option>
                <option value="-views">{t('browse.mostViewed')}</option>
                <option value="-rating">{t('browse.topRated')}</option>
              </select>
            </div>
          </div>
        </aside>

        <div className="flex-1">
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-96" />)}
            </div>
          ) : properties.length === 0 ? (
            <EmptyState
              icon="🏠"
              title={t('browse.noResults')}
              message={t('browse.noResultsMsg')}
              action={<button onClick={clearAll} className="btn-primary">{t('browse.clearFilters')}</button>}
            />
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {properties.map((p) => <PropertyCard key={p._id} property={p} />)}
              </div>
              {loadingMore && <Spinner />}
              {page >= pages && properties.length > 8 && (
                <p className="mt-8 text-center text-sm text-gray-400">{t('browse.endOfList')}</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}