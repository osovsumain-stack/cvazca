import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Hash, Building2, Wallet, Calendar, Check, X } from 'lucide-react';
import { repositories } from '@/repositories';
import { formatRubles, rublesToKopecks, kopecksToRubles } from '@/services/projectPricingService';
import { updateProjectStatus, getAllowedTransitions } from '@/services/projectService';
import { notifyProjectStatusChanged } from '@/services/notificationService';
import type { BusinessProject, BusinessProjectStatus, Organization, BusinessProjectEvent, PlatformAccount } from '@/types/platform';

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

export function AdminProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<BusinessProject | null>(null);
  const [org, setOrg] = useState<Organization | null>(null);
  const [events, setEvents] = useState<BusinessProjectEvent[]>([]);
  const [accounts, setAccounts] = useState<Map<string, PlatformAccount>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editFinance, setEditFinance] = useState(false);
  const [providerAmountRub, setProviderAmountRub] = useState('0');
  const [platformFeeRub, setPlatformFeeRub] = useState('0');

  const load = async () => {
    if (!id) return;
    const p = await repositories.businessProject.getById(id);
    setProject(p);
    if (p) {
      const o = await repositories.organization.getById(p.organizationId);
      setOrg(o);
      const ev = await repositories.projectEvent.getByProject(p.id);
      setEvents(ev);
      setProviderAmountRub(String(kopecksToRubles(p.providerAmountKopecks)));
      setPlatformFeeRub(String(kopecksToRubles(p.platformFeeKopecks)));
    }
    const accs = await repositories.account.getAll();
    setAccounts(new Map(accs.map((a) => [a.id, a])));
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const handleTransition = async (newStatus: BusinessProjectStatus) => {
    if (!project || !id) return;
    setError(''); setSuccess('');
    try {
      const acc = await repositories.account.getCurrentAccount();
      await updateProjectStatus(project.id, newStatus, acc?.id || 'admin');
        const members = await repositories.organizationMembership.getByOrganization(project.organizationId);
      const createdEvent = events.find((e) => e.type === 'created');
      const notifyIds = new Set<string>();
      members.forEach((m) => notifyIds.add(m.accountId));
      if (createdEvent) notifyIds.add(createdEvent.actorAccountId);
      for (const notifyId of notifyIds) {
        if (notifyId && notifyId !== 'admin') {
          await notifyProjectStatusChanged(notifyId, project.title, statusLabels[newStatus]);
        }
      }
      setSuccess(`Статус изменён: ${statusLabels[newStatus]}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    }
  };

  const handleSaveFinance = async () => {
    if (!project) return;
    const providerK = rublesToKopecks(providerAmountRub);
    const feeK = rublesToKopecks(platformFeeRub);
    await repositories.businessProject.update({ ...project, providerAmountKopecks: providerK, platformFeeKopecks: feeK, totalAmountKopecks: providerK + feeK });
    setEditFinance(false);
    await load();
  };

  if (loading) {
    return <div className="dashboard-page"><div className="dashboard-body"><p style={{ color: 'var(--muted)' }}>Загрузка...</p></div></div>;
  }

  if (!project) {
    return <div className="dashboard-page"><div className="dashboard-body"><p>Проект не найден</p><Link to="/admin/projects" className="platform-nav-btn ghost">← Назад</Link></div></div>;
  }

  const allowed = getAllowedTransitions(project.status);
  const totalAmountRub = (Number(providerAmountRub) || 0) + (Number(platformFeeRub) || 0);

  return (
    <div className="dashboard-page">
      <div className="dashboard-body">
        <Link to="/admin/projects" className="platform-nav-btn ghost" style={{ marginBottom: 16 }}>
          <ArrowLeft size={16} /> Назад
        </Link>

        <div className="dashboard-header">
          <h1>{project.title}</h1>
          <p><Hash size={13} /> {project.publicNumber} · <span style={{ color: statusColors[project.status] }}>{statusLabels[project.status]}</span></p>
        </div>

          {error && <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444', fontSize: 13, marginBottom: 16 }}>{error}</div>}
          {success && <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.15)', color: '#16a34a', fontSize: 13, marginBottom: 16 }}>{success}</div>}

          <div className="vacancy-detail-section">
            <h3>Информация</h3>
            <div className="profile-fields">
              <div className="profile-field"><span className="profile-field-label">Организация</span><span className="profile-field-value"><Building2 size={13} /> {org?.shortName || org?.name || '—'}</span></div>
              <div className="profile-field"><span className="profile-field-label">Тип</span><span className="profile-field-value">{project.type}</span></div>
              <div className="profile-field"><span className="profile-field-label">Создан</span><span className="profile-field-value"><Calendar size={13} /> {new Date(project.createdAt).toLocaleDateString('ru-RU')}</span></div>
            </div>
          </div>

          {project.brief && (
            <div className="vacancy-detail-section">
              <h3>Задача</h3>
              <div className="profile-fields">
                {project.brief.description && <div className="profile-field"><span className="profile-field-label">Описание</span><span className="profile-field-value">{project.brief.description}</span></div>}
                {project.brief.city && <div className="profile-field"><span className="profile-field-label">Город</span><span className="profile-field-value">{project.brief.city}</span></div>}
                {project.brief.deadline && <div className="profile-field"><span className="profile-field-label">Срок</span><span className="profile-field-value">{project.brief.deadline}</span></div>}
                {project.brief.budgetKopecks > 0 && <div className="profile-field"><span className="profile-field-label">Бюджет</span><span className="profile-field-value">{formatRubles(project.brief.budgetKopecks)} ₽</span></div>}
                {project.brief.comment && <div className="profile-field"><span className="profile-field-label">Комментарий</span><span className="profile-field-value">{project.brief.comment}</span></div>}
              </div>
            </div>
          )}

          <div className="vacancy-detail-section">
            <h3>Финансы {editFinance && '(DEV режим)'}</h3>
            {editFinance ? (
              <div className="edit-form-grid">
                <label><span>Стоимость подрядчика (₽)</span><input className="form-input" type="number" value={providerAmountRub} onChange={(e) => setProviderAmountRub(e.target.value)} /></label>
                <label><span>Комиссия платформы (₽)</span><input className="form-input" type="number" value={platformFeeRub} onChange={(e) => setPlatformFeeRub(e.target.value)} /></label>
                <label><span>Итого (авто)</span><input className="form-input" type="number" value={totalAmountRub} disabled /></label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <button className="platform-nav-btn primary" onClick={handleSaveFinance}><Check size={16} /> Сохранить</button>
                  <button className="platform-nav-btn ghost" onClick={() => setEditFinance(false)}><X size={16} /> Отмена</button>
                </div>
              </div>
            ) : (
              <div className="profile-fields">
                <div className="profile-field"><span className="profile-field-label">Подрядчик</span><span className="profile-field-value"><Wallet size={13} /> {formatRubles(project.providerAmountKopecks)} ₽</span></div>
                <div className="profile-field"><span className="profile-field-label">Платформа</span><span className="profile-field-value"><Wallet size={13} /> {formatRubles(project.platformFeeKopecks)} ₽</span></div>
                <div className="profile-field"><span className="profile-field-label">Итого</span><span className="profile-field-value" style={{ fontWeight: 700 }}>{formatRubles(project.totalAmountKopecks)} ₽</span></div>
                <button className="platform-nav-btn ghost" style={{ marginTop: 8 }} onClick={() => setEditFinance(true)}>Изменить (DEV)</button>
              </div>
            )}
          </div>

          <div className="vacancy-detail-section">
            <h3>Управление статусом</h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>Текущий: <strong style={{ color: statusColors[project.status] }}>{statusLabels[project.status]}</strong></p>
            {allowed.length > 0 ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {allowed.map((s) => (
                  <button key={s} className="platform-nav-btn primary" onClick={() => handleTransition(s)}>
                    {s === 'cancelled' ? <X size={14} /> : <Check size={14} />} {statusLabels[s]}
                  </button>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>Нет доступных переходов из текущего статуса</p>
            )}
          </div>

          <div className="vacancy-detail-section">
            <h3>История событий</h3>
            {events.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>Событий пока нет</p>
            ) : (
              <div className="timeline">
                {events.map((ev) => {
                  const actor = accounts.get(ev.actorAccountId);
                  return (
                    <div className="timeline-item" key={ev.id}>
                      <div className="timeline-dot" />
                      <div className="timeline-content">
                        <strong>{ev.message}</strong>
                        <span>{new Date(ev.createdAt).toLocaleString('ru-RU')}{actor ? ` · ${actor.displayName}` : ''}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
      </div>
    </div>
  );
}
