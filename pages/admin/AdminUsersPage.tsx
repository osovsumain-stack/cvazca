import { useState, useEffect } from 'react';
import { Users, Search } from 'lucide-react';
import { accountRepository, candidateRepository } from '@/repositories/mockRepositories';
import type { PlatformAccount, CandidateProfile } from '@/types/platform';
import { EmptyState } from '@/components/EmptyState';

export function AdminUsersPage() {
  const [accounts, setAccounts] = useState<PlatformAccount[]>([]);
  const [profiles, setProfiles] = useState<Map<string, CandidateProfile>>(new Map());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      const all = await accountRepository.getAll();
      setAccounts(all);
      const profileMap = new Map<string, CandidateProfile>();
      for (const acc of all) {
        const p = await candidateRepository.getProfile(acc.id);
        if (p) profileMap.set(acc.id, p);
      }
      setProfiles(profileMap);
      setLoading(false);
    })().catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="dashboard-page"><div className="dashboard-body"><p style={{ color: 'var(--muted)' }}>Загрузка...</p></div></div>;
  }

  const filtered = accounts.filter((a) => {
    const q = search.toLowerCase();
    return a.displayName.toLowerCase().includes(q) || (a.email || '').toLowerCase().includes(q) || (a.vkUserId || '').includes(q);
  });

  return (
    <div className="dashboard-page">
      <div className="dashboard-body">
        <div className="dashboard-header">
          <h1>Пользователи</h1>
          <p>Зарегистрированные аккаунты платформы</p>
        </div>

        <div style={{ position: 'relative', marginBottom: 20 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input
            className="form-input"
            placeholder="Поиск по имени, email, VK ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 36 }}
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={<Users size={32} />} title="Нет пользователей" description={search ? 'Ничего не найдено' : 'Пользователи появятся после регистрации'} />
        ) : (
          <div className="vacancy-list">
            {filtered.map((acc) => {
              const profile = profiles.get(acc.id);
              return (
                <div className="vacancy-card" key={acc.id}>
                  <div className="vacancy-card-header">
                    <h3>{acc.displayName}</h3>
                    <span className="vacancy-status-badge" style={{ color: 'var(--blue)', background: 'rgba(25,181,254,0.08)' }}>
                      {acc.roles.includes('admin') ? 'Админ' : acc.roles.includes('business_member') ? 'Бизнес' : 'Кандидат'}
                    </span>
                  </div>
                  <div className="vacancy-card-meta">
                    {acc.email && <span>{acc.email}</span>}
                    {acc.vkUserId && <span>VK: {acc.vkUserId}</span>}
                    {profile && <span>Профиль: {profile.profession || 'не заполнен'}</span>}
                    {profile?.isMinor && <span style={{ color: '#d97706' }}>Несовершеннолетний</span>}
                    <span>{new Date(acc.createdAt).toLocaleDateString('ru-RU')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
