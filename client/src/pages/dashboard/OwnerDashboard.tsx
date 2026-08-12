import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import PropertyCard from '../../components/PropertyCard';
import { Spinner, EmptyState, SafeImg } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { propertyService } from '../../services/propertyService';
import { analyticsService } from '../../services/analyticsService';
import { paymentService } from '../../services/paymentService';
import { handleError } from '../../services/api';
import { statusLabel, statusBadgeClass, formatPrice, formatDate } from '../../utils/format';
import { PlusCircleIcon, BuildingOfficeIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import type { Property, Payment } from '../../types';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface ChartPoint {
  _id: number;
  count: number;
}

interface OwnerAnalytics {
  chart?: ChartPoint[];
  totalListings: number;
  activeListings: number;
  pendingVerification: number;
  soldProperties: number;
  visits: number;
  revenue: number;
}

export default function OwnerDashboard() {
  const { user, notify, catchError } = useAuth();
  const { t } = useTranslation();
  const [listings, setListings] = useState<Property[]>([]);
  const [stats, setStats] = useState<OwnerAnalytics | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = (): Promise<void> =>
    Promise.all([propertyService.getMy(), analyticsService.ownerAnalytics(), paymentService.getOwner()])
      .then(([l, s, p]) => {
        setListings(l.data.data);
        setStats(s.data.data);
        setPayments(p.data.data || []);
      })
      .catch((err) => notify(handleError(err, t('notify.loadDashboard')), 'error'))
      .finally(() => setLoading(false));

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (property: Property): Promise<void> => {
    if (!window.confirm(t('dash.deleteConfirm', { title: property.title }))) return;
    try {
      await propertyService.remove(property._id);
      notify(t('dash.listingDeleted'));
      await load();
    } catch (error) {
      catchError(error, t('dash.deleteFailed'));
    }
  };

  const handleConfirm = async (payment: Payment): Promise<void> => {
    if (!window.confirm(t('dash.confirmPaymentMsg', { title: payment.propertyId?.title || '' }))) return;
    try {
      await paymentService.confirm(payment._id);
      notify(t('notify.payConfirmSuccess'));
      await load();
    } catch (error) {
      catchError(error, t('notify.payConfirmFailed'));
    }
  };

  const pendingFull = payments.filter((p) => p.type === 'full' && p.status === 'paid');
  const totalPayout = payments.reduce((sum, p) => sum + (p.ownerAmountPaise || 0), 0);

  if (loading) return <Spinner />;

  const chartData = {
    labels: (stats?.chart || []).map((c) => MONTHS[c._id - 1]),
    datasets: [
      {
        label: t('dash.chartsListings'),
        data: (stats?.chart || []).map((c) => c.count),
        backgroundColor: 'rgba(37, 99, 235, 0.7)',
        borderRadius: 8,
      },
    ],
  };

  const statusCounts = ['verified', 'pending', 'sold', 'rented', 'rejected'].map((s) => ({
    label: s,
    count: listings.filter((p) => p.status === s).length,
  }));

  const doughnutData = {
    labels: statusCounts.map((s) => statusLabel(s.label)),
    datasets: [
      {
        data: statusCounts.map((s) => s.count),
        backgroundColor: ['#22c55e', '#eab308', '#3b82f6', '#8b5cf6', '#ef4444'],
      },
    ],
  };

  const cards = [
    { label: t('dash.totalListings'), value: stats?.totalListings ?? 0, icon: '🏘️' },
    { label: t('dash.activeVerified'), value: stats?.activeListings ?? 0, icon: '✅' },
    { label: t('dash.pendingVerification'), value: stats?.pendingVerification ?? 0, icon: '⏳' },
    { label: t('dash.sold'), value: stats?.soldProperties ?? 0, icon: '💰' },
    { label: t('dash.acceptedVisits'), value: stats?.visits ?? 0, icon: '📅' },
    { label: t('dash.revenue'), value: `₹${((stats?.revenue ?? 0) / 100000).toFixed(1)}L`, icon: '💎' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{t('dash.ownerTitle')}</h2>
          <p className="text-sm text-gray-500">{t('dash.welcomeBack', { name: user?.name })}</p>
        </div>
        <Link to="/dashboard/add-property" className="btn-primary">
          <PlusCircleIcon className="h-5 w-5" /> {t('dash.addProperty')}
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{c.icon}</span>
              <div>
                <p className="text-2xl font-bold">{c.value}</p>
                <p className="text-sm text-gray-500">{c.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h3 className="mb-4 font-bold">{t('dash.listingsPerMonth')}</h3>
          {(stats?.chart?.length ?? 0) ? <Bar data={chartData} options={{ responsive: true, plugins: { legend: { display: false } } }} /> : <p className="text-sm text-gray-500">{t('dash.noDataYet')}</p>}
        </div>
        <div className="card p-6">
          <h3 className="mb-4 font-bold">{t('dash.listingsByStatus')}</h3>
          {listings.length ? <Doughnut data={doughnutData} options={{ responsive: true }} /> : <p className="text-sm text-gray-500">{t('dash.noListingsYet')}</p>}
        </div>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold"><CreditCardIcon className="mr-1 inline h-5 w-5" />{t('dash.payoutTitle')}</h3>
          {totalPayout > 0 && <span className="text-sm font-semibold text-green-600">{t('dash.totalEarnings')}: {formatPrice(totalPayout / 100)}</span>}
        </div>

        {pendingFull.length > 0 && (
          <div className="mb-6 rounded-xl border-2 border-yellow-300 bg-yellow-50 p-4 dark:border-yellow-700 dark:bg-yellow-900/20">
            <p className="mb-3 font-bold text-yellow-800 dark:text-yellow-300">{t('dash.pendingConfirmation')}</p>
            <div className="space-y-3">
              {pendingFull.map((p) => (
                <div key={p._id} className="flex flex-wrap items-center gap-4 rounded-lg bg-white p-3 dark:bg-gray-800">
                  <SafeImg src={p.propertyId?.images?.[0]} alt="" className="h-14 w-20 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{p.propertyId?.title}</p>
                    <p className="text-sm text-gray-500">
                      {t('dash.buyer')}: {p.buyerId?.name} • {formatDate(p.createdAt || '')}
                    </p>
                    <p className="text-xs text-gray-400">
                      {t('dash.adminCommission', { percent: p.commissionPercent })}: {formatPrice(p.commissionPaise / 100)} → {t('dash.ownerPayout', { percent: p.commissionPercent })}: {formatPrice((p.amount - p.commissionPaise) / 100)}
                    </p>
                  </div>
                  <button onClick={() => void handleConfirm(p)} className="btn-primary">{t('dash.confirmPayment')}</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {payments.length ? (
          <div className="space-y-3">
            {payments.map((p) => {
              const isPending = p.type === 'full' && p.status === 'paid';
              return (
                <div key={p._id} className="card flex flex-wrap items-center gap-4 p-4">
                  <SafeImg src={p.propertyId?.images?.[0]} alt="" className="h-14 w-20 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{p.propertyId?.title}</p>
                    <p className="text-sm text-gray-500">
                      {p.type === 'full' ? t('dash.full') : t('dash.token')} • {p.buyerId?.name} • {formatDate(p.createdAt || '')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatPrice(p.amount / 100)}</p>
                    {p.status === 'confirmed' && p.ownerAmountPaise > 0 && (
                      <p className="text-xs text-green-600">{t('dash.ownerPayout', { percent: p.commissionPercent })}: {formatPrice(p.ownerAmountPaise / 100)}</p>
                    )}
                    <span className="mt-1 inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      {t(`dash.${p.status}`)}
                    </span>
                  </div>
                  {isPending && <button onClick={() => void handleConfirm(p)} className="btn-primary">{t('dash.confirmPayment')}</button>}
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState icon="💳" title={t('dash.noPayments')} message={t('dash.noPaymentsMsg')} />
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold"><BuildingOfficeIcon className="mr-1 inline h-5 w-5" />{t('dash.myListings')}</h3>
          <span className="text-sm text-gray-500">{t('dash.total', { count: listings.length })}</span>
        </div>
        {listings.length ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {listings.map((p) => (
              <div key={p._id}>
                <div className="relative">
                  <PropertyCard property={p} />
                  <div className="absolute right-3 top-3 flex gap-1">
                    <span className={statusBadgeClass(p.status)}>{statusLabel(p.status)}</span>
                  </div>
                </div>
                <div className="mt-2 flex gap-2">
                  <Link to={`/dashboard/edit-property/${p._id}`} className="btn-outline flex-1 justify-center py-2 text-sm">
                    {t('dash.edit')}
                  </Link>
                  <button onClick={() => void handleDelete(p)} className="btn-danger flex-1 justify-center py-2 text-sm">
                    {t('dash.delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon="🏘️" title={t('dash.noListingsTitle')} message={t('dash.noListingsMsg')} action={<Link to="/dashboard/add-property" className="btn-primary">{t('dash.addProperty')}</Link>} />
        )}
      </section>
    </div>
  );
}