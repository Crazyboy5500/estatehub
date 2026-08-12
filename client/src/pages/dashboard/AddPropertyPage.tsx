import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { propertyService } from '../../services/propertyService';
import { handleError } from '../../services/api';
import { compressImage } from '../../utils/helpers';
import { PROPERTY_TYPES, AMENITIES_LIST, CITIES_INDIA } from '../../utils/format';
import { PhotoIcon } from '@heroicons/react/24/outline';
import type { Property } from '../../types';

interface PropertyFormValues {
  title: string;
  description: string;
  type: string;
  purpose: 'sale' | 'rent';
  price: number;
  area: number;
  age?: number;
  bedrooms?: number;
  bathrooms?: number;
  parking?: number;
  floors?: number;
  totalFloors?: number;
  furnished?: string;
  address: string;
  city: string;
  state: string;
  pincode?: string;
  video?: string;
  panorama?: string;
  lat?: number;
  lng?: number;
}

interface Draft {
  values: Partial<PropertyFormValues>;
  amenities: string[];
  savedAt: number;
}

const DRAFT_KEY = 'estatehub_property_draft';

export default function AddPropertyPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { register, handleSubmit, watch, setValue, reset } = useForm<PropertyFormValues>();
  const { t } = useTranslation();
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [existingVideo, setExistingVideo] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(false);
  const { notify, catchError } = useAuth();
  const navigate = useNavigate();

  const values = watch();

  useEffect(() => {
    if (isEdit) return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) setDraft(JSON.parse(raw) as Draft);
    } catch {
      /* ignore corrupted draft */
    }
  }, [isEdit]);

  useEffect(() => {
    if (isEdit) return;
    const hasContent = Object.values(values).some(
      (v) => v !== undefined && v !== null && v !== '' && v !== 0
    );
    if (!hasContent) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ values, amenities, savedAt: Date.now() }));
      } catch {
        /* storage full or unavailable */
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [values, amenities, isEdit]);

  const continueDraft = (): void => {
    if (!draft) return;
    reset(draft.values || {});
    setAmenities(draft.amenities || []);
    setDraft(null);
  };

  const discardDraft = (): void => {
    localStorage.removeItem(DRAFT_KEY);
    setDraft(null);
    reset({});
    setAmenities([]);
  };

  useEffect(() => {
    if (!isEdit || !id) return;
    propertyService
      .getProperty(id)
      .then(({ data }) => {
        const p = data.data as Property;
        reset({
          title: p.title, description: p.description, type: p.type, purpose: p.purpose,
          price: p.price, area: p.area, bedrooms: p.bedrooms, bathrooms: p.bathrooms,
          floors: p.floors, totalFloors: p.totalFloors, parking: p.parking,
          furnished: p.furnished, age: p.age, address: p.address, city: p.city,
          state: p.state, pincode: p.pincode, lat: p.coordinates?.lat, lng: p.coordinates?.lng,
          video: p.video || '', panorama: p.panorama || '',
        });
        setExistingImages(p.images || []);
        setExistingVideo(p.video || '');
        setAmenities(p.amenities || []);
      })
      .catch((err) => catchError(err, t('addProp.loadFailed')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEdit]);

  const onFiles = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const list = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...list]);
    const compressed = await Promise.all(list.map((f) => compressImage(f).catch(() => f)));
    setPreviews((prev) => [...prev, ...compressed.map((blob) => URL.createObjectURL(blob))]);
  };

  const removePreview = (idx: number): void => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleAmenity = (a: string): void => {
    setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  };

  const onSubmit = async (data: PropertyFormValues): Promise<void> => {
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([k, v]) => {
        if (k === 'video' && videoFile) return;
        if (v !== undefined && v !== null && v !== '') formData.append(k, String(v));
      });
      files.forEach((f) => formData.append('images', f));
      if (videoFile) formData.append('video', videoFile);
      if (isEdit && !videoFile && !existingVideo) formData.set('video', '');
      formData.append('amenities', JSON.stringify(amenities));
      if (isEdit) formData.append('existingImages', existingImages.join(','));

      if (isEdit && id) {
        await propertyService.update(id, formData);
        notify(t('addProp.updated'));
      } else {
        await propertyService.create(formData);
        notify(t('addProp.submitted'));
      }
      localStorage.removeItem(DRAFT_KEY);
      navigate('/dashboard/owner');
    } catch (error) {
      catchError(error, t('addProp.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  const coords = watch('lat') && watch('lng');

  return (
    <div className="mx-auto max-w-4xl">
      <h2 className="text-xl font-bold">{isEdit ? t('addProp.editTitle') : t('addProp.title')}</h2>
      <p className="text-sm text-gray-500">
        {isEdit ? t('addProp.editSubtitle') : t('addProp.subtitle')}
      </p>

      {!isEdit && draft && (
        <div className="card mt-4 flex flex-col gap-3 border-l-4 border-primary-500 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            <p className="font-semibold">
              {t('addProp.draftFound')}
              {draft.values?.title ? <> — {draft.values.title}</> : null}
            </p>
            <p className="text-gray-500">
              {t('addProp.lastSaved', { time: draft.savedAt ? new Date(draft.savedAt).toLocaleString() : '' })}
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={continueDraft} className="btn-primary text-sm">{t('addProp.continueDraft')}</button>
            <button type="button" onClick={discardDraft} className="btn-outline text-sm">{t('addProp.startNew')}</button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-8">
        <section className="card space-y-4 p-6">
          <h3 className="font-bold">{t('addProp.basicInfo')}</h3>
          <div>
            <label className="label">{t('addProp.propertyTitle')}</label>
            <input className="input" placeholder={t('addProp.titlePlaceholder')} {...register('title', { required: true })} />
          </div>
          <div>
            <label className="label">{t('addProp.description')}</label>
            <textarea className="input" rows={4} placeholder={t('addProp.descPlaceholder')} {...register('description', { required: true })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">{t('addProp.propertyType')}</label>
              <select className="input" {...register('type', { required: true })}>
                {PROPERTY_TYPES.map((pt) => <option key={pt} value={pt}>{pt}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t('addProp.purpose')}</label>
              <select className="input" {...register('purpose', { required: true })}>
                <option value="sale">{t('addProp.forSale')}</option>
                <option value="rent">{t('addProp.forRent')}</option>
              </select>
            </div>
          </div>
        </section>

        <section className="card space-y-4 p-6">
          <h3 className="font-bold">{t('addProp.pricingSpecs')}</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label">{t('addProp.price')}</label>
              <input type="number" className="input" placeholder="6500000" {...register('price', { required: true, min: 1 })} />
            </div>
            <div>
              <label className="label">{t('addProp.area')}</label>
              <input type="number" className="input" placeholder="1200" {...register('area', { required: true, min: 1 })} />
            </div>
            <div>
              <label className="label">{t('addProp.age')}</label>
              <input type="number" className="input" placeholder="0" {...register('age')} />
            </div>
            <div>
              <label className="label">{t('addProp.bedrooms')}</label>
              <input type="number" className="input" placeholder="3" {...register('bedrooms')} />
            </div>
            <div>
              <label className="label">{t('addProp.bathrooms')}</label>
              <input type="number" className="input" placeholder="2" {...register('bathrooms')} />
            </div>
            <div>
              <label className="label">{t('addProp.parking')}</label>
              <input type="number" className="input" placeholder="1" {...register('parking')} />
            </div>
            <div>
              <label className="label">{t('addProp.floor')}</label>
              <input type="number" className="input" placeholder="2" {...register('floors')} />
            </div>
            <div>
              <label className="label">{t('addProp.totalFloors')}</label>
              <input type="number" className="input" placeholder="12" {...register('totalFloors')} />
            </div>
            <div>
              <label className="label">{t('addProp.furnishing')}</label>
              <select className="input" {...register('furnished')}>
                <option value="Unfurnished">{t('addProp.unfurnished')}</option>
                <option value="Semi-Furnished">{t('addProp.semiFurnished')}</option>
                <option value="Fully-Furnished">{t('addProp.fullyFurnished')}</option>
              </select>
            </div>
          </div>
        </section>

        <section className="card space-y-4 p-6">
          <h3 className="font-bold">{t('addProp.location')}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">{t('addProp.address')}</label>
              <input className="input" placeholder={t('addProp.addressPlaceholder')} {...register('address', { required: true })} />
            </div>
            <div>
              <label className="label">{t('addProp.city')}</label>
              <input className="input" list="cities-list" placeholder="Delhi" {...register('city', { required: true })} />
              <datalist id="cities-list">
                {CITIES_INDIA.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div>
              <label className="label">{t('addProp.state')}</label>
              <input className="input" placeholder="Delhi" {...register('state', { required: true })} />
            </div>
            <div>
              <label className="label">{t('addProp.pincode')}</label>
              <input className="input" placeholder="110001" {...register('pincode')} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">{t('addProp.videoTour')}</label>
              <div className="flex flex-col gap-2 rounded-xl border border-dashed border-gray-300 p-3 dark:border-gray-700">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="btn-outline cursor-pointer text-sm">
                    {t('addProp.chooseVideo')}
                    <input type="file" accept="video/*" className="hidden" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} />
                  </label>
                  {videoFile ? (
                    <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(1)} MB)
                      <button type="button" onClick={() => setVideoFile(null)} className="text-red-500 hover:underline">{t('addProp.remove')}</button>
                    </span>
                  ) : existingVideo ? (
                    <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      {t('addProp.currentVideo')}
                      <button type="button" onClick={() => setExistingVideo('')} className="text-red-500 hover:underline">{t('addProp.remove')}</button>
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">{t('addProp.videoFormat')}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="shrink-0">{t('addProp.orPasteUrl')}</span>
                  <input className="input flex-1 py-1.5 text-xs" placeholder="https://…" {...register('video')} />
                </div>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="label">{t('addProp.panorama')}</label>
              <input className="input" placeholder="https://…/equirectangular-360.jpg" {...register('panorama')} />
              <p className="mt-1 text-xs text-gray-400">{t('addProp.panoramaHelp')}</p>
            </div>
            <div>
              <label className="label">{t('addProp.latitude')}</label>
              <input type="number" step="any" className="input" placeholder="28.6139" {...register('lat')} />
            </div>
            <div>
              <label className="label">{t('addProp.longitude')}</label>
              <input type="number" step="any" className="input" placeholder="77.2090" {...register('lng')} />
            </div>
          </div>
          {coords && (
            <p className="badge-green">{t('addProp.coordsBadge', { coords: String(coords) })}</p>
          )}
        </section>

        <section className="card space-y-4 p-6">
          <h3 className="font-bold">{t('addProp.imagesAmenities')}</h3>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 p-8 text-center hover:border-primary-500 dark:border-gray-700">
            <PhotoIcon className="h-10 w-10 text-gray-400" />
            <span className="mt-2 text-sm font-medium">{t('addProp.uploadImages')}</span>
            <span className="text-xs text-gray-400">{t('addProp.uploadFormat')}</span>
            <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => void onFiles(e)} />
          </label>

          {existingImages.length > 0 && (
            <div>
              <p className="mb-2 text-sm text-gray-500">{t('addProp.existingImages')}</p>
              <div className="flex flex-wrap gap-2">
                {existingImages.map((img, i) => (
                  <div key={i} className="relative">
                    <img src={img} alt="" className="h-20 w-28 rounded-lg object-cover" />
                    <button
                      type="button"
                      onClick={() => setExistingImages(existingImages.filter((_, idx) => idx !== i))}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {previews.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {previews.map((p, i) => (
                <div key={i} className="relative">
                  <img src={p} alt="" className="h-20 w-28 rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={() => removePreview(i)}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="label">{t('addProp.amenities')}</label>
            <div className="flex flex-wrap gap-2">
              {AMENITIES_LIST.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAmenity(a)}
                  className={`rounded-full px-3 py-1.5 text-sm transition ${
                    amenities.includes(a)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                  }`}
                >
                  {amenities.includes(a) ? '✓ ' : ''}{a}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-outline flex-1">{t('addProp.cancel')}</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? t('addProp.saving') : isEdit ? t('addProp.updateProperty') : t('addProp.submitForVerification')}
          </button>
        </div>
      </form>
    </div>
  );
}