import { useEffect, useState, type FormEvent, type MouseEvent } from 'react';
import DatePicker from 'react-datepicker';
import { useTranslation } from 'react-i18next';
import { visitService } from '../../services/visitService';
import { useAuth } from '../../hooks/useAuth';
import { handleError } from '../../services/api';
import { Spinner, EmptyState } from '../../components/ui';
import { formatDate, statusLabel, statusBadgeClass } from '../../utils/format';
import { SafeImg } from '../../components/ui';
import type { Visit, VisitStatus, Property, User } from '../../types';

const STATUSES: VisitStatus[] = ['pending', 'accepted', 'rejected', 'rescheduled', 'completed', 'cancelled'];

interface VisitWithReschedule extends Omit<Visit, 'propertyId' | 'buyerId'> {
  rescheduleNote?: string;
  message?: string;
  propertyId?: Visit['propertyId'];
  buyerId?: Visit['buyerId'];
}

export default function OwnerVisitsPage() {
  const { user, notify, catchError } = useAuth();
  const { t } = useTranslation();
  const [visits, setVisits] = useState<VisitWithReschedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [rescheduling, setRescheduling] = useState<VisitWithReschedule | null>(null);
  const [reschedDate, setReschedDate] = useState<Date | null>(null);
  const [reschedTime, setReschedTime] = useState('');
  const [reschedNote, setReschedNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = (): Promise<void> =>
    visitService
      .getOwner()
      .then(({ data }) => setVisits(data.data))
      .catch((err) => catchError(err, t('visits.loadFailed')))
      .finally(() => setLoading(false));

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const respond = async (id: string, status: VisitStatus): Promise<void> => {
    try {
      await visitService.respond(id, { status });
      notify(t('visits.visitStatus', { status }));
      await load();
    } catch (error) {
      catchError(error, t('visits.updateFailed'));
    }
  };

  const openReschedule = (v: VisitWithReschedule): void => {
    setRescheduling(v);
    setReschedDate(v.date ? new Date(v.date) : null);
    setReschedTime(v.time || '');
    setReschedNote(v.rescheduleNote || '');
  };

  const submitReschedule = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!rescheduling || !reschedDate) return;
    setSubmitting(true);
    try {
      await visitService.respond(rescheduling._id, {
        status: 'rescheduled',
        date: reschedDate.toISOString(),
        time: reschedTime,
        rescheduleNote: reschedNote,
      });
      notify(t('visits.rescheduled'));
      setRescheduling(null);
      await load();
    } catch (error) {
      catchError(error, t('visits.reschedFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const propOf = (v: VisitWithReschedule): Property | undefined =>
    typeof v.propertyId === 'object' && v.propertyId ? (v.propertyId as Property) : undefined;
  const buyerOf = (v: VisitWithReschedule): User | undefined =>
    typeof v.buyerId === 'object' && v.buyerId ? (v.buyerId as User) : undefined;

  if (loading) return <Spinner />;

  return (
    <div>
      <h2 className="text-xl font-bold">{t('visits.title')}</h2>
      <p className="text-sm text-gray-500">{t('visits.subtitle')}</p>

      {visits.length === 0 ? (
        <div className="mt-8"><EmptyState icon="📅" title={t('visits.noRequests')} message={t('visits.noRequestsMsg')} /></div>
      ) : (
        <div className="mt-6 space-y-4">
          {visits.map((v) => {
            const prop = propOf(v);
            const buyer = buyerOf(v);
            return (
              <div key={v._id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-4">
                    {prop?.images?.[0] ? (
                      <SafeImg src={prop.images[0]} alt="" className="h-16 w-24 rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-16 w-24 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">🏠</div>
                    )}
                    <div>
                      <p className="font-semibold">{prop?.title || t('visits.property')}</p>
                      <p className="text-sm text-gray-500">
                        {prop?.city} • 📅 {formatDate(v.date || '')} at {v.time}
                      </p>
                      <p className="text-sm text-gray-500">{t('visits.buyer', { name: buyer?.name, phone: buyer?.phone || t('visits.noPhone') })}</p>
                      {v.message && <p className="mt-1 text-sm text-gray-500 italic">“{v.message}”</p>}
                    </div>
                  </div>
                  <span className={statusBadgeClass(v.status)}>{statusLabel(v.status)}</span>
                </div>

                {v.status === 'pending' && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={() => void respond(v._id, 'accepted')} className="badge-green hover:bg-green-200 dark:hover:bg-green-900/60">{t('visits.accept')}</button>
                    <button onClick={() => openReschedule(v)} className="badge-yellow hover:bg-yellow-200">{t('visits.reschedule')}</button>
                    <button onClick={() => void respond(v._id, 'rejected')} className="badge-red hover:bg-red-200">{t('visits.reject')}</button>
                  </div>
                )}
                {v.status === 'accepted' && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={() => void respond(v._id, 'completed')} className="badge-green hover:bg-green-200">{t('visits.markCompleted')}</button>
                    <button onClick={() => void respond(v._id, 'cancelled')} className="badge-red hover:bg-red-200">{t('visits.cancel')}</button>
                  </div>
                )}
                {v.status === 'rescheduled' && v.rescheduleNote && (
                  <p className="mt-3 text-sm text-gray-500">{t('visits.rescheduleNote', { note: v.rescheduleNote })}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {rescheduling && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4" onClick={() => setRescheduling(null)}>
          <div
            className="card w-full max-w-md p-6"
            onClick={(e: MouseEvent) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold">{t('visits.rescheduleTitle')}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {propOf(rescheduling)?.title || String(rescheduling.propertyId)} — {buyerOf(rescheduling)?.name || String(rescheduling.buyerId)}
            </p>
            <form onSubmit={(e) => void submitReschedule(e)} className="mt-4 space-y-4">
              <div>
                <label className="label">{t('visits.newDate')}</label>
                <DatePicker
                  selected={reschedDate}
                  onChange={(d: Date | null) => setReschedDate(d)}
                  minDate={new Date()}
                  inline
                  calendarClassName="rounded-2xl border-gray-200 dark:border-gray-700 shadow-card"
                  wrapperClassName="w-full"
                />
                <p className="mt-1 text-xs text-gray-400">
                  {reschedDate ? t('visits.selectedDate', { date: reschedDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) }) : t('visits.dateHint')}
                </p>
              </div>
              <div>
                <label className="label">{t('visits.time')}</label>
                <input type="time" required className="input" value={reschedTime} onChange={(e) => setReschedTime(e.target.value)} />
              </div>
              <div>
                <label className="label">{t('visits.noteToBuyer')}</label>
                <textarea className="input" rows={2} placeholder={t('visits.notePlaceholder')} value={reschedNote} onChange={(e) => setReschedNote(e.target.value)} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setRescheduling(null)} className="btn-outline flex-1">{t('visits.cancel')}</button>
                <button type="submit" disabled={submitting || !reschedDate} className="btn-primary flex-1">{submitting ? t('visits.saving') : t('visits.rescheduleBtn')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}