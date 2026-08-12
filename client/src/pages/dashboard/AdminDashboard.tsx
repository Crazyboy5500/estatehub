import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend, PointElement, LineElement } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { analyticsService } from '../../services/analyticsService';
import { paymentService } from '../../services/paymentService';
import { useAuth } from '../../hooks/useAuth';
import { handleError } from '../../services/api';
import { Spinner, EmptyState, SafeImg } from '../../components/ui';
import { timeAgo, formatPrice, formatDate } from '../../utils/format';
import { useScrollToTab } from '../../utils/useScrollToTab';
import type { Property, Payment } from '../../types';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend, PointElement, LineElement);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface CountStat {
  _id: number;
  count: number;
}

interface AdminStats {
  totalProperties: number;
  totalUsers: number;
  totalVisits: number;
  totalMessages: number;
  pendingVerification: number;
  totalRevenue: number;
}

interface ActivityItem {
  type: string;
  text: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const { notify, catchError } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [byCity, setByCity] = useState<CountStat[]>([]);
  const [monthly, setMonthly] = useState<CountStat[]>([]);
  const [mostViewed, setMostViewed] = useState<Property[]>([]);
  const [visits, setVisits] = useState<CountStat[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [commissionTotal, setCommissionTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsService.getStats(),
      analyticsService.propertiesByCity(),
      analyticsService.monthlyListings(),
      analyticsService.mostViewed(),
      analyticsService.visitsBooked(),
      analyticsService.recentActivity(),
      paymentService.getAll(),
    ])
      .then(([s, city, mon, viewed, vis, act, pays]) => {
        setStats(s.data.data);
        setByCity(city.data.data);
        setMonthly(mon.data.data);
        setMostViewed(viewed.data.data);
        setVisits(vis.data.data);
        setActivity(act.data.data);
        setPayments(pays.data.data || []);
        setCommissionTotal(pays.data.totals?.totalCommission || 0);
      })
      .catch((err) => catchError(err, t('notify.loadDashboard')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useScrollToTab(!loading);

  if (loading) return <Spinner />;

  const cityChart = {
    labels: byCity.map((c) => c._id),
    datasets: [{ label: t('dash.chartsProperties'), data: byCity.map((c) => c.count), backgroundColor: 'rgba(37,99,235,0.7)', borderRadius: 8 }],
  };
  const monthlyChart = {
    labels: monthly.map((m) => MONTHS[m._id - 1]),
    datasets: [{ label: t('dash.chartsListings'), data: monthly.map((m) => m.count), borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.1)', tension: 0.4, fill: true }],
  };
  const visitsChart = {
    labels: visits.map((v) => v._id),
    datasets: [{ label: t('dash.chartsVisits'), data: visits.map((v) => v.count), borderColor: '#f59e0b', tension: 0.4, fill: false }],
  };
  const viewedChart = {
    labels: mostViewed.map((p) => p.title.slice(0, 20)),
    datasets: [{ label: t('dash.chartsViews'), data: mostViewed.map((p) => p.views ?? 0), backgroundColor: ['#2563eb', '#f59e0b', '#22c55e', '#ef4444', '#8b5cf6'] }],
  };

  const cards = [
    { label: t('dash.totalProperties'), value: stats?.totalProperties ?? 0, icon: '🏘️' },
    { label: t('dash.totalUsers'), value: stats?.totalUsers ?? 0, icon: '👥' },
    { label: t('dash.visitsBooked'), value: stats?.totalVisits ?? 0, icon: '📅' },
    { label: t('dash.messagesSent'), value: stats?.totalMessages ?? 0, icon: '💬' },
    { label: t('dash.pendingVerification'), value: stats?.pendingVerification ?? 0, icon: '⏳' },
    { label: t('dash.commissionCollected'), value: formatPrice(commissionTotal / 100), icon: '💰' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold">{t('dash.adminTitle')}</h2>
        <p className="text-sm text-gray-500">{t('dash.adminSubtitle')}</p>
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
          <h3 className="mb-4 font-bold">{t('dash.propsByCity')}</h3>
          <Bar data={cityChart} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>
        <div className="card p-6">
          <h3 className="mb-4 font-bold">{t('dash.monthlyListings')}</h3>
          <Line data={monthlyChart} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>
        <div className="card p-6">
          <h3 className="mb-4 font-bold">{t('dash.mostViewed')}</h3>
          <Doughnut data={viewedChart} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
        </div>
        <div className="card p-6">
          <h3 className="mb-4 font-bold">{t('dash.visitsOverTime')}</h3>
          <Line data={visitsChart} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>
      </div>

      <div className="card p-6">
        <h3 className="mb-4 font-bold">{t('dash.recentActivity')}</h3>
        {activity.length === 0 ? (
          <p className="text-sm text-gray-500">{t('dash.noActivityYet')}</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {activity.map((a, i) => (
              <li key={i} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {a.type === 'property' ? '🏘️' : a.type === 'visit' ? '📅' : '🚩'}
                  </span>
                  <p className="text-sm">{a.text}</p>
                </div>
                <span className="text-xs text-gray-400">{timeAgo(a.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <section id="tab-payments" style={{ scrollMarginTop: '88px' }}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{t('dash.allPayments')}</h3>
          <span className="text-sm font-semibold text-green-600">{t('dash.commissionCollected')}: {formatPrice(commissionTotal / 100)}</span>
        </div>
        {payments.length ? (
          <div className="space-y-3">
            {payments.map((p) => (
              <div key={p._id} className="card flex flex-wrap items-center gap-4 p-4">
                <SafeImg src={p.propertyId?.images?.[0]} alt="" className="h-14 w-20 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <Link to={`/properties/${p.propertyId?._id}`} className="font-semibold hover:text-primary-600">
                    {p.propertyId?.title || t('dash.paymentDetails')}
                  </Link>
                  <p className="text-sm text-gray-500">
                    {p.type === 'full' ? t('dash.full') : t('dash.token')} • {t('dash.buyer')}: {p.buyerId?.name} • {t('dash.owner')}: {p.ownerId?.name} • {formatDate(p.createdAt || '')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatPrice(p.amount / 100)}</p>
                  {p.status === 'confirmed' && (
                    <p className="text-xs text-green-600">{t('dash.adminCommission', { percent: p.commissionPercent })}: {formatPrice(p.commissionPaise / 100)}</p>
                  )}
                  <span className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                    p.status === 'confirmed' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                    : p.status === 'paid' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
                    : p.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
                    {t(`dash.${p.status}`)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon="💳" title={t('dash.noPayments')} message={t('dash.noPaymentsMsg')} />
        )}
      </section>
    </div>
  );
}