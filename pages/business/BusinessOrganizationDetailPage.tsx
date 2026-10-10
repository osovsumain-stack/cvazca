import { CompanyProfileEditor } from '@/pages/CompaniesPage';
import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, Users, FileText, Banknote, History, Shield, Trash2 } from 'lucide-react';
import { useAuth } from '@/services/authContext';
import { canEditOrganization, canManageMembers } from '@/services/permissions';
import {
  organizationRepository,
  organizationMembershipRepository,
  accountRepository,
} from '@/repositories/mockRepositories';
import type { Organization, OrganizationMembership, OrganizationRole, PlatformAccount } from '@/types/platform';
import { EmptyState } from '@/components/EmptyState';

type Tab = 'public' | 'main' | 'details' | 'bank' | 'members' | 'history';

const roleLabels: Record<OrganizationRole, string> = {
  owner: 'Владелец',
  administrator: 'Администратор',
  marketing_manager: 'Маркетинг',
  hr_manager: 'HR-менеджер',
  accountant: 'Бухгалтер',
  viewer: 'Наблюдатель',
};

const allRoles: OrganizationRole[] = ['owner', 'administrator', 'marketing_manager', 'hr_manager', 'accountant', 'viewer'];

export function BusinessOrganizationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { account } = useAuth();
  const [org, setOrg] = useState<Organization | null>(null);
  const [membership, setMembership] = useState<OrganizationMembership | null>(null);
  const [tab, setTab] = useState<Tab>('main');
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    (async () => {
      if (!id || !account) { setLoading(false); return; }
      const o = await organizationRepository.getById(id);
      if (!o) { setLoading(false); return; }
      const memberships = await organizationMembershipRepository.getByAccount(account.id);
      const myMembership = memberships.find((m) => m.organizationId === id);
      if (!myMembership) { setForbidden(true); setLoading(false); return; }
      setOrg(o);
      setMembership(myMembership);
      setLoading(false);
    })().catch(() => setLoading(false));
  }, [id, account]);

  useEffect(() => { const changed = () => { if(id) organizationRepository.getById(id).then(setOrg).catch(() => {}); }; window.addEventListener('svyazka:organizations-changed', changed); return () => window.removeEventListener('svyazka:organizations-changed',changed); }, [id]);

  if (loading) {
    return <div className="dashboard-page"><div className="dashboard-body"><p style={{ color: 'var(--muted)' }}>Загрузка...</p></div></div>;
  }

  if (forbidden) {
    return <div className="dashboard-page"><div className="dashboard-body"><p style={{ color: 'var(--muted)' }}>Нет доступа к этой организации</p><Link to="/business/organizations" className="platform-nav-btn ghost">← Назад</Link></div></div>;
  }

  if (!org) {
    return <div className="dashboard-page"><div className="dashboard-body"><p style={{ color: 'var(--muted)' }}>Организация не найдена</p></div></div>;
  }

  const canEdit = canEditOrganization(membership?.role);
  const canManage = canManageMembers(membership?.role);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'public', label: 'Страница компании', icon: <Building2 size={16} /> },
    { key: 'main', label: 'Основное', icon: <Building2 size={16} /> },
    { key: 'details', label: 'Реквизиты', icon: <FileText size={16} /> },
    { key: 'bank', label: 'Банк', icon: <Banknote size={16} /> },
    { key: 'members', label: 'Сотрудники', icon: <Users size={16} /> },
    { key: 'history', label: 'История', icon: <History size={16} /> },
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-body">
        <Link to="/business/organizations" className="platform-nav-btn ghost" style={{ marginBottom: 16 }}>
          <ArrowLeft size={16} /> Назад к организациям
        </Link>

        <div className="dashboard-header">
          <h1>{org.shortName || org.name}</h1>
          <p>{org.fullName || org.name} · {roleLabels[membership!.role]}</p>
        </div>

        <div className="team-tabs">
          {tabs.map((t) => (
            <button key={t.key} className={`team-tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {tab === 'public' && (canEdit ? <CompanyProfileEditor organization={org} /> : <p>Редактирование доступно владельцу и администратору.</p>)}
        {tab === 'main' && <MainTab org={org} canEdit={canEdit} />}
        {tab === 'details' && <DetailsTab org={org} canEdit={canEdit} />}
        {tab === 'bank' && <BankTab org={org} canEdit={canEdit} />}
        {tab === 'members' && <MembersTab orgId={org.id} canManage={canManage} currentAccountId={account?.id || ''} />}
        {tab === 'history' && <HistoryTab org={org} />}
      </div>
    </div>
  );
}

function MainTab({ org, canEdit }: { org: Organization; canEdit: boolean }) {
  return (
    <div className="vacancy-detail-section">
      <div className="profile-fields">
        <FieldRow label="Название" value={org.name} />
        <FieldRow label="Краткое название" value={org.shortName} />
        <FieldRow label="Тип" value={org.type} />
        <FieldRow label="Отрасль" value={org.industry} />
        <FieldRow label="Сайт" value={org.website} />
        <FieldRow label="Описание" value={org.description} />
        <FieldRow label="Источник данных" value={org.dataSource === 'dadata' ? 'DaData' : org.dataSource === 'manual' ? 'Вручную' : 'Смешанные'} />
        <FieldRow label="Проверен" value={org.dataVerifiedAt ? new Date(org.dataVerifiedAt).toLocaleDateString('ru-RU') : '—'} />
      </div>
      {!canEdit && <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 12 }}>Только владелец и администратор могут редактировать</p>}
    </div>
  );
}

function DetailsTab({ org, canEdit }: { org: Organization; canEdit: boolean }) {
  return (
    <div className="vacancy-detail-section">
      <div className="profile-fields">
        <FieldRow label="ИНН" value={org.inn} />
        <FieldRow label="КПП" value={org.kpp} />
        <FieldRow label="ОГРН" value={org.ogrn} />
        <FieldRow label="ОГРНИП" value={org.ogrnip} />
        <FieldRow label="Юридический адрес" value={org.legalAddress} />
        <FieldRow label="Фактический адрес" value={org.actualAddress} />
        <FieldRow label="Подписант" value={org.signatoryFullName} />
        <FieldRow label="Должность подписанта" value={org.signatoryPosition} />
        <FieldRow label="Основание" value={org.authorityType} />
        <FieldRow label="Email для связи" value={org.contactEmail} />
        <FieldRow label="Телефон" value={org.contactPhone} />
        <FieldRow label="Бухгалтерия email" value={org.accountingEmail} />
      </div>
      {!canEdit && <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 12 }}>Только владелец и администратор могут редактировать</p>}
    </div>
  );
}

function BankTab({ org, canEdit }: { org: Organization; canEdit: boolean }) {
  return (
    <div className="vacancy-detail-section">
      <div className="profile-fields">
        <FieldRow label="Банк" value={org.bankDetails.bankName} />
        <FieldRow label="БИК" value={org.bankDetails.bik} />
        <FieldRow label="Расчётный счёт" value={org.bankDetails.accountNumber} />
        <FieldRow label="Корр. счёт" value={org.bankDetails.correspondentAccount} />
      </div>
      {!canEdit && <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 12 }}>Только владелец и администратор могут редактировать</p>}
    </div>
  );
}

function MembersTab({ orgId, canManage, currentAccountId }: { orgId: string; canManage: boolean; currentAccountId: string }) {
  const [members, setMembers] = useState<OrganizationMembership[]>([]);
  const [accounts, setAccounts] = useState<Map<string, PlatformAccount>>(new Map());
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const ms = await organizationMembershipRepository.getByOrganization(orgId);
    setMembers(ms);
    const accs = await Promise.all(ms.map((m) => accountRepository.getById(m.accountId)));
    setAccounts(new Map(accs.filter(Boolean).map((a) => [a!.id, a!])));
    setLoading(false);
  };

  useEffect(() => { load(); }, [orgId]);

  const handleChangeRole = async (m: OrganizationMembership, role: OrganizationRole) => {
    await organizationMembershipRepository.updateRole(m.id, role);
    await load();
  };

  const handleRemove = async (m: OrganizationMembership) => {
    // Cannot remove last owner
    if (m.role === 'owner') {
      const owners = members.filter((mem) => mem.role === 'owner');
      if (owners.length <= 1) return;
    }
    await organizationMembershipRepository.remove(m.id);
    await load();
  };

  if (loading) return <p style={{ color: 'var(--muted)' }}>Загрузка...</p>;

  if (members.length === 0) {
    return <EmptyState icon={<Users size={32} />} title="Нет сотрудников" description="Пригласите коллег в организацию" />;
  }

  return (
    <div className="vacancy-list">
      {members.map((m) => {
        const acc = accounts.get(m.accountId);
        const isLastOwner = m.role === 'owner' && members.filter((mem) => mem.role === 'owner').length <= 1;
        return (
          <div className="vacancy-card" key={m.id}>
            <div className="vacancy-card-header">
              <h3>{acc?.displayName || 'Пользователь'}</h3>
              {canManage ? (
                <select
                  value={m.role}
                  onChange={(e) => handleChangeRole(m, e.target.value as OrganizationRole)}
                  className="form-input"
                  style={{ maxWidth: 180, fontSize: 13 }}
                  disabled={m.accountId === currentAccountId && m.role === 'owner'}
                >
                  {allRoles.map((r) => <option key={r} value={r}>{roleLabels[r]}</option>)}
                </select>
              ) : (
                <span className="vacancy-status-badge" style={{ color: 'var(--blue)', background: 'rgba(25,181,254,0.08)' }}>
                  {roleLabels[m.role]}
                </span>
              )}
            </div>
            <div className="vacancy-card-meta">
              {acc?.email && <span>{acc.email}</span>}
              <span>VK ID: {acc?.vkUserId || '—'}</span>
              <span>С {new Date(m.createdAt).toLocaleDateString('ru-RU')}</span>
            </div>
            {canManage && !isLastOwner && m.accountId !== currentAccountId && (
              <div className="vacancy-card-actions">
                <button className="platform-nav-btn ghost" onClick={() => handleRemove(m)} style={{ color: '#ef4444' }}>
                  <Trash2 size={14} /> Удалить
                </button>
              </div>
            )}
            {isLastOwner && <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Нельзя удалить последнего владельца</p>}
          </div>
        );
      })}
    </div>
  );
}

function HistoryTab({ org }: { org: Organization }) {
  return (
    <div className="vacancy-detail-section">
      <div className="profile-fields">
        <FieldRow label="Создана" value={new Date(org.createdAt).toLocaleDateString('ru-RU')} />
        <FieldRow label="Обновлена" value={new Date(org.updatedAt).toLocaleDateString('ru-RU')} />
        <FieldRow label="Источник данных" value={org.dataSource === 'dadata' ? 'DaData' : org.dataSource === 'manual' ? 'Вручную' : 'Смешанные'} />
        <FieldRow label="Данные проверены" value={org.dataVerifiedAt ? new Date(org.dataVerifiedAt).toLocaleDateString('ru-RU') : '—'} />
      </div>
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="profile-field">
      <span className="profile-field-label">{label}</span>
      <span className="profile-field-value">{value}</span>
    </div>
  );
}
