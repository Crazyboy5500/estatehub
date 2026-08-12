import { useEffect, useMemo, useRef, useState, type ReactNode, type MouseEvent, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPinIcon, ShareIcon, ArrowDownTrayIcon, HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { BedDouble, Bath, Ruler, Car, Layers, CalendarClock, Building2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { propertyService } from '../services/propertyService';
import { visitService } from '../services/visitService';
import { paymentService } from '../services/paymentService';
import { handleError } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useDocumentTitle } from '../hooks/useHooks';
import { Spinner, EmptyState, Stars, SafeImg } from '../components/ui';
import PropertyCard from '../components/PropertyCard';
import NearbyPlaces from '../components/NearbyPlaces';
import { formatPrice, formatArea, formatDate, statusLabel, statusBadgeClass } from '../utils/format';
import { calculateEMI, shareProperty, generatePropertyPDF } from '../utils/helpers';
import type { Property, Review, User } from '../types';
import type { LucideIcon } from 'lucide-react';

interface PannellumViewer {
  destroy?: () => void;
}

interface PannellumGlobal {
  viewer: (el: HTMLElement, opts: Record<string, unknown>) => PannellumViewer;
}

interface RazorpayInstance {
  on: (event: string, handler: () => void) => void;
  open: () => void;
}

declare global {
  interface Window {
    pannellum?: PannellumGlobal;
    libpannellum?: PannellumGlobal;
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/vendor/leaflet/marker-icon-2x.png',
  iconUrl: '/vendor/leaflet/marker-icon.png',
  shadowUrl: '/vendor/leaflet/marker-shadow.png',
});

const SectionTitle = ({ children }: { children: ReactNode }) => (
  <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-gray-100">{children}</h2>
);

function ImageGallery({ images }: { images?: string[] }) {
  const [active, setActive] = useState(0);
  const safeImages = images?.length ? images : ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80'];
  return (
    <div>
      <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-gray-200 dark:bg-gray-800">
        <SafeImg src={safeImages[active]} alt={`View ${active + 1}`} className="h-full w-full object-cover" />
      </div>
      {safeImages.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {safeImages.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg transition ${active === i ? 'ring-2 ring-primary-500' : 'opacity-60 hover:opacity-100'}`}
            >
              <SafeImg src={img} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PropertyMap({ property }: { property: Property }) {
  const [tileFailures, setTileFailures] = useState(0);
  const { t } = useTranslation();
  const lat = property?.coordinates?.lat;
  const lng = property?.coordinates?.lng;
  const hasCoords =
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng) &&
    (lat !== 0 || lng !== 0);
  const address = [property?.address, property?.city, property?.state, property?.pincode].filter(Boolean).join(', ');
  const mapsUrl = hasCoords
    ? `https://www.google.com/maps?q=${lat},${lng}`
    : address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
      : null;

  return (
    <div className="card mt-6 overflow-hidden p-0">
      <div className="p-6 pb-0">
        <SectionTitle>{t('detail.locationMap')}</SectionTitle>
        {hasCoords && <NearbyPlaces lat={lat as number} lng={lng as number} />}
      </div>
      <div className="h-80">
        {!hasCoords || tileFailures >= 4 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 bg-gray-100 px-6 text-center dark:bg-gray-800">
            <MapPinIcon className="h-10 w-10 text-gray-400" />
            <p className="text-sm text-gray-500">
              {hasCoords ? t('detail.mapTilesFailed') : t('detail.noCoords')}
            </p>
            {address && <p className="text-xs text-gray-400">{address}</p>}
            {mapsUrl && (
              <a href={mapsUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary-600 underline dark:text-primary-400">
                {t('detail.openInGoogleMaps')}
              </a>
            )}
          </div>
        ) : (
          <MapContainer center={[lat as number, lng as number]} zoom={13} scrollWheelZoom={false}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              eventHandlers={{ tileerror: () => setTileFailures((n) => n + 1) }}
            />
            <Marker position={[lat as number, lng as number]}>
              <Popup>{property.title}</Popup>
            </Marker>
          </MapContainer>
        )}
      </div>
    </div>
  );
}

function MortgageCalculator({ price }: { price: number }) {
  const [downPayment, setDownPayment] = useState(Math.round(price * 0.2));
  const [years, setYears] = useState(20);
  const [rate, setRate] = useState(8.5);
  const { t } = useTranslation();
  const result = useMemo(() => calculateEMI({ price, downPayment, years, rate }), [price, downPayment, years, rate]);

  return (
    <div className="card p-6">
      <SectionTitle>{t('detail.mortgageTitle')}</SectionTitle>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label">{t('detail.downPayment')}</label>
          <input type="number" className="input" value={downPayment} onChange={(e) => setDownPayment(Number(e.target.value))} />
        </div>
        <div>
          <label className="label">{t('detail.tenure')}</label>
          <input type="range" min="5" max="30" value={years} onChange={(e) => setYears(Number(e.target.value))} className="w-full" />
          <span className="text-sm font-medium">{t('detail.years', { count: years })}</span>
        </div>
        <div>
          <label className="label">{t('detail.interestRate')}</label>
          <input type="number" step="0.1" className="input" value={rate} onChange={(e) => setRate(Number(e.target.value))} />
        </div>
      </div>
      <div className="mt-5 grid gap-4 rounded-xl bg-primary-50 p-4 text-sm dark:bg-primary-950 sm:grid-cols-3">
        <div>
          <p className="text-gray-500 dark:text-gray-400">{t('detail.monthlyEmi')}</p>
          <p className="text-xl font-bold text-primary-700 dark:text-primary-400">₹{result.emi.toLocaleString('en-IN')}</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">{t('detail.totalInterest')}</p>
          <p className="text-xl font-bold">₹{result.totalInterest.toLocaleString('en-IN')}</p>
        </div>
        <div>
          <p className="text-gray-500 dark:text-gray-400">{t('detail.totalPayment')}</p>
          <p className="text-xl font-bold">₹{result.totalPayment.toLocaleString('en-IN')}</p>
        </div>
      </div>
    </div>
  );
}

function PanoramaModal({
  url,
  title,
  onClose,
}: {
  url: string;
  title: string;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<PannellumViewer | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    let cancelled = false;
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = '/vendor/pannellum/pannellum.css';
    document.head.appendChild(css);

    const createViewer = (pan: PannellumGlobal, src: string): void => {
      if (!containerRef.current) return;
      viewerRef.current = pan.viewer(containerRef.current, {
        type: 'equirectangular',
        panorama: src,
        autoLoad: true,
        autoRotate: -2,
        showZoomCtrl: true,
        showFullscreenCtrl: true,
        compass: true,
        onload: () => {
          if (!cancelled) setLoading(false);
        },
        onerror: () => {
          if (cancelled) return;
          if (src !== '/vendor/panoramas/fallback.jpg') {
            try {
              viewerRef.current?.destroy?.();
            } catch {
              /* noop */
            }
            viewerRef.current = null;
            if (containerRef.current) containerRef.current.innerHTML = '';
            createViewer(pan, '/vendor/panoramas/fallback.jpg');
          } else {
            setLoading(false);
            setFailed(true);
          }
        },
      });
    };

    const init = (): void => {
      const pan = window.pannellum || window.libpannellum;
      if (cancelled || !pan || !containerRef.current) return;
      createViewer(pan, url);
    };

    if (window.pannellum || window.libpannellum) {
      init();
    } else {
      const s = document.createElement('script');
      s.src = '/vendor/pannellum/pannellum.js';
      s.async = true;
      s.onload = init;
      s.onerror = () => {
        setLoading(false);
        setFailed(true);
      };
      document.head.appendChild(s);
    }
    return () => {
      cancelled = true;
      if (viewerRef.current) {
        try {
          viewerRef.current.destroy?.();
        } catch {
          /* already destroyed */
        }
        viewerRef.current = null;
      }
    };
  }, [url]);

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div className="relative w-full max-w-4xl" onClick={(e: MouseEvent) => e.stopPropagation()}>
        <div className="mb-2 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-lg">🕶️</span>
            <div>
              <p className="font-bold leading-tight">{t('detail.tourModalTitle')}</p>
              <p className="text-xs text-gray-300">{title}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full bg-white/10 px-4 py-1.5 text-sm transition hover:bg-white/25">{t('detail.tourClose')}</button>
        </div>
        <div className="relative h-[60vh] w-full overflow-hidden rounded-2xl bg-black">
          <div ref={containerRef} className="h-full w-full" />
          {loading && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />
              <p className="text-sm text-gray-300">{t('detail.tourLoading')}</p>
            </div>
          )}
          {failed && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <span className="text-4xl">😕</span>
              <p className="text-sm text-gray-300">{t('detail.tourFailed')}</p>
              <button onClick={onClose} className="btn-outline text-white">{t('common.close')}</button>
            </div>
          )}
        </div>
        <p className="mt-2 text-center text-xs text-gray-400">{t('detail.tourHint')}</p>
      </div>
    </div>
  );
}

