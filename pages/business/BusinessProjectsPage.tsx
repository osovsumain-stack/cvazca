import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, Plus, Building2, Calendar, ArrowRight, Hash } from 'lucide-react';
import { useAuth } from '@/services/authContext';
import { useOrgScope } from '@/services/orgScopeContext';
import { repositories } from '@/repositories';
import { formatRubles } from '@/services/projectPricingService';
import { canManageProjects } from '@/services/permissions';
import type { BusinessProject, BusinessProjectStatus, BusinessProjectType, Organization } from '@/types/platform';
import { EmptyState } from '@/components/EmptyState';

const statusLabels: Record<BusinessProjectStatus, string> = {
  draft: 'Черновик',
  calculated: 'Рассчитан',
  documents: 'Документы',
  payment_pending: 'Ожидает оплаты',
  paid: 'Оплачен',
  in_progress: 'В работе',
  completed: 'Завершён',
  cancelled: 'Отменён',
};

const statusColors: Record<BusinessProjectStatus, string> = {
  draft: 'var(--muted)',
  calculated: '#d97706',
  documents: '#d97706',
  payment_pending: '#d97706',
  paid: '#16a34a',
  in_progress: 'var(--blue)',
  completed: '#16a34a',
  cancelled: '#ef4444',
};

const typeLabels: Record<BusinessProjectType, string> = {
  advertising: 'Реклама',
  marketing: 'Маркетинг',
  design: 'Дизайн',
  website: 'Сайт',
  ai: 'AI',
  hr: 'HR',
  other: 'Другое',
};

type Tab = 'active' | 'completed' | 'drafts';

export function BusinessProjectsPage() {
  const { account } = useAuth();
  const { activeRole } = useOrgScope();
  const canCreate = canManageProjects(activeRole);
  const [projects, setProjects] = useState<BusinessProject[]>([]);
  const [orgs, setOrgs] = useState<Map<string, Organization>>(new Map());
  const [tab, setTab] = useState<Tab>('active');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!account) { setLoading(false); return; }
      const ps = await repositories.businessProject.getByAccountOrganizations(account.id);
      setProjects(ps);
      const os = await repositories.organization.getByAccountId(account.id);
      setOrgs(new Map(os.map((o) => [o.id, o])));
      setLoading(false);
    })().catch(() => setLoading(false));
  }, [account]);

  if (loading) {
    return <div className="dashboard-page"><div className="dashboard-body"><p style={{ color: 'var(--muted)' }}>Загрузка...</p></div></div>;
  }

  const activeStatuses: BusinessProjectStatus[] = ['calculated', 'documents', 'payment_pending', 'paid', 'in_progress'];
  const filtered = projects.filter((p) => {
    if (tab === 'active') return activeStatuses.includes(p.status);
    if (tab === 'completed') return p.status === 'completed';
    if (tab === 'drafts') return p.status === 'draft' || p.status === 'cancelled';
    return true;
  });

  return (
    <div className="dashboard-page">
      <div className="dashboard-body">
        <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1>Проекты</h1>
            <p>Управление заказами и услугами</p>
          </div>
        </div>

        <div className="team-tabs">
          <button className={`team-tab ${tab === 'active' ? 'active' : ''}`} onClick={() => setTab('active')}>
            <FolderKanban size={16} /> Активные
          </button>
          <button className={`team-tab ${tab === 'completed' ? 'active' : ''}`} onClick={() => setTab('completed')}>
            <FolderKanban size={16} /> Завершённые
          </button>
          <button className={`team-tab ${tab === 'drafts' ? 'active' : ''}`} onClick={() => setTab('drafts')}>
            <FolderKanban size={16} /> Черновики
          </button>
        </div>

        {canCreate && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <Link to="/business/projects/new" className="platform-nav-btn primary">
              <Plus size={16} /> Создать проект
            </Link>
          </div>
        )}

        {filtered.length === 0 ? (
          <EmptyState
            icon={<FolderKanban size={32} />}
            title="Нет проектов"
            description={canCreate ? "Создайте первый проект — он появится здесь" : "Проекты появятся здесь, когда их создаст владелец или администратор организации"}
            action={canCreate ? <Link to="/business/projects/new" className="platform-nav-btn primary"><Plus size={16} /> Создать первый проект</Link> : undefined}
          />
        ) : (
          <div className="vacancy-list">
            {filtered.map((p) => {
              const org = orgs.get(p.organizationId);
              return (
                <Link to={`/business/projects/${p.id}`} key={p.id} className="vacancy-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="vacancy-card-header">
                    <h3>{p.title}</h3>
                    <span className="vacancy-status-badge" style={{ color: statusColors[p.status], background: `${statusColors[p.status]}14` }}>
                      {statusLabels[p.status]}
                    </span>
                  </div>
                  <div className="vacancy-card-meta">
                    <span><Hash size={13} /> {p.publicNumber}</span>
                    <span><Building2 size={13} /> {org?.shortName || org?.name || 'Организация'}</span>
                    <span>{typeLabels[p.type]}</span>
                    <span>{p.totalAmountKopecks > 0 ? `${formatRubles(p.totalAmountKopecks)} ₽` : 'Ожидает расчёта'}</span>
                    <span><Calendar size={13} /> {new Date(p.createdAt).toLocaleDateString('ru-RU')}</span>
                  </div>
                  <div className="vacancy-card-actions" style={{ justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: 13, color: 'var(--blue)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      Открыть <ArrowRight size={14} />
                    </span>
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
