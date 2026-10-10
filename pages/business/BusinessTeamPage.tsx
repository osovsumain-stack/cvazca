import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Briefcase, Users, Inbox, MapPin, Clock, Edit3, Copy, Pause, Play, X, Eye, UserPlus, Mail } from 'lucide-react';
import { useAuth } from '@/services/authContext';
import { canManageVacancies, canViewApplications } from '@/services/permissions';
import {
  vacancyRepository,
  vacancyEventRepository,
  applicationRepository,
  applicationEventRepository,
  organizationRepository,
  organizationMembershipRepository,
  accountRepository,
  resumeRepository,
} from '@/repositories/mockRepositories';
import { organizationInvitationRepository } from '@/repositories/featureRepositories';
import type { VacancyPosting, VacancyStatus, JobApplication, ApplicationEventType, Organization, OrganizationMembership, PlatformAccount, Resume, OrganizationInvitation, InvitationRole } from '@/types/platform';
import { EmptyState } from '@/components/EmptyState';

const statusLabels: Record<VacancyStatus, string> = {
  draft: 'Черновик',
  pending_moderation: 'На модерации',
  approved: 'Одобрена',
  published: 'Опубликована',
  paused: 'Приостановлена',
  rejected: 'Отклонена',
  closed: 'Закрыта',
  archived: 'В архиве',
};

const statusColors: Record<VacancyStatus, string> = {
  draft: 'var(--muted)',
  pending_moderation: '#d97706',
  approved: '#16a34a',
  published: 'var(--blue)',
  paused: '#d97706',
  rejected: '#ef4444',
  closed: 'var(--muted)',
  archived: 'var(--muted)',
};

type Tab = 'vacancies' | 'applications' | 'employees';
type VacancyFilter = 'all' | VacancyStatus;

export function BusinessTeamPage() {
  const { account } = useAuth();
  const [tab, setTab] = useState<Tab>('vacancies');
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [memberships, setMemberships] = useState<OrganizationMembership[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!account) { setLoading(false); return; }
      const ms = await organizationMembershipRepository.getByAccount(account.id);
      setMemberships(ms);
      const os = await organizationRepository.getByAccountId(account.id);
      setOrgs(os);
      if (os.length > 0) setSelectedOrgId(os[0].id);
      setLoading(false);
    })().catch(() => setLoading(false));
  }, [account]);

  const currentMembership = memberships.find((m) => m.organizationId === selectedOrgId);
  const canManage = canManageVacancies(currentMembership?.role);
  const canViewApps = canViewApplications(currentMembership?.role);

  if (loading) {
    return <div className="dashboard-page"><div className="dashboard-body"><p style={{ color: 'var(--muted)' }}>Загрузка...</p></div></div>;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-body">
        <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1>Команда и вакансии</h1>
            <p>Управление вакансиями, откликами и сотрудниками</p>
          </div>
          {orgs.length > 1 && (
            <select value={selectedOrgId} onChange={(e) => setSelectedOrgId(e.target.value)} className="form-input" style={{ maxWidth: 280 }}>
              {orgs.map((o) => <option key={o.id} value={o.id}>{o.shortName || o.name}</option>)}
            </select>
          )}
        </div>

        <div className="team-tabs">
          <button className={`team-tab ${tab === 'vacancies' ? 'active' : ''}`} onClick={() => setTab('vacancies')}>
            <Briefcase size={16} /> Вакансии
          </button>
          <button className={`team-tab ${tab === 'applications' ? 'active' : ''}`} onClick={() => setTab('applications')}>
            <Inbox size={16} /> Отклики
          </button>
          <button className={`team-tab ${tab === 'employees' ? 'active' : ''}`} onClick={() => setTab('employees')}>
            <Users size={16} /> Сотрудники
          </button>
        </div>

        {tab === 'vacancies' && (
          <VacanciesTab orgId={selectedOrgId} canManage={canManage} />
        )}
        {tab === 'applications' && (
          canViewApps ? <ApplicationsTab orgId={selectedOrgId} /> : (
            <div style={{ padding: 32, textAlign: 'center' }}>
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>У вас нет доступа к откликам. Доступно только для владельца, администратора и HR-менеджера.</p>
            </div>
          )
        )}
        {tab === 'employees' && (
          <EmployeesTab orgId={selectedOrgId} />
        )}
      </div>
    </div>
  );
}

