import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, Wallet, TrendingUp, Calendar, Hash, FileText } from 'lucide-react';
import { useAuth } from '@/services/authContext';
import { useOrgScope } from '@/services/orgScopeContext';
import { repositories } from '@/repositories';
import { formatRubles } from '@/services/projectPricingService';
import { canViewFinancialDocs, canManageProjects } from '@/services/permissions';
import type { BusinessProject, BusinessProjectEvent, BusinessProjectStatus, BusinessProjectType } from '@/types/platform';
import { ActivityTimeline, type TimelineEvent } from '@/components/ActivityTimeline';

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

const typeLabels: Record<BusinessProjectType, string> = {
  advertising: 'Реклама',
  marketing: 'Маркетинг',
  design: 'Дизайн',
  website: 'Сайт',
  ai: 'AI',
  hr: 'HR',
  other: 'Другое',
};

export function BusinessProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { account } = useAuth();
  const { activeOrganization, memberships, activeRole } = useOrgScope();
  const [project, setProject] = useState<BusinessProject | null>(null);
  const [events, setEvents] = useState<BusinessProjectEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [orgName, setOrgName] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id || !account) { setLoading(false); return; }
      const p = await repositories.businessProject.getById(id);
      if (cancelled) return;
      if (!p) { setLoading(false); return; }
      const isMember = memberships.some((m) => m.organizationId === p.organizationId);
      if (!isMember) { setForbidden(true); setLoading(false); return; }
      setProject(p);
      const o = await repositories.organization.getById(p.organizationId);
      if (cancelled) return;
      setOrgName(o?.shortName || o?.name || '');
      const evs = await repositories.projectEvent.getByProject(p.id);
      if (cancelled) return;
      setEvents(evs);
      setLoading(false);
    })().catch(() => setLoading(false));
    return () => { cancelled = true; };
  }, [id, account, memberships]);

  if (loading) {
    return <div className="dashboard-page"><div className="dashboard-body"><p style={{ color: 'var(--muted)' }}>Загрузка...</p></div></div>;
  }

  if (forbidden) {
    return <div className="dashboard-page"><div className="dashboard-body"><EmptyStateForbidden /></div></div>;
  }

  if (!project) {
    return <div className="dashboard-page"><div className="dashboard-body"><p style={{ color: 'var(--muted)' }}>Проект не найден</p></div></div>;
  }

  const timelineEvents: TimelineEvent[] = events.map((e) => ({
    id: e.id,
    title: e.message,
    date: e.createdAt,
    status: e.type,
  }));

  return (
    <div className="dashboard-page">
      <div className="dashboard-body">
        <Link to="/business/projects" className="platform-nav-btn ghost" style={{ marginBottom: 16 }}>
          <ArrowLeft size={16} /> Назад к проектам
        </Link>

        <div className="vacancy-detail">
          <div className="vacancy-detail-header">
            <div>
              <h1>{project.title}</h1>
              <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>
                <Hash size={13} /> {project.publicNumber} · {typeLabels[project.type]} · {orgName}
              </p>
            </div>
            <span className="vacancy-status-badge" style={{ color: 'var(--blue)', background: 'rgba(25,181,254,0.08)', fontSize: 14, padding: '6px 14px' }}>
              {statusLabels[project.status]}
            </span>
          </div>

          <div className="vacancy-detail-section">
            <h3>Финансы</h3>
            {!canViewFinancialDocs(activeRole) ? (
              <div style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(0,0,0,0.02)', border: '1px solid var(--line)', fontSize: 14, color: 'var(--muted)', marginTop: 12 }}>
                Финансовые данные доступны ролям: владелец, администратор, бухгалтер.
              </div>
            ) : project.totalAmountKopecks > 0 ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 12 }}>
                  <FinanceCard icon={<Wallet size={18} />} label="Подрядчику" value={`${formatRubles(project.providerAmountKopecks)} ₽`} />
                  <FinanceCard icon={<TrendingUp size={18} />} label="Комиссия СВЯЗКА" value={`${formatRubles(project.platformFeeKopecks)} ₽`} />
                  <FinanceCard icon={<Building2 size={18} />} label="Итого бюджет" value={`${formatRubles(project.totalAmountKopecks)} ₽`} highlight />
                </div>
                {project.pricingVersion && <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>Версия расчёта: {project.pricingVersion}</p>}
                <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8 }}>
                  Комиссия платформы начисляется сверху, не вычитается из суммы подрядчика.
                </p>
              </>
            ) : (
              <div style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', fontSize: 14, fontWeight: 600, color: '#b45309', marginTop: 12 }}>
                Ожидает расчёта
              </div>
            )}
          </div>

          <div className="vacancy-detail-section">
            <h3>Задача</h3>
            <div className="profile-fields">
              {project.brief.description && <div className="profile-field"><span className="profile-field-label">Описание</span><span className="profile-field-value">{project.brief.description}</span></div>}
              {project.brief.city && <div className="profile-field"><span className="profile-field-label">Город</span><span className="profile-field-value">{project.brief.city}</span></div>}
              {project.brief.deadline && <div className="profile-field"><span className="profile-field-label">Срок</span><span className="profile-field-value"><Calendar size={13} /> {project.brief.deadline}</span></div>}
              {project.brief.budgetKopecks > 0 && <div className="profile-field"><span className="profile-field-label">Бюджет</span><span className="profile-field-value">{formatRubles(project.brief.budgetKopecks)} ₽</span></div>}
              {project.brief.advertiserName && <div className="profile-field"><span className="profile-field-label">Рекламодатель</span><span className="profile-field-value">{project.brief.advertiserName}</span></div>}
              {project.brief.advertiserInn && <div className="profile-field"><span className="profile-field-label">ИНН рекламодателя</span><span className="profile-field-value">{project.brief.advertiserInn}</span></div>}
              {project.brief.erid && <div className="profile-field"><span className="profile-field-label">ERID</span><span className="profile-field-value">{project.brief.erid}</span></div>}
              {project.brief.ordProvider && <div className="profile-field"><span className="profile-field-label">ОРД-провайдер</span><span className="profile-field-value">{project.brief.ordProvider}</span></div>}
              {project.brief.comment && <div className="profile-field"><span className="profile-field-label">Комментарий</span><span className="profile-field-value">{project.brief.comment}</span></div>}
              {Object.entries(project.brief.extra || {}).filter(([, v]) => v).map(([k, v]) => (
                <div className="profile-field" key={k}><span className="profile-field-label">{k}</span><span className="profile-field-value">{v}</span></div>
              ))}
            </div>
          </div>

          <div className="vacancy-detail-section">
            <h3>Информация</h3>
            <div className="profile-fields">
              <div className="profile-field"><span className="profile-field-label">Тип</span><span className="profile-field-value">{typeLabels[project.type]}</span></div>
              <div className="profile-field"><span className="profile-field-label">Организация</span><span className="profile-field-value">{orgName || '—'}</span></div>
              <div className="profile-field"><span className="profile-field-label">Создан</span><span className="profile-field-value"><Calendar size={13} /> {new Date(project.createdAt).toLocaleDateString('ru-RU')}</span></div>
              <div className="profile-field"><span className="profile-field-label">Обновлён</span><span className="profile-field-value"><Calendar size={13} /> {new Date(project.updatedAt).toLocaleDateString('ru-RU')}</span></div>
            </div>
          </div>

          {timelineEvents.length > 0 && (
            <div className="vacancy-detail-section">
              <h3>История проекта</h3>
              <ActivityTimeline events={timelineEvents} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FinanceCard({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{
      padding: 16,
      borderRadius: 12,
      background: highlight ? 'rgba(25,181,254,0.06)' : 'var(--glass)',
      border: `1px solid ${highlight ? 'rgba(25,181,254,0.2)' : 'var(--glass-border)'}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', fontSize: 13, marginBottom: 6 }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: highlight ? 'var(--blue)' : 'var(--ink)' }}>
        {value}
      </div>
    </div>
  );
}

function EmptyStateForbidden() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Нет доступа</h2>
      <p style={{ color: 'var(--muted)', fontSize: 14 }}>У вас нет доступа к этому проекту</p>
      <Link to="/business/projects" className="platform-nav-btn ghost" style={{ marginTop: 16 }}>Вернуться к проектам</Link>
    </div>
  );
}
