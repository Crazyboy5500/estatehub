import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PropertyCard from './PropertyCard';
import { SafeImg } from './ui';
import { propertyService } from '../services/propertyService';
import { handleError } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { Property } from '../types';

interface CityStat {
  _id: string;
  count: number;
}

const SectionHeader = ({
  title,
  subtitle,
  to,
}: {
  title: string;
  subtitle?: string;
  to?: string;
}) => {
  const { t } = useTranslation();
  return (
    <div className="mb-8 flex items-end justify-between">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1 text-gray-500 dark:text-gray-400">{subtitle}</p>}
      </div>
      {to && (
        <Link to={to} className="btn-outline">{t('home.viewAll')}</Link>
      )}
    </div>
  );
};

const Grid = ({ children }: { children: ReactNode }) => (
  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
);

export function FeaturedProperties() {
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const { notify } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    propertyService
      .getFeatured()
      .then(({ data }) => setItems(data.data))
      .catch((err) => notify(handleError(err, t('notify.loadFeatured')), 'error'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="container-x py-16">
      <SectionHeader title={t('home.featuredTitle')} subtitle={t('home.featuredSubtitle')} to="/properties?featured=true" />
      {loading ? (
        <Grid>{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-80" />)}</Grid>
      ) : (
        <Grid>
          {items.map((p) => <PropertyCard key={p._id} property={p} />)}
        </Grid>
      )}
    </section>
  );
}

export function LatestListings() {
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const { notify } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    propertyService
      .getLatest()
      .then(({ data }) => setItems(data.data))
      .catch((err) => notify(handleError(err, t('notify.loadListings')), 'error'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="bg-white py-16 dark:bg-gray-900">
      <div className="container-x">
        <SectionHeader title={t('home.latestTitle')} subtitle={t('home.latestSubtitle')} to="/properties?sort=-createdAt" />
        {loading ? (
          <Grid>{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-80" />)}</Grid>
        ) : (
          <Grid>
            {items.map((p) => <PropertyCard key={p._id} property={p} />)}
          </Grid>
        )}
      </div>
    </section>
  );
}

const cityImages: Record<string, string> = {
  'Delhi': 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&q=80',
  'Mumbai': 'https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=800&q=80',
  'Bengaluru': 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800&q=80',
  'Hyderabad': 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&q=80',
  'Pune': 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800&q=80',
};

export function PopularCities() {
  const [cities, setCities] = useState<CityStat[]>([]);
  const { notify } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    propertyService
      .getCities()
      .then(({ data }) => setCities(data.data.slice(0, 6)))
      .catch((err) => notify(handleError(err), 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="container-x py-16">
      <SectionHeader title={t('home.citiesTitle')} subtitle={t('home.citiesSubtitle')} />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {cities.map((c) => (
          <Link
            key={c._id}
            to={`/properties?city=${encodeURIComponent(c._id)}`}
            className="group relative overflow-hidden rounded-2xl"
          >
            <SafeImg
              src={cityImages[c._id] || 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80'}
              alt={c._id}
              className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-52"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-4 left-4 text-white">
              <h3 className="text-lg font-bold">{c._id}</h3>
              <p className="text-sm text-gray-200">{t('home.citiesCount', { count: c.count })}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

interface Feature {
  icon: string;
  title: string;
  desc: string;
}

export function WhyChooseUs() {
  const { t } = useTranslation();
  const features: Feature[] = [
    { icon: '✅', title: t('home.whyVerified'), desc: t('home.whyVerifiedDesc') },
    { icon: '🔒', title: t('home.whySecure'), desc: t('home.whySecureDesc') },
    { icon: '⚡', title: t('home.whyInstant'), desc: t('home.whyInstantDesc') },
    { icon: '💬', title: t('home.whyChat'), desc: t('home.whyChatDesc') },
  ];
  return (
    <section className="bg-primary-950 py-16 text-white">
      <div className="container-x">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">{t('home.whyTitle')}</h2>
          <p className="mt-2 text-primary-200">{t('home.whySubtitle')}</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl bg-primary-900/60 p-6 text-center">
              <div className="mx-auto mb-3 text-3xl">{f.icon}</div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-primary-200">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Testimonials() {
  const { t } = useTranslation();
  const items = [
    { name: t('home.t1Name'), role: t('home.t1Role'), text: t('home.t1Text') },
    { name: t('home.t2Name'), role: t('home.t2Role'), text: t('home.t2Text') },
    { name: t('home.t3Name'), role: t('home.t3Role'), text: t('home.t3Text') },
  ];
  return (
    <section className="bg-white py-16 dark:bg-gray-900">
      <div className="container-x">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">{t('home.testimonialsTitle')}</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((item) => (
            <div key={item.name} className="card p-6">
              <div className="mb-3 text-accent">★★★★★</div>
              <p className="text-sm text-gray-600 dark:text-gray-300">“{item.text}”</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 font-bold text-white">
                  {item.name[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function StatsSection() {
  const { t } = useTranslation();
  const stats = [
    { value: '10K+', label: t('home.statListed') },
    { value: '50K+', label: t('home.statCustomers') },
    { value: '120+', label: t('home.statCities') },
    { value: '4.8★', label: t('home.statRating') },
  ];
  return (
    <section className="border-y border-gray-200 bg-gray-50 py-12 dark:border-gray-800 dark:bg-gray-950">
      <div className="container-x grid grid-cols-2 gap-8 text-center md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="text-3xl font-extrabold text-primary-600">{s.value}</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}