function VacanciesTab({ orgId, canManage }: { orgId: string; canManage: boolean }) {
  const [vacancies, setVacancies] = useState<VacancyPosting[]>([]);
  const [filter, setFilter] = useState<VacancyFilter>('all');
  const [loading, setLoading] = useState(true);
  const [appCounts, setAppCounts] = useState<Map<string, number>>(new Map());

  const load = useCallback(async () => {
    if (!orgId) { setLoading(false); return; }
    const vs = await vacancyRepository.getByOrganization(orgId);
    setVacancies(vs);
    const counts = new Map<string, number>();
    for (const v of canManage ? vs : []) {
      const apps = await applicationRepository.getByVacancy(v.id);
      counts.set(v.id, apps.length);
    }
    setAppCounts(counts);
    setLoading(false);
  }, [orgId, canManage]);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'all' ? vacancies : vacancies.filter((v) => v.status === filter);

  const handlePause = async (v: VacancyPosting) => {
    if (v.status === 'published') await vacancyRepository.pause(v.id);
    else if (v.status === 'paused') await vacancyRepository.publish(v.id);
    await load();
  };

  const handleClose = async (v: VacancyPosting) => {
    await vacancyRepository.close(v.id);
    await load();
  };

  const handleDuplicate = async (v: VacancyPosting) => {
    const { id, createdAt, updatedAt, ...rest } = v;
    await vacancyRepository.create({ ...rest, status: 'draft', moderationComment: '', moderatedBy: null, moderatedAt: null, publishedAt: null, closedAt: null });
    await load();
  };

  if (loading) return <p style={{ color: 'var(--muted)' }}>Загрузка...</p>;

  const filters: { key: VacancyFilter; label: string }[] = [
    { key: 'all', label: 'Все' },
    { key: 'draft', label: 'Черновики' },
    { key: 'pending_moderation', label: 'На модерации' },
    { key: 'published', label: 'Опубликованные' },
    { key: 'paused', label: 'Приостановленные' },
    { key: 'closed', label: 'Закрытые' },
  ];

  return (
    <div>
      <div className="vacancy-filters">
        {filters.map((f) => (
          <button
            key={f.key}
            className={`platform-nav-btn ${filter === f.key ? 'primary' : 'ghost'}`}
            onClick={() => setFilter(f.key)}
            style={{ fontSize: 13 }}
          >
            {f.label}
          </button>
        ))}
        {canManage && (
          <Link to="/business/team/vacancies/new" className="platform-nav-btn primary" style={{ marginLeft: 'auto' }}>
            <Plus size={16} /> Создать вакансию
          </Link>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Briefcase size={32} />}
          title="У вас пока нет вакансий"
          description={canManage ? 'Создайте первую вакансию — она появится здесь' : 'Вакансии появятся здесь после создания'}
          action={canManage ? <Link to="/business/team/vacancies/new" className="platform-nav-btn primary"><Plus size={16} /> Создать вакансию</Link> : undefined}
        />
      ) : (
        <div className="vacancy-list">
          {filtered.map((v) => (
            <div className="vacancy-card" key={v.id}>
              <div className="vacancy-card-header">
                <h3>{v.title}</h3>
                <span className="vacancy-status-badge" style={{ color: statusColors[v.status], background: `${statusColors[v.status]}14` }}>
                  {statusLabels[v.status]}
                </span>
              </div>
              <div className="vacancy-card-meta">
                <span><MapPin size={13} /> {v.city || v.location}</span>
                <span><Clock size={13} /> {v.workFormat}</span>
                <span>{v.salaryFrom && v.salaryTo ? `${v.salaryFrom}–${v.salaryTo} ₽` : v.salaryFrom ? `от ${v.salaryFrom} ₽` : 'Зарплата не указана'}</span>
                <span><Inbox size={13} /> Откликов: {appCounts.get(v.id) || 0}</span>
              </div>
              {v.moderationComment && v.status === 'rejected' && (
                <div style={{ fontSize: 13, color: '#ef4444', padding: '8px 12px', background: 'rgba(239,68,68,0.06)', borderRadius: 8, margin: '8px 0' }}>
                  Причина отклонения: {v.moderationComment}
                </div>
              )}
              {canManage && (
                <div className="vacancy-card-actions">
                  <Link className="platform-nav-btn ghost" to={`/business/team/vacancies/new?edit=${v.id}`}>Редактировать</Link>
                  {(v.status === 'draft' || v.status === 'rejected') && <button className="platform-nav-btn primary" onClick={async () => { await vacancyRepository.submitForModeration(v.id); await load(); }}>На модерацию</button>}
                  {v.status === 'approved' && (
                    <button className="platform-nav-btn primary" onClick={async () => { await vacancyRepository.publish(v.id); await load(); }}>
                      <Play size={14} /> Опубликовать
                    </button>
                  )}
                  {(v.status === 'published' || v.status === 'paused') && (
                    <button className="platform-nav-btn ghost" onClick={() => handlePause(v)}>
                      {v.status === 'published' ? <><Pause size={14} /> Приостановить</> : <><Play size={14} /> Возобновить</>}
                    </button>
                  )}
                  {v.status !== 'closed' && v.status !== 'archived' && (
                    <button className="platform-nav-btn ghost" onClick={() => handleClose(v)}>
                      <X size={14} /> Закрыть
                    </button>
                  )}
                  <button className="platform-nav-btn ghost" onClick={() => handleDuplicate(v)}>
                    <Copy size={14} /> Дублировать
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ApplicationsTab({ orgId }: { orgId: string }) {
  // Access to this tab is gated by canViewApplications in the parent component.
  // Only owner, administrator, and hr_manager roles can reach this point.
  const [apps, setApps] = useState<JobApplication[]>([]);
  const [vacancies, setVacancies] = useState<Map<string, VacancyPosting>>(new Map());
  const [candidates, setCandidates] = useState<Map<string, PlatformAccount>>(new Map());
  const [resumes, setResumes] = useState<Map<string, Resume>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!orgId) { setLoading(false); return; }
      const vs = await vacancyRepository.getByOrganization(orgId);
      setVacancies(new Map(vs.map((v) => [v.id, v])));
      const a = await applicationRepository.getByOrganization(orgId);
      setApps(a);
      const accIds = [...new Set(a.filter(ap => ap.status !== 'withdrawn').map((ap) => ap.candidateId))];
      const accs = await Promise.all(accIds.map((id) => accountRepository.getById(id)));
      setCandidates(new Map(accs.filter(Boolean).map((acc) => [acc!.id, acc!])));
      const resumeIds = a.filter(ap=>ap.status!=='withdrawn').map((ap) => ap.resumeId).filter(Boolean) as string[];
      const rs = await Promise.all(resumeIds.map((id) => resumeRepository.getById(id)));
      setResumes(new Map(rs.filter(Boolean).map((r) => [r!.id, r!])));
      setLoading(false);
    })().catch(() => setLoading(false));
  }, [orgId]);

  const appStatusLabels: Record<string, string> = {
    draft: 'Черновик', sent: 'Отправлен', viewed: 'Просмотрен', interview: 'Собеседование', offer: 'Оффер', rejected: 'Отказ', withdrawn: 'Отозван',
  };

  const updateStatus = async (app: JobApplication, status: JobApplication['status']) => {
    if (app.status === 'withdrawn') return;
    await applicationRepository.update({ ...app, status });
    // Create application event for history tracking
    await applicationEventRepository.create({
      applicationId: app.id,
      type: status as ApplicationEventType,
      actorAccountId: 'business',
      message: `Статус изменён на: ${appStatusLabels[status] || status}`,
    });
    setApps((prev) => prev.map((a) => (a.id === app.id ? { ...a, status } : a)));
  };

  if (loading) return <p style={{ color: 'var(--muted)' }}>Загрузка...</p>;

  if (apps.length === 0) {
    return <EmptyState icon={<Inbox size={32} />} title="Пока нет откликов" description="Отклики кандидатов появятся здесь" />;
  }

  return (
    <div className="vacancy-list">
      {apps.map((app) => {
        const vacancy = vacancies.get(app.vacancyId);
        const candidate = candidates.get(app.candidateId);
        const resume = app.resumeId ? resumes.get(app.resumeId) : null;
        return (
          <div className="vacancy-card" key={app.id}>
            <div className="vacancy-card-header">
              <h3>{candidate?.displayName || 'Кандидат'}</h3>
              <span className="vacancy-status-badge" style={{ color: 'var(--blue)', background: 'rgba(25,181,254,0.08)' }}>
                {appStatusLabels[app.status] || app.status}
              </span>
            </div>
            <div className="vacancy-card-meta">
              <span><Briefcase size={13} /> {vacancy?.title || 'Вакансия удалена'}</span>
              <span><Clock size={13} /> {new Date(app.createdAt).toLocaleDateString('ru-RU')}</span>
              {resume && <span>Резюме: {resume.title}</span>}
            </div>
            {app.coverLetter && <p className="vacancy-card-desc">{app.coverLetter}</p>}
            <div className="vacancy-card-actions">
              {app.status === 'sent' && (
                <button className="platform-nav-btn primary" onClick={() => updateStatus(app, 'viewed')}>
                  <Eye size={14} /> Отметить просмотренным
                </button>
              )}
              {app.status === 'viewed' && (
                <button className="platform-nav-btn primary" onClick={() => updateStatus(app, 'interview')}>
                  Пригласить на собеседование
                </button>
              )}
              {app.status === 'interview' && (
                <>
                  <button className="platform-nav-btn primary" onClick={() => updateStatus(app, 'offer')}>Оффер</button>
                  <button className="platform-nav-btn ghost" onClick={() => updateStatus(app, 'rejected')}>Отказать</button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmployeesTab({ orgId }: { orgId: string }) {
  const { account } = useAuth();
  const [members, setMembers] = useState<OrganizationMembership[]>([]);
  const [accounts, setAccounts] = useState<Map<string, PlatformAccount>>(new Map());
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<InvitationRole>('viewer');
  const [inviteLink, setInviteLink] = useState('');

  const load = useCallback(async () => {
    if (!orgId) { setLoading(false); return; }
    const ms = await organizationMembershipRepository.getByOrganization(orgId);
    setMembers(ms);
    const accs = await Promise.all(ms.map((m) => accountRepository.getById(m.accountId)));
    setAccounts(new Map(accs.filter(Boolean).map((a) => [a!.id, a!])));
    const invs = await organizationInvitationRepository.getByOrganization(orgId);
    setInvitations(invs.filter((i) => i.status === 'pending'));
    setLoading(false);
  }, [orgId]);

  useEffect(() => { load(); }, [load]);

  const handleInvite = async () => {
    if (!account || !inviteEmail) return;
    const inv = await organizationInvitationRepository.create({
      organizationId: orgId,
      role: inviteRole,
      invitedBy: account.id,
      inviteeName: '',
      inviteeVkUrl: '',
      inviteeEmail: inviteEmail,
      status: 'pending',
    });
    const link = `${window.location.origin}/business/invite/${inv.inviteToken}`;
    setInviteLink(link);
    setInviteEmail('');
    await load();
  };

  if (loading) return <p style={{ color: 'var(--muted)' }}>Загрузка...</p>;

  const roleLabels: Record<string, string> = {
    owner: 'Владелец', administrator: 'Администратор', marketing_manager: 'Маркетинг', hr_manager: 'HR-менеджер', accountant: 'Бухгалтер', viewer: 'Наблюдатель',
  };

  const roleOptions: { value: InvitationRole; label: string }[] = [
    { value: 'administrator', label: 'Администратор' },
    { value: 'marketing_manager', label: 'Маркетинг-менеджер' },
    { value: 'hr_manager', label: 'HR-менеджер' },
    { value: 'accountant', label: 'Бухгалтер' },
    { value: 'viewer', label: 'Наблюдатель' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'flex-end' }}>
        <button className="platform-nav-btn primary" onClick={() => setShowInvite(!showInvite)}>
          <UserPlus size={16} /> Пригласить сотрудника
        </button>
      </div>

      {showInvite && (
        <div className="platform-card" style={{ padding: 20, marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Новое приглашение</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <input className="form-input" style={{ flex: 1, minWidth: 200 }} placeholder="Email приглашаемого" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
            <select className="form-input" style={{ maxWidth: 200 }} value={inviteRole} onChange={(e) => setInviteRole(e.target.value as InvitationRole)}>
              {roleOptions.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <button className="platform-nav-btn primary" onClick={handleInvite} disabled={!inviteEmail}>
              <Mail size={16} /> Отправить
            </button>
          </div>
          {inviteLink && (
            <div style={{ padding: 12, background: 'var(--glass)', borderRadius: 8, fontSize: 13, color: 'var(--muted)', wordBreak: 'break-all' }}>
              Ссылка для приглашения: <strong style={{ color: 'var(--blue)' }}>{inviteLink}</strong>
            </div>
          )}
        </div>
      )}

      {invitations.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--muted)' }}>Ожидают принятия</h3>
          {invitations.map((inv) => (
            <div className="vacancy-card" key={inv.id} style={{ opacity: 0.7 }}>
              <div className="vacancy-card-header">
                <h3>{inv.inviteeEmail || 'Приглашение'}</h3>
                <span className="vacancy-status-badge" style={{ color: '#d97706', background: 'rgba(217,119,6,0.08)' }}>
                  {roleLabels[inv.role] || inv.role} · ожидает
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {members.length === 0 ? (
        <EmptyState icon={<Users size={32} />} title="Нет сотрудников" description="Пригласите коллег в организацию" />
      ) : (
        <div className="vacancy-list">
          {members.map((m) => {
            const acc = accounts.get(m.accountId);
            return (
              <div className="vacancy-card" key={m.id}>
                <div className="vacancy-card-header">
                  <h3>{acc?.displayName || 'Пользователь'}</h3>
                  <span className="vacancy-status-badge" style={{ color: 'var(--blue)', background: 'rgba(25,181,254,0.08)' }}>
                    {roleLabels[m.role] || m.role}
                  </span>
                </div>
                <div className="vacancy-card-meta">
                  {acc?.email && <span>{acc.email}</span>}
                  <span><Clock size={13} /> С {new Date(m.createdAt).toLocaleDateString('ru-RU')}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
