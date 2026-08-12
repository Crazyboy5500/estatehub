import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { propertyService } from '../../services/propertyService';
import { userService } from '../../services/userService';
import { useAuth } from '../../hooks/useAuth';
import { handleError } from '../../services/api';
import { Spinner, EmptyState } from '../../components/ui';
import { statusLabel, statusBadgeClass, formatPrice, formatDate } from '../../utils/format';
import { SafeImg } from '../../components/ui';
import type { Property, PropertyStatus } from '../../types';

interface Report {
  targetType: string;
  status: string;
  reason: string;
  reporterId?: { name?: string };
  targetId?: { _id?: string } | string;
}

const STATUSES: PropertyStatus[] = ['pending', 'verified', 'rejected', 'sold', 'rented'];

export default function AdminPropertiesPage() {
  const { notify, catchError } = useAuth();
  const { t } = useTranslation();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<PropertyStatus>('pending');
  const [reports, setReports] = useState<Report[]>([]);

  const load = (): void => {
    setLoading(true);
    Promise.all([
      propertyService.getProperties({ limit: 50, sort: '-createdAt', ...(statusFilter ? { status: statusFilter } : {}) }),
      userService.getReports(),
    ])
      .then(([p, r]) => {
        setProperties(p.data.data);
        setReports(r.data.data);
      })
      .catch((err) => catchError(err, t('admin.propsLoadFailed')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const updateStatus = async (id: string, status: PropertyStatus): Promise<void> => {
    try {
      await propertyService.updateStatus(id, status);
      notify(t('admin.markedAs', { status: statusLabel(status) }));
      load();
    } catch (error) {
      catchError(error, t('admin.actionFailed'));
    }
  };

  const remove = async (p: Property): Promise<void> => {
    if (!window.confirm(t('admin.deleteListingConfirm', { title: p.title }))) return;
    try {
      await propertyService.remove(p._id);
      notify(t('dash.listingDeleted'));
      load();
    } catch (error) {
      catchError(error, t('admin.deleteFailed'));
    }
  };

  const openReports = (open: Report[]): void => {
    if (open.length) {
      window.alert(t('admin.reports', {
        count: open.length,
        list: open.map((r) => `- ${r.reason} (by ${r.reporterId?.name})`).join('\n'),
      }));
    } else {
      notify(t('admin.noOpenReports'), 'info');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div>
      <h2 className="text-xl font-bold">{t('admin.propertyModeration')}</h2>
      <p className="text-sm text-gray-500">{t('admin.moderationSubtitle')}</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${
              statusFilter === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            {statusLabel(s)}
          </button>
        ))}
      </div>

      {properties.length === 0 ? (
        <div className="mt-8"><EmptyState icon="🏘️" title={t('admin.noProps', { status: statusLabel(statusFilter) })} /></div>
      ) : (
        <div className="mt-6 space-y-4">
          {properties.map((p) => {
            const propertyReports = reports.filter(
              (r) => r.targetType === 'property' && String(r.targetId && typeof r.targetId === 'object' ? r.targetId._id : r.targetId) === String(p._id)
            );
            const owner = p.ownerId as { name?: string } | undefined;
            return (
              <div key={p._id} className="card flex flex-wrap items-center gap-4 p-4">
                <SafeImg src={p.images?.[0]} alt="" className="h-20 w-28 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link to={`/properties/${p._id}`} className="font-semibold hover:text-primary-600">{p.title}</Link>
                    {propertyReports.length > 0 && <span className="badge-red">🚩 {propertyReports.length}</span>}
                  </div>
                  <p className="text-sm text-gray-500">
                    {p.city} • {p.type} • {formatPrice(p.price, p.purpose)} • {t('admin.listedBy', { date: formatDate(p.createdAt || ''), name: owner?.name })}
                  </p>
                  <p className="text-xs text-gray-400">{t('admin.viewsRating', { views: p.views ?? 0, rating: p.rating || 'new' })}</p>
                </div>
                <span className={statusBadgeClass(p.status)}>{statusLabel(p.status)}</span>
                <div className="flex flex-wrap gap-2">
                  {p.status === 'pending' && (
                    <>
                      <button onClick={() => void updateStatus(p._id, 'verified')} className="badge-green hover:bg-green-200">{t('admin.verify')}</button>
                      <button onClick={() => void updateStatus(p._id, 'rejected')} className="badge-red hover:bg-red-200">{t('admin.reject')}</button>
                    </>
                  )}
                  {p.status === 'verified' && (
                    <>
                      <button onClick={() => void updateStatus(p._id, 'sold')} className="badge-blue">{t('admin.markSold')}</button>
                      <button onClick={() => void updateStatus(p._id, 'rented')} className="badge-blue">{t('admin.markRented')}</button>
                    </>
                  )}
                  {propertyReports.length > 0 && (
                    <button onClick={() => openReports(propertyReports)} className="badge-yellow">{t('admin.viewReports')}</button>
                  )}
                  <button onClick={() => void remove(p)} className="badge-red">{t('admin.deleteListing')}</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}