function PaymentModal({ property, initialType = 'token', onClose }: { property: Property; initialType?: 'token' | 'full'; onClose: () => void }) {
  const [type, setType] = useState<'token' | 'full'>(initialType);
  const [tokenPaid, setTokenPaid] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { user, isAuthenticated, notify, catchError } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isAuthenticated || type !== 'full') return;
    paymentService
      .getMy()
      .then(({ data }) => {
        const paid = (data.data || []).some(
          (p: { type?: string; status?: string; propertyId?: { _id?: string } }) =>
            p.type === 'token' &&
            ['paid', 'confirmed'].includes(p.status || '') &&
            p.propertyId?._id === property._id
        );
        setTokenPaid(paid);
      })
      .catch(() => setTokenPaid(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, property._id, isAuthenticated]);

  const loadRazorpay = (): Promise<void> =>
    new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve();
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Could not load Razorpay checkout'));
      document.body.appendChild(s);
    });

  const fullAmount = Math.max(Math.round(property.price * 100) - (tokenPaid ? 50000 : 0), 0);
  const overLimit = Math.round(property.price * 100) > 50000000;

  const pay = async (): Promise<void> => {
    if (!isAuthenticated) {
      notify(t('notify.needLoginPay'), 'info');
      window.location.href = '/login';
      return;
    }
    setProcessing(true);
    try {
      await loadRazorpay();
      const { data } = await paymentService.createOrder(property._id, type);
      const options: Record<string, unknown> = {
        key: data.keyId,
        order_id: data.orderId,
        amount: data.amount,
        currency: data.currency,
        name: 'EstateHub',
        description: type === 'full' ? `Full payment for ${property.title}` : `Token payment for ${property.title}`,
        prefill: { email: user?.email || '' },
        theme: { color: '#2563eb' },
        handler: async (response: { razorpay_payment_id?: string; razorpay_order_id?: string; razorpay_signature?: string }) => {
          try {
            await paymentService.verify({
              ...response,
              propertyId: property._id,
              paymentId: data.paymentId,
            });
            notify(type === 'full' ? t('notify.fullPayPending') : t('notify.paymentSuccess'));
            onClose();
          } catch (error) {
            catchError(error, t('notify.payVerifyFailed'));
          }
        },
        modal: { ondismiss: () => setProcessing(false) },
      };
      if (!window.Razorpay) throw new Error('Razorpay not available');
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => {
        notify(t('notify.paymentFailed'), 'error');
        setProcessing(false);
      });
      rzp.open();
    } catch (error) {
      catchError(error, t('notify.payStartFailed'));
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="card w-full max-w-md p-6" onClick={(e: MouseEvent) => e.stopPropagation()}>
        <h3 className="text-lg font-bold">{type === 'full' ? t('detail.fullPayTitle') : t('detail.paymentTitle')}</h3>
        <p className="mt-1 text-sm text-gray-500">{property.title}</p>

        {property.purpose === 'sale' && property.status !== 'sold' && (
          <div className="mt-4 flex gap-2 rounded-xl bg-gray-50 p-1 dark:bg-gray-800">
            <button
              onClick={() => setType('token')}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${type === 'token' ? 'bg-primary-600 text-white' : 'text-gray-600 dark:text-gray-300'}`}
            >
              ₹500 {t('dash.token')}
            </button>
            <button
              onClick={() => setType('full')}
              disabled={overLimit}
              title={overLimit ? t('detail.overLimit') : undefined}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${type === 'full' ? 'bg-primary-600 text-white' : 'text-gray-600 dark:text-gray-300'} ${overLimit ? 'cursor-not-allowed opacity-40' : ''}`}
            >
              {t('dash.full')}
            </button>
          </div>
        )}

        {overLimit && (
          <p className="mt-3 rounded-lg bg-yellow-50 p-3 text-xs text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">
            {t('detail.overLimit')}
          </p>
        )}

        {type === 'token' ? (
          <div className="mt-4 rounded-xl bg-primary-50 p-4 text-center dark:bg-primary-950">
            <p className="text-3xl font-extrabold text-primary-700 dark:text-primary-400">{t('detail.tokenAmount')}</p>
            <p className="mt-1 text-xs text-gray-500">{t('detail.tokenDesc')}</p>
          </div>
        ) : (
          <div className="mt-4 space-y-2 rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
            <p className="text-xs text-gray-500">{t('detail.fullPayDesc')}</p>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t('detail.fullAmount')}</span>
              <span className="font-bold">{formatPrice(property.price, 'sale')}</span>
            </div>
            {tokenPaid && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t('detail.tokenDeducted')}</span>
                <span className="font-semibold text-green-600">− ₹500</span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-200 pt-2 text-base dark:border-gray-700">
              <span className="font-semibold">{t('detail.fullAmount')}</span>
              <span className="font-extrabold text-primary-600">{formatPrice(fullAmount / 100, 'sale')}</span>
            </div>
            <p className="pt-1 text-[11px] text-gray-400">{t('detail.tokenDeductNote')}</p>
          </div>
        )}

        <div className="mt-5 flex gap-3">
          <button onClick={onClose} className="btn-outline flex-1">{t('common.cancel')}</button>
          <button onClick={() => void pay()} disabled={processing} className="btn-primary flex-1">
            {processing
              ? t('detail.starting')
              : type === 'full'
                ? t('detail.payFull', { amount: formatPrice(fullAmount / 100, 'sale') })
                : t('detail.payToken')}
          </button>
        </div>
      </div>
    </div>
  );
}

