import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Plus, MapPin, BadgeCheck, Clock, ArrowRight } from 'lucide-react';
import { useAuth } from '@/services/authContext';
import {
  organizationRepository,
  organizationMembershipRepository,
} from '@/repositories/mockRepositories';
import type { Organization, OrganizationMembership, OrganizationRole } from '@/types/platform';
import { EmptyState } from '@/components/EmptyState';

const roleLabels: Record<OrganizationRole, string> = {
  owner: 'Владелец',
  administrator: 'Администратор',
  marketing_manager: 'Маркетинг',
  hr_manager: 'HR-менеджер',
  accountant: 'Бухгалтер',
  viewer: 'Наблюдатель',
};

const dataSourceLabels: Record<string, string> = {
  dadata: 'DaData',
  manual: 'Вручную',
  mixed: 'Смешанные',
};

export function BusinessOrganizationsPage() {
  const { account } = useAuth();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [memberships, setMemberships] = useState<OrganizationMembership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!account) { setLoading(false); return; }
      const ms = await organizationMembershipRepository.getByAccount(account.id);
      setMemberships(ms);
      const os = await organizationRepository.getByAccountId(account.id);
      setOrgs(os);
      setLoading(false);
    })().catch(() => setLoading(false));
  }, [account]);

  if (loading) {
    return <div className="dashboard-page"><div className="dashboard-body"><p style={{ color: 'var(--muted)' }}>Загрузка...</p></div></div>;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-body">
        <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1>Организации</h1>
            <p>Управление профилями компаний и ИП</p>
          </div>
          <Link to="/business/organizations/new" className="platform-nav-btn primary">
            <Plus size={16} /> Добавить организацию
          </Link>
        </div>

          {orgs.length === 0 ? (
            <EmptyState
              icon={<Building2 size={32} />}
              title="Нет организаций"
              description="Добавьте организацию, чтобы начать работу"
              action={<Link to="/business/organizations/new" className="platform-nav-btn primary"><Plus size={16} /> Добавить организацию</Link>}
            />
          ) : (
            <div className="vacancy-list">
              {orgs.map((org) => {
                const membership = memberships.find((m) => m.organizationId === org.id);
                return (
                  <Link to={`/business/organizations/${org.id}`} key={org.id} className="vacancy-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="vacancy-card-header">
                      <h3>{org.shortName || org.name}</h3>
                      <span className="vacancy-status-badge" style={{ color: 'var(--blue)', background: 'rgba(25,181,254,0.08)' }}>
                        {membership ? roleLabels[membership.role] : '—'}
                      </span>
                    </div>
                    <div className="vacancy-card-meta">
                      <span>ИНН: {org.inn || '—'}</span>
                      {org.kpp && <span>КПП: {org.kpp}</span>}
                      {org.ogrn && <span>ОГРН: {org.ogrn}</span>}
                      {org.industry && <span><MapPin size={13} /> {org.industry}</span>}
                    </div>
                    <div className="vacancy-card-meta" style={{ marginTop: 4 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <BadgeCheck size={13} /> Источник: {dataSourceLabels[org.dataSource] || '—'}
                      </span>
                      {org.dataVerifiedAt && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={13} /> Проверен: {new Date(org.dataVerifiedAt).toLocaleDateString('ru-RU')}
                        </span>
                      )}
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
