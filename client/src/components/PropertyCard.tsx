import { useState, type MouseEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { BedDoubleIcon, BathIcon, RulerIcon } from 'lucide-react';
import { formatPrice, formatArea, statusLabel } from '../utils/format';
import { useAuth } from '../hooks/useAuth';
import { SafeImg } from './ui';
import type { Property } from '../types';

interface PropertyCardProps {
  property: Property;
  compareMode?: boolean;
  onCompareToggle?: (property: Property) => void;
  isCompared?: boolean;
}

export default function PropertyCard({
  property,
  compareMode = false,
  onCompareToggle,
  isCompared = false,
}: PropertyCardProps) {
  const { user, isAuthenticated, toggleFavorite, catchError } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [fav, setFav] = useState(
    (user?.favorites as (string | { _id: string })[] | undefined)?.some(
      (f) => (typeof f === 'string' ? f === property._id : f._id === property._id)
    ) ?? false
  );

  const handleFavorite = async (e: MouseEvent): Promise<void> => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      const ids = await toggleFavorite(property._id);
      setFav(ids.includes(property._id));
    } catch (error) {
      catchError(error, 'Could not update favorite');
    }
  };

  const statusBadge =
    {
      pending: 'badge-yellow',
      verified: 'badge-green',
      rejected: 'badge-red',
      sold: 'badge-blue',
      rented: 'badge-blue',
    }[property.status] || 'badge-gray';

  return (
    <div className="group card overflow-hidden transition-shadow hover:shadow-card-hover">
      <Link to={`/properties/${property._id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-200 dark:bg-gray-800">
          {property.images?.length ? (
            <SafeImg
              src={property.images[0]}
              alt={property.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl">🏠</div>
          )}
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            <span className={`${statusBadge}`}>{statusLabel(property.status)}</span>
            <span className="badge bg-black/60 text-white backdrop-blur">{property.type}</span>
          </div>
          {property.purpose === 'rent' && (
            <span className="badge absolute bottom-3 left-3 bg-accent text-white">{t('card.forRent')}</span>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="line-clamp-1 font-semibold text-gray-900 dark:text-gray-100">{property.title}</h3>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                📍 {property.city}, {property.state}
              </p>
            </div>
            <button
              onClick={(e) => void handleFavorite(e)}
              className={`rounded-full p-2 transition hover:bg-red-50 dark:hover:bg-red-950/40 ${fav ? 'text-red-500' : 'text-gray-400'}`}
              aria-label={t('card.favoriteAria')}
            >
              {fav ? <HeartIconSolid className="h-5 w-5" /> : <HeartIcon className="h-5 w-5" />}
            </button>
          </div>

          <p className="mt-2 text-xl font-bold text-primary-600">
            {formatPrice(property.price, property.purpose)}
            <span className="ml-1 text-xs font-medium text-gray-400">
              {property.purpose === 'rent' ? '' : `(${t('card.emiMo', { price: formatPrice(Math.round(property.price / 12), 'rent') })})`}
            </span>
          </p>

          <div className="mt-3 flex items-center gap-4 border-t border-gray-100 pt-3 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-300">
            {property.bedrooms > 0 && (
              <span className="flex items-center gap-1"><BedDoubleIcon className="h-4 w-4" /> {t('card.bhk', { count: property.bedrooms })}</span>
            )}
            {property.bathrooms > 0 && (
              <span className="flex items-center gap-1"><BathIcon className="h-4 w-4" /> {t('card.bath', { count: property.bathrooms })}</span>
            )}
            <span className="flex items-center gap-1"><RulerIcon className="h-4 w-4" /> {formatArea(property.area)}</span>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm">
              <span className="text-accent">★</span> {property.rating || t('card.new')}
              {(property.ratingCount ?? 0) > 0 && <span className="text-xs text-gray-400"> ({property.ratingCount})</span>}
            </span>
            <span className="text-xs text-gray-400">👁 {property.views || 0}</span>
          </div>

          {compareMode && (
            <button
              onClick={(e: FormEvent) => {
                e.preventDefault();
                onCompareToggle?.(property);
              }}
              className={`btn mt-3 w-full ${isCompared ? 'btn-primary' : 'btn-outline'}`}
            >
              {isCompared ? t('card.addedToCompare') : t('card.addToCompare')}
            </button>
          )}
        </div>
      </Link>
    </div>
  );
}