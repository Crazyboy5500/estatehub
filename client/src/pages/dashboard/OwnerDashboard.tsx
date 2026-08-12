import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import PropertyCard from '../../components/PropertyCard';
import { Spinner, EmptyState } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { propertyService } from '../../services/propertyService';
import { analyticsService } from '../../services/analyticsService';
import { handleError } from '../../services/api';
import { statusLabel, statusBadgeClass } from '../../utils/format';
import { PlusCircleIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import type { Property } from '../../types';

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
  const [loading, setLoading] = useState(true);

  const load = (): Promise<void> =>
    Promise.all([propertyService.getMy(), analyticsService.ownerAnalytics()])
      .then(([l, s]) => {
        setListings(l.data.data);
        setStats(s.data.data);
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