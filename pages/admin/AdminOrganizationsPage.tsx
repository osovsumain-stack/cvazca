import { useState, useEffect } from 'react';
import { Building2, MapPin } from 'lucide-react';
import { organizationRepository } from '@/repositories/mockRepositories';
import type { Organization } from '@/types/platform';
import { EmptyState } from '@/components/EmptyState';

const dataSourceLabels: Record<string, string> = {
  dadata: 'DaData',
  manual: 'Вручную',
  mixed: 'Смешанные',
};

export function AdminOrganizationsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const all = await organizationRepository.getAll();
      setOrgs(all);
      setLoading(false);
    })().catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="dashboard-page"><div className="dashboard-body"><p style={{ color: 'var(--muted)' }}>Загрузка...</p></div></div>;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-body">
        <div className="dashboard-header">
          <h1>Организации</h1>
          <p>Все организации на платформе</p>
        </div>

        {orgs.length === 0 ? (
          <EmptyState icon={<Building2 size={32} />} title="Нет организаций" description="Организации появятся после регистрации бизнеса" />
        ) : (
          <div className="vacancy-list">
            {orgs.map((org) => (
              <div className="vacancy-card" key={org.id}>
                <div className="vacancy-card-header">
                  <h3>{org.shortName || org.name}</h3>
                  <span className="vacancy-status-badge" style={{ color: 'var(--blue)', background: 'rgba(25,181,254,0.08)' }}>
                    {org.type}
                  </span>
                </div>
                <div className="vacancy-card-meta">
                  <span>ИНН: {org.inn || '—'}</span>
                  {org.kpp && <span>КПП: {org.kpp}</span>}
                  {org.ogrn && <span>ОГРН: {org.ogrn}</span>}
                  {org.industry && <span><MapPin size={13} /> {org.industry}</span>}
                  <span>Источник: {dataSourceLabels[org.dataSource] || '—'}</span>
                  <span>{new Date(org.createdAt).toLocaleDateString('ru-RU')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
