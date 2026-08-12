import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SearchBar from '../components/SearchBar';
import { FadeInSection } from '../components/ui';
import { getRecentSearches, removeRecentSearch, clearRecentSearches } from '../utils/recentSearches';
import {
  FeaturedProperties, LatestListings, PopularCities, WhyChooseUs, Testimonials, StatsSection,
} from '../components/homeSections';

function RecentSearches() {
  const [searches, setSearches] = useState(getRecentSearches());
  const navigate = useNavigate();
  const { t } = useTranslation();
  if (searches.length === 0) return null;

  return (
    <div className="mx-auto mt-6 flex max-w-4xl flex-wrap items-center justify-center gap-2">
      <span className="text-sm text-primary-100">{t('home.recent')}</span>
      {searches.map((s) => (
        <button
          key={s.label}
          onClick={() => navigate(`/properties?${s.params}`)}
          className="group flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-sm text-white backdrop-blur transition hover:bg-white/20"
        >
          <span className="text-primary-100 group-hover:text-white">{s.label}</span>
          <span
            role="button"
            aria-label={`${t('common.remove')} ${s.label}`}
            className="ml-1 text-primary-200 hover:text-red-300"
            onClick={(e) => {
              e.stopPropagation();
              removeRecentSearch(s.label);
              setSearches(getRecentSearches());
            }}
          >
            ✕
          </span>
        </button>
      ))}
      <button
        onClick={() => {
          clearRecentSearches();
          setSearches([]);
        }}
        className="text-xs text-primary-200 underline-offset-2 hover:underline"
      >
        {t('common.clear')}
      </button>
    </div>
  );
}

export default function HomePage() {
  const { t } = useTranslation();
  return (
    <div className="animate-fade-in">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950 py-24 text-white">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="container-x relative">
          <div className="mx-auto max-w-3xl text-center">
            <span className="badge bg-white/10 text-white">{t('home.heroBadge')}</span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight sm:text-5xl">
              {t('home.heroTitle1')} <span className="text-accent">{t('home.heroTitle2')}</span>
            </h1>
            <p className="mt-4 text-lg text-primary-100">
              {t('home.heroSubtitle')}
            </p>
          </div>
          <div className="mx-auto mt-10 max-w-4xl">
            <SearchBar />
          </div>
          <RecentSearches />
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-primary-100">
            <span>✅ {t('home.verifiedListings')}</span>
            <span>✅ {t('home.noBrokerage')}</span>
            <span>✅ {t('home.directChat')}</span>
            <span>✅ {t('home.freeVisits')}</span>
          </div>
        </div>
      </section>

      <FadeInSection>
        <FeaturedProperties />
      </FadeInSection>

      <FadeInSection>
        <PopularCities />
      </FadeInSection>

      <StatsSection />

      <FadeInSection>
        <LatestListings />
      </FadeInSection>

      <FadeInSection>
        <WhyChooseUs />
      </FadeInSection>

      <FadeInSection>
        <Testimonials />
      </FadeInSection>

      <section className="container-x py-16">
        <div className="card flex flex-col items-center gap-4 bg-gradient-to-r from-primary-600 to-primary-800 p-10 text-center text-white sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h2 className="text-2xl font-bold">{t('home.ownerCtaTitle')}</h2>
            <p className="mt-1 text-primary-100">{t('home.ownerCtaText')}</p>
          </div>
          <a href="/register?role=owner" className="btn bg-white text-primary-700 hover:bg-primary-50">
            {t('home.ownerCtaBtn')}
          </a>
        </div>
      </section>
    </div>
  );
}