function BookingModal({ property, onClose }: { property: Property; onClose: () => void }) {
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState('11:00');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { isAuthenticated, notify, catchError } = useAuth();
  const { t } = useTranslation();

  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!isAuthenticated) {
      notify(t('notify.needLoginBook'), 'info');
      onClose();
      window.location.href = '/login';
      return;
    }
    if (!date) {
      notify(t('notify.needDate'), 'error');
      return;
    }
    setSubmitting(true);
    try {
      await visitService.book(property._id, {
        date: date.toISOString(),
        time,
        message,
      });
      notify(t('notify.visitSent'));
      onClose();
    } catch (error) {
      catchError(error, t('notify.bookFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="card w-full max-w-md p-6" onClick={(e: MouseEvent) => e.stopPropagation()}>
        <h3 className="text-lg font-bold">{t('detail.bookingTitle')}</h3>
        <p className="mt-1 text-sm text-gray-500">{property.title}</p>
        <form onSubmit={(e) => void submit(e)} className="mt-4 space-y-4">
          <div>
            <label className="label">{t('detail.pickDate')}</label>
            <DatePicker
              selected={date}
              onChange={(d: Date | null) => setDate(d)}
              minDate={new Date()}
              inline
              calendarClassName="rounded-2xl border-gray-200 dark:border-gray-700 shadow-card"
              wrapperClassName="w-full"
            />
            <p className="mt-1 text-xs text-gray-400">
              {date
                ? t('detail.selectedDate', { date: date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) })
                : t('detail.dateHint')}
            </p>
          </div>
          <div>
            <label className="label">{t('detail.time')}</label>
            <input type="time" required className="input" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <div>
            <label className="label">{t('detail.msgToOwner')}</label>
            <textarea className="input" rows={3} placeholder={t('detail.msgPlaceholder')} value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-outline flex-1">{t('common.cancel')}</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1">{submitting ? t('detail.booking') : t('detail.requestVisit')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PropertyDetailsPage() {
  const { id } = useParams();
  const { user, isAuthenticated, toggleFavorite, notify, catchError } = useAuth();
  const { t } = useTranslation();
  const [property, setProperty] = useState<Property | null>(null);
  const [similar, setSimilar] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [showPanorama, setShowPanorama] = useState(false);
  const [showPayment, setShowPayment] = useState<'token' | 'full' | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [fav, setFav] = useState(false);

  useDocumentTitle(property?.title || 'Property Details');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([propertyService.getProperty(id), propertyService.getSimilar(id)])
      .then(([p, s]) => {
        setProperty(p.data.data);
        setSimilar(s.data.data);
        setFav(
          (user?.favorites as (string | { _id: string })[] | undefined)?.some(
            (f) => (typeof f === 'string' ? f === id : f._id === id)
          ) ?? false
        );
      })
      .catch((err) => notify(handleError(err, t('detail.propertyNotFound')), 'error'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <Spinner className="h-12 w-12" />;
  if (!property) {
    return (
      <div className="container-x py-16">
        <EmptyState icon="🏚️" title={t('detail.propertyNotFound')} action={<Link to="/properties" className="btn-primary">{t('nav.browse')}</Link>} />
      </div>
    );
  }

  const owner = property.ownerId as Partial<User> | undefined;
  const handleFavorite = async (): Promise<void> => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    try {
      const ids = await toggleFavorite(property._id);
      setFav(ids.includes(property._id));
    } catch (error) {
      catchError(error, t('notify.updateFavorite'));
    }
  };

  const startChat = async (): Promise<void> => {
    if (!isAuthenticated) {
      notify(t('notify.needLoginContact'), 'info');
      window.location.href = '/login';
      return;
    }
    if (!owner?._id) return;
    try {
      const { messageService } = await import('../services/messageService');
      const { data } = await messageService.getOrCreateConversation(owner._id, property._id);
      window.location.href = `/dashboard/messages?conversation=${data.data._id}`;
    } catch (error) {
      catchError(error, t('notify.convFailed'));
    }
  };

  const featureItems = [
    property.bedrooms > 0 && { icon: BedDouble as LucideIcon, label: t('detail.bedrooms', { count: property.bedrooms }) },
    property.bathrooms > 0 && { icon: Bath as LucideIcon, label: t('detail.bathrooms', { count: property.bathrooms }) },
    { icon: Ruler as LucideIcon, label: formatArea(property.area) },
    { icon: Building2 as LucideIcon, label: t('detail.floors', { count: property.totalFloors || 1 }) },
    property.parking! > 0 && { icon: Car as LucideIcon, label: t('detail.parkingCount', { count: property.parking }) },
    { icon: CalendarClock as LucideIcon, label: t('detail.yrsOld', { count: property.age || 0 }) },
  ].filter(Boolean) as { icon: LucideIcon; label: string }[];

  return (
    <div className="container-x animate-fade-in py-8">
      <nav className="mb-4 flex items-center gap-2 text-sm text-gray-500">
        <Link to="/" className="hover:text-primary-600">{t('detail.breadcrumbHome')}</Link> ›
        <Link to="/properties" className="hover:text-primary-600">{t('detail.breadcrumbProperties')}</Link> ›
        <Link to={`/properties?city=${property.city}`} className="hover:text-primary-600">{property.city}</Link> ›
        <span className="text-gray-900 dark:text-gray-100">{property.title.slice(0, 40)}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">{property.title}</h1>
              <p className="mt-2 flex items-center gap-1 text-gray-500 dark:text-gray-400">
                <MapPinIcon className="h-4 w-4" /> {property.address}, {property.city}, {property.state} {property.pincode}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className={statusBadgeClass(property.status)}>{statusLabel(property.status)}</span>
                <span className="badge-blue">{property.type}</span>
                <span className="badge-gray">{property.furnished}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => void handleFavorite()} className={`btn ${fav ? 'bg-red-50 text-red-500 dark:bg-red-950' : 'btn-outline'}`}>
                {fav ? <HeartIconSolid className="h-5 w-5" /> : <HeartIcon className="h-5 w-5" />}
                {fav ? t('detail.saved') : t('detail.save')}
              </button>
              <button onClick={() => void shareProperty(property)} className="btn-outline" title={t('detail.shareTitle')}>
                <ShareIcon className="h-5 w-5" />
              </button>
              <button onClick={() => void generatePropertyPDF(property)} className="btn-outline" title={t('detail.downloadTitle')}>
                <ArrowDownTrayIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          <ImageGallery images={property.images} />

          {property.panorama && (
            <div className="mt-6">
              <button onClick={() => setShowPanorama(true)} className="btn-primary w-full py-3 text-base sm:w-auto sm:px-8">
                {t('detail.viewTourBtn')}
              </button>
            </div>
          )}

          {property.video && (
            <div className="card mt-6 p-6">
              <SectionTitle>{t('detail.videoTitle')}</SectionTitle>
              <video
                src={property.video}
                poster={property.images?.[0] || undefined}
                controls
                playsInline
                preload="metadata"
                className="w-full rounded-xl bg-black"
              />
              <p className="mt-2 text-center text-xs text-gray-400">{t('detail.videoDesc')}</p>
            </div>
          )}

          <div className="card mt-6 p-6">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="text-sm text-gray-500">{property.purpose === 'rent' ? t('detail.monthlyRent') : t('detail.salePrice')}</p>
                <p className="text-3xl font-extrabold text-primary-600">{formatPrice(property.price, property.purpose)}</p>
              </div>
              <div className="text-right text-sm text-gray-500">
                <p>{t('detail.views', { count: property.views ?? 0 })}</p>
                <div className="mt-1 flex items-center justify-end gap-1">
                  <Stars rating={property.rating} />
                  <span>({property.ratingCount ?? 0})</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {featureItems.map((f) => (
                <div key={f.label} className="flex items-center gap-2 rounded-xl bg-gray-50 p-3 text-sm font-medium dark:bg-gray-800">
                  <f.icon className="h-5 w-5 text-primary-600" /> {f.label}
                </div>
              ))}
            </div>
          </div>

          <div className="card mt-6 p-6">
            <SectionTitle>{t('detail.description')}</SectionTitle>
            <p className="whitespace-pre-line leading-relaxed text-gray-600 dark:text-gray-300">{property.description}</p>
          </div>

          <div className="card mt-6 p-6">
            <SectionTitle>{t('detail.amenities')}</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {property.amenities?.length ? (
                property.amenities.map((a) => <span key={a} className="badge-green">✓ {a}</span>)
              ) : (
                <p className="text-sm text-gray-500">{t('detail.noAmenities')}</p>
              )}
            </div>
          </div>

          <PropertyMap property={property} />

          <div className="mt-6"><MortgageCalculator price={property.price} /></div>

          <div className="card mt-6 p-6">
            <SectionTitle>{t('detail.reviews', { count: property.reviews?.length || 0 })}</SectionTitle>
            {property.reviews?.length ? (
              <div className="space-y-4">
                {property.reviews.map((r: Review) => (
                  <div key={r._id} className="border-b border-gray-100 pb-4 last:border-0 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                      {r.userId?.profileImage ? (
                        <img src={r.userId.profileImage} alt="" className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
                          {(r.userId?.name || 'U')[0]}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold">{r.userId?.name}</p>
                        <div className="flex items-center gap-2">
                          <Stars rating={r.rating} size="text-xs" />
                          <span className="text-xs text-gray-400">{formatDate(r.createdAt || '')}</span>
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{r.comment}</p>
                    {r.ownerReply && (
                      <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800">
                        <span className="font-semibold">{t('detail.ownerReply')}</span> {r.ownerReply}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">{t('detail.noReviews')}</p>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="card p-6">
            <div className="text-2xl font-extrabold text-primary-600">
              {formatPrice(property.price, property.purpose)}
            </div>
            <div className="mt-4 flex items-center gap-3">
              {owner?.profileImage ? (
                <img src={owner.profileImage} alt={owner.name} className="h-11 w-11 rounded-full object-cover" />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-600 font-bold text-white">{owner?.name?.[0]}</div>
              )}
              <div>
                <p className="font-semibold">{owner?.name}</p>
                <p className="text-xs text-gray-500">{t('detail.verifiedOwner')}</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {property.status === 'sold' ? (
                <div className="rounded-xl bg-gray-100 p-4 text-center dark:bg-gray-800">
                  <p className="text-lg font-bold text-gray-600 dark:text-gray-300">🏁 {t('notify.soldMessage')}</p>
                </div>
              ) : (
                <>
                  {property.purpose === 'sale' && property.price * 100 <= 50000000 && (
                    <button onClick={() => setShowPayment('full')} className="btn w-full border-2 border-green-600 text-green-700 hover:bg-green-50 dark:hover:bg-green-950 dark:text-green-400">
                      {t('detail.buyNow')}
                    </button>
                  )}
                  <button onClick={() => setBooking(true)} className="btn-primary w-full">
                    {t('detail.scheduleVisit')}
                  </button>
                  <button onClick={() => setShowPayment('token')} className="btn w-full border-2 border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950">
                    {t('detail.reserveToken')}
                  </button>
                  <button onClick={() => void startChat()} className="btn-outline w-full">
                    {t('detail.contactOwner')}
                  </button>
                  {owner?.phone && (
                    <a href={`tel:${owner.phone}`} className="btn-outline w-full">📞 {owner.phone}</a>
                  )}
                </>
              )}
            </div>
          </div>

          {similar.length > 0 && (
            <div>
              <h3 className="mb-4 font-bold">{t('detail.similarProperties')}</h3>
              <div className="space-y-4">
                {similar.slice(0, 3).map((p) => <PropertyCard key={p._id} property={p} />)}
              </div>
            </div>
          )}
        </aside>
      </div>

      {booking && <BookingModal property={property} onClose={() => setBooking(false)} />}
      {showPanorama && <PanoramaModal url={property.panorama || ''} title={property.title} onClose={() => setShowPanorama(false)} />}
      {showPayment && <PaymentModal property={property} initialType={showPayment} onClose={() => setShowPayment(null)} />}
    </div>
  );
}