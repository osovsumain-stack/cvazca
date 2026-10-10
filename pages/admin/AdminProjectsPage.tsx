import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, Hash, Building2, Calendar, Wallet } from 'lucide-react';
import { repositories } from '@/repositories';
import { formatRubles } from '@/services/projectPricingService';
import type { BusinessProject, BusinessProjectStatus, Organization } from '@/types/platform';

const statusLabels: Record<BusinessProjectStatus, string> = {
  draft: 'Черновик', calculated: 'Расчёт', documents: 'Документы',
  payment_pending: 'Оплата', paid: 'Оплачено', in_progress: 'В работе',
  completed: 'Завершён', cancelled: 'Отменён',
};

const statusColors: Record<BusinessProjectStatus, string> = {
  draft: '#64748b', calculated: '#19b5fe', documents: '#22d3ee',
  payment_pending: '#f59e0b', paid: '#16a34a', in_progress: '#2dd4bf',
  completed: '#0ea5e9', cancelled: '#ef4444',
};

const filters: { value: BusinessProjectStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'draft', label: 'Черновики' },
  { value: 'calculated', label: 'Расчёт' },
  { value: 'documents', label: 'Документы' },
  { value: 'payment_pending', label: 'Оплата' },
  { value: 'paid', label: 'Оплачено' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'completed', label: 'Завершённые' },
  { value: 'cancelled', label: 'Отменённые' },
];

export function AdminProjectsPage() {
  const [projects, setProjects] = useState<BusinessProject[]>([]);
  const [orgs, setOrgs] = useState<Map<string, Organization>>(new Map());
  const [filter, setFilter] = useState<BusinessProjectStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const ps = await repositories.businessProject.getAll();
      const os = await repositories.organization.getAll();
      const orgMap = new Map(os.map((o) => [o.id, o]));
      setProjects(ps);
      setOrgs(orgMap);
      setLoading(false);
    })().catch(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? projects : projects.filter((p) => p.status === filter);

  return (
    <div className="dashboard-page">
      <div className="dashboard-body">
        <div className="dashboard-header">
          <h1>Проекты</h1>
          <p>Управление проектами бизнеса</p>
        </div>

        <div className="filter-tabs" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
          {filters.map((f) => (
            <button
              key={f.value}
              className={`platform-nav-btn ${filter === f.value ? 'primary' : 'ghost'}`}
              style={{ fontSize: 13, padding: '6px 14px' }}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ color: 'var(--muted)' }}>Загрузка...</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>Нет проектов</p>
        ) : (
          <div className="vacancy-list">
            {filtered.map((p) => {
              const org = orgs.get(p.organizationId);
              return (
                <Link to={`/admin/projects/${p.id}`} key={p.id} className="vacancy-card" style={{ textDecoration: 'none' }}>
                  <div className="vacancy-card-header">
                    <h3>{p.title}</h3>
                    <span className="vacancy-status-badge" style={{ color: statusColors[p.status], background: `${statusColors[p.status]}14` }}>
                      {statusLabels[p.status]}
                    </span>
                  </div>
                  <div className="vacancy-card-meta">
                    <span><Hash size={13} /> {p.publicNumber}</span>
                    <span><Building2 size={13} /> {org?.shortName || org?.name || '—'}</span>
                    <span><Wallet size={13} /> {p.totalAmountKopecks > 0 ? `${formatRubles(p.totalAmountKopecks)} ₽` : 'Ожидает расчёта'}</span>
                    <span><Calendar size={13} /> {new Date(p.createdAt).toLocaleDateString('ru-RU')}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
