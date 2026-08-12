import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HeartIcon, CalendarIcon, ChatBubbleLeftRightIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import PropertyCard from '../../components/PropertyCard';
import { Spinner, EmptyState, SafeImg } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import { visitService } from '../../services/visitService';
import { paymentService } from '../../services/paymentService';
import { handleError } from '../../services/api';
import { formatDate, formatPrice, statusLabel, statusBadgeClass } from '../../utils/format';
import { useScrollToTab } from '../../utils/useScrollToTab';
import type { Property, Visit, Payment } from '../../types';

const PAYMENT_STATUSES = ['created', 'paid', 'confirmed', 'refunded', 'failed'];

function statusClass(status: string): string {
  return {
    created: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
    paid: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  }[status] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300';
}

export default function BuyerDashboard() {
  const { user, notify } = useAuth();
  const { t } = useTranslation();
  const [favorites, setFavorites] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Visit[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([authService.getMe(), visitService.getMy(), paymentService.getMy()])
      .then(([me, visits, pays]) => {
        setFavorites(me.data.user.favorites || []);
        setBookings(visits.data.data);
        setPayments(pays.data.data || []);
      })
      .catch((err) => notify(handleError(err, t('notify.loadDashboard')), 'error'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useScrollToTab(!loading);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-xl font-bold">{t('dash.hello', { name: user?.name })}</h2>
        <p className="text-sm text-gray-500">{t('dash.buyerSubtitle')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card flex items-center gap-4 p-5">
          <HeartIcon className="h-8 w-8 text-red-500" />
          <div>
            <p className="text-2xl font-bold">{favorites.length}</p>
            <p className="text-sm text-gray-500">{t('dash.savedProperties')}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 p-5">
          <CalendarIcon className="h-8 w-8 text-primary-600" />
          <div>
            <p className="text-2xl font-bold">{bookings.length}</p>
            <p className="text-sm text-gray-500">{t('dash.bookedVisits')}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 p-5">
          <ChatBubbleLeftRightIcon className="h-8 w-8 text-green-600" />
          <div>
            <p className="text-2xl font-bold">—</p>
            <p className="text-sm text-gray-500">{t('dash.messages')}</p>
          </div>
        </div>
      </div>

      <section id="tab-saved" style={{ scrollMarginTop: '88px' }}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{t('dash.savedTitle')}</h3>
          <Link to="/properties" className="text-sm text-primary-600 hover:underline">{t('dash.browseMore')}</Link>
        </div>
        {favorites.length ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {favorites.map((p) => <PropertyCard key={p._id} property={p} />)}
          </div>
        ) : (
          <EmptyState icon="💛" title={t('dash.noSaved')} message={t('dash.noSavedMsg')} action={<Link to="/properties" className="btn-primary">{t('dash.exploreProperties')}</Link>} />
        )}
      </section>

      <section id="tab-visits" style={{ scrollMarginTop: '88px' }}>
        <h3 className="mb-4 text-lg font-bold">{t('dash.bookedTitle')}</h3>
        {bookings.length ? (
          <div className="space-y-4">
            {bookings.map((v) => {
              const prop = v.propertyId as Property | undefined;
              return (
                <div key={v._id} className="card flex flex-wrap items-center gap-4 p-5">
                  <SafeImg src={prop?.images?.[0]} alt="" className="h-16 w-24 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <Link to={`/properties/${prop?._id}`} className="font-semibold hover:text-primary-600">
                      {prop?.title}
                    </Link>
                    <p className="text-sm text-gray-500">
                      {t('dash.visitAt', { date: formatDate(v.date || ''), time: v.time, city: prop?.city })}
                    </p>
                  </div>
                  <span className={statusBadgeClass(v.status)}>{statusLabel(v.status)}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState icon="📅" title={t('dash.noVisits')} message={t('dash.noVisitsMsg')} />
        )}
      </section>

      <section id="tab-payments" style={{ scrollMarginTop: '88px' }}>
        <h3 className="mb-4 text-lg font-bold">{t('dash.myPayments')}</h3>
        {payments.length ? (
          <div className="space-y-3">
            {payments.map((p) => {
              const prop = p.propertyId;
              return (
                <div key={p._id} className="card flex flex-wrap items-center gap-4 p-5">
                  <SafeImg src={prop?.images?.[0]} alt="" className="h-16 w-24 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <Link to={`/properties/${prop?._id}`} className="font-semibold hover:text-primary-600">
                      {prop?.title || t('dash.paymentDetails')}
                    </Link>
                    <p className="text-sm text-gray-500">
                      {t('dash.paymentType')}: {p.type === 'full' ? t('dash.full') : t('dash.token')} • {t('dash.paymentDate')}: {formatDate(p.createdAt || '')}
                    </p>
                    {p.type === 'full' && p.status === 'confirmed' && (
                      <p className="mt-1 text-xs text-green-600">{t('notify.payConfirmSuccess')}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatPrice(p.amount / 100)}</p>
                    <span className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusClass(p.status)}`}>
                      {PAYMENT_STATUSES.includes(p.status) ? t(`dash.${p.status}`) : p.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState icon="💳" title={t('dash.noPayments')} message={t('dash.noPaymentsMsg')} />
        )}
      </section>
    </div>
  );
}