import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { userService } from '../../services/userService';
import { useAuth } from '../../hooks/useAuth';
import { handleError } from '../../services/api';
import { Spinner, EmptyState } from '../../components/ui';
import { getInitials, formatDate } from '../../utils/format';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import type { User } from '../../types';

export default function AdminUsersPage() {
  const { notify, catchError } = useAuth();
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [role, setRole] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);

  const load = (): void => {
    setLoading(true);
    userService
      .getUsers({ page: String(page), limit: '20', role, keyword })
      .then(({ data }) => {
        setUsers(data.data);
        setTotal(data.total);
        setPages(data.pages);
      })
      .catch((err) => catchError(err, t('admin.usersLoadFailed')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, role]);

  const block = async (user: User): Promise<void> => {
    try {
      await userService.toggleBlock(user._id);
      notify(t('admin.blockedToast', { name: user.name, action: user.isBlocked ? t('admin.unblock') : t('admin.block') }));
      load();
    } catch (error) {
      catchError(error, t('admin.actionFailed'));
    }
  };

  const remove = async (user: User): Promise<void> => {
    if (!window.confirm(t('admin.deleteUserConfirm', { name: user.name }))) return;
    try {
      await userService.remove(user._id);
      notify(t('admin.userDeleted'));
      load();
    } catch (error) {
      catchError(error, t('admin.deleteFailed'));
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold">{t('admin.userManagement')}</h2>
      <p className="text-sm text-gray-500">{t('admin.registeredUsers', { total: total.toLocaleString('en-IN') })}</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder={t('admin.searchByName')}
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select className="input w-40" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
          <option value="all">{t('admin.allRoles')}</option>
          <option value="buyer">{t('admin.buyer')}</option>
          <option value="owner">{t('admin.owner')}</option>
          <option value="admin">{t('admin.admin')}</option>
        </select>
        <button onClick={load} className="btn-primary">{t('common.search')}</button>
      </div>

      {loading ? (
        <Spinner />
      ) : users.length === 0 ? (
        <div className="mt-8"><EmptyState icon="👥" title={t('admin.noUsers')} /></div>
      ) : (
        <div className="card mt-6 overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-gray-200 dark:border-gray-800">
              <tr className="text-xs uppercase text-gray-500">
                <th className="px-4 py-3">{t('admin.colUser')}</th>
                <th className="px-4 py-3">{t('admin.colRole')}</th>
                <th className="px-4 py-3">{t('admin.colJoined')}</th>
                <th className="px-4 py-3">{t('admin.colVerified')}</th>
                <th className="px-4 py-3">{t('admin.colStatus')}</th>
                <th className="px-4 py-3 text-right">{t('admin.colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {u.profileImage ? (
                        <img src={u.profileImage} alt="" className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
                          {getInitials(u.name)}
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className={`badge ${u.role === 'admin' ? 'badge-red' : u.role === 'owner' ? 'badge-blue' : 'badge-gray'}`}>{t(`admin.${u.role}` as 'admin.buyer' | 'admin.owner' | 'admin.admin')}</span></td>
                  <td className="px-4 py-3 text-gray-500">{u.createdAt ? formatDate(u.createdAt) : '—'}</td>
                  <td className="px-4 py-3">{u.isEmailVerified ? <span className="badge-green">✓</span> : <span className="badge-red">✕</span>}</td>
                  <td className="px-4 py-3">{u.isBlocked ? <span className="badge-red">{t('admin.blocked')}</span> : <span className="badge-green">{t('admin.active')}</span>}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => void block(u)} className={`badge ${u.isBlocked ? 'badge-green' : 'badge-yellow'}`}>
                        {u.isBlocked ? t('admin.unblock') : t('admin.block')}
                      </button>
                      {u.role !== 'admin' && (
                        <button onClick={() => void remove(u)} className="badge-red">{t('admin.delete')}</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button className="btn-outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>{t('common.prev')}</button>
          <span className="text-sm text-gray-500">{t('common.pageOf', { page, pages })}</span>
          <button className="btn-outline" disabled={page >= pages} onClick={() => setPage(page + 1)}>{t('common.next')}</button>
        </div>
      )}
    </div>
  );
}