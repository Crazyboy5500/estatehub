import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import { getInitials } from '../../utils/format';
import { CameraIcon } from '@heroicons/react/24/outline';
import type { ChangeEvent, FormEvent } from 'react';

interface ProfileFormData {
  name: string;
  phone?: string;
  bio?: string;
  location?: string;
}

export default function ProfilePage() {
  const { user, updateProfile, notify, catchError } = useAuth();
  const { t } = useTranslation();
  const { register, handleSubmit } = useForm<ProfileFormData>({
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
      location: user?.location || '',
    },
  });
  const [saving, setSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  const onSubmit = async (data: ProfileFormData): Promise<void> => {
    setSaving(true);
    try {
      await updateProfile(data);
      notify(t('profile.updated'));
    } catch (error) {
      catchError(error, t('profile.updateFailed'));
    } finally {
      setSaving(false);
    }
  };

  const onAvatar = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await updateProfile({ profileImage: reader.result as string });
        notify(t('profile.photoUpdated'));
      } catch (error) {
        catchError(error, t('profile.photoFailed'));
      }
    };
    reader.readAsDataURL(file);
  };

  const onChangePassword = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setChangingPassword(true);
    try {
      await authService.changePassword(passwordForm);
      notify(t('profile.passwordChanged'));
      setPasswordForm({ currentPassword: '', newPassword: '' });
    } catch (error) {
      catchError(error, t('profile.passwordFailed'));
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="card p-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          {user?.profileImage ? (
            <img src={user.profileImage} alt={user.name} className="h-24 w-24 rounded-full object-cover" />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-600 text-2xl font-bold text-white">
              {getInitials(user?.name || '')}
            </div>
          )}
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-bold">{user?.name}</h2>
            <p className="text-sm text-gray-500">{user?.email} • {user?.role}</p>
            <label className="btn-outline mt-3 inline-flex cursor-pointer">
              <CameraIcon className="mr-1 h-4 w-4" /> {t('profile.changePhoto')}
              <input type="file" accept="image/*" className="hidden" onChange={onAvatar} />
            </label>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">{t('profile.fullName')}</label>
            <input className="input" {...register('name')} />
          </div>
          <div>
            <label className="label">{t('profile.phone')}</label>
            <input className="input" {...register('phone')} />
          </div>
          <div>
            <label className="label">{t('profile.location')}</label>
            <input className="input" {...register('location')} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">{t('profile.bio')}</label>
            <textarea className="input" rows={3} {...register('bio')} placeholder={t('profile.bioPlaceholder')} />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={saving} className="btn-primary">{saving ? t('profile.saving') : t('profile.saveChanges')}</button>
          </div>
        </form>
      </div>

      <div className="card p-8">
        <h3 className="text-lg font-bold">{t('profile.changePassword')}</h3>
        <form onSubmit={(e) => void onChangePassword(e)} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">{t('profile.currentPassword')}</label>
            <input
              type="password"
              className="input"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">{t('profile.newPassword')}</label>
            <input
              type="password"
              className="input"
              minLength={6}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={changingPassword} className="btn-primary">
              {changingPassword ? t('profile.updating') : t('profile.updatePassword')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}