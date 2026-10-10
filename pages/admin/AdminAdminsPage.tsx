import { useState, useEffect } from 'react';
import { UserCog, Plus, Trash2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { adminGrantRepository, accountRepository } from '@/repositories/mockRepositories';
import { normalizeVkId } from '@/services/vkAuthService';
import { useAuth } from '@/services/authContext';
import type { AdminGrant } from '@/types/platform';
import { EmptyState } from '@/components/EmptyState';

const PRIMARY_ADMIN_VK_ID = '';

export function AdminAdminsPage() {
  const { account } = useAuth();
  const [grants, setGrants] = useState<AdminGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    const all = await adminGrantRepository.getAll();
    setGrants(all);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    setError('');
    const vkId = normalizeVkId(input);
    if (!vkId) {
      setError('Введите VK ID или ссылку на профиль VK (например: https://vk.ru/id444235799)');
      return;
    }
    const existing = await adminGrantRepository.getByVkUserId(vkId);
    if (existing) {
      setError('Этот VK ID уже в списке администраторов');
      return;
    }
    const displayName = `VK ID: ${vkId}`;
    await adminGrantRepository.grant(vkId, displayName, account?.id ?? null);
    setInput('');
    await load();
  };

  const handleRevoke = async (id: string) => {
    const grant = grants.find((g) => g.id === id);
    if (!grant) return;
    if (grant.vkUserId === PRIMARY_ADMIN_VK_ID) return;
    await adminGrantRepository.revoke(id);
    await load();
  };

  if (loading) {
    return <div className="dashboard-page"><div className="dashboard-body"><p style={{ color: 'var(--muted)' }}>Загрузка...</p></div></div>;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-body">
        <div className="dashboard-header">
          <h1>Администраторы</h1>
          <p>Управление доступом к панели администратора</p>
        </div>

        <div style={{ marginBottom: 24, padding: '16px 20px', borderRadius: 12, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#d97706', marginBottom: 4 }}>
            <AlertTriangle size={16} /> Управление доступом
          </div>
          <p style={{ fontSize: 12, color: '#d97706', margin: 0, lineHeight: 1.5 }}>
            Права назначаются сервером и хранятся в базе. Администраторы, указанные в настройках сервера, управляются владельцем сервера.
          </p>
        </div>

        <div className="create-form" style={{ marginBottom: 24 }}>
          <h3>Добавить администратора</h3>
          <input
            className="form-input"
            placeholder="VK ID или ссылка (например: https://vk.ru/id444235799)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          />
          {error && <p style={{ fontSize: 13, color: '#ef4444', marginTop: 4 }}>{error}</p>}
          <div className="create-form-actions">
            <button className="platform-nav-btn primary" onClick={handleAdd} disabled={!input.trim()}>
              <Plus size={16} /> Добавить
            </button>
          </div>
        </div>

        {grants.length === 0 ? (
          <EmptyState icon={<UserCog size={32} />} title="Нет администраторов" description="Добавьте администратора выше" />
        ) : (
          <div className="vacancy-list">
            {grants.map((g) => (
              <div className="vacancy-card" key={g.id}>
                <div className="vacancy-card-header">
                  <h3>{g.displayName}</h3>
                  <span className="vacancy-status-badge" style={{ color: g.isPrimary ? '#d97706' : 'var(--blue)', background: g.isPrimary ? 'rgba(245,158,11,0.08)' : 'rgba(25,181,254,0.08)' }}>
                    {g.isPrimary ? <><ShieldCheck size={12} /> Основной</> : 'Администратор'}
                  </span>
                </div>
                <div className="vacancy-card-meta">
                  <span>VK ID: {g.vkUserId}</span>
                  <span>Назначен: {new Date(g.grantedAt).toLocaleDateString('ru-RU')}</span>
                  {g.grantedBy && <span>Кем: {g.grantedBy}</span>}
                </div>
                {!g.isPrimary && (
                  <div className="vacancy-card-actions">
                    <button className="platform-nav-btn ghost" onClick={() => handleRevoke(g.id)} style={{ color: '#ef4444' }}>
                      <Trash2 size={14} /> Удалить
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
