import { apiRequest } from '@/repositories/transport';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Inbox, Eye, Calendar, User, FileText } from 'lucide-react';
import { applicationRepository, vacancyRepository, organizationMembershipRepository, applicationEventRepository } from '@/repositories/mockRepositories';
import { useAuth } from '@/services/authContext';
import type { JobApplication, VacancyPosting, ApplicationEvent } from '@/types/platform';
import { Badge, Button, PageHeader, Card, StatusBadge, Tabs, Modal } from '@/components/ui';
import { EmptyState } from '@/components/EmptyState';
export function BusinessApplicationsPage() {
  const { account } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [vacancies, setVacancies] = useState<Record<string, VacancyPosting>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [events, setEvents] = useState<ApplicationEvent[]>([]);
  const [resumeView,setResumeView] = useState<{fullName:string;title:string;summary:string;skills:string[];experience:{id:string;title:string;organization:string;description:string;result:string}[];education:{institution:string;specialty:string;endYear:string}[];contacts:{email?:string;phone?:string}} | null>(null);

  useEffect(() => {
    if (!account) return;
    organizationMembershipRepository.getByAccount(account.id).then(async (ms) => {
      const allApps: JobApplication[] = [];
      const vacMap: Record<string, VacancyPosting> = {};
      for (const m of ms.filter(m=>['owner','administrator','hr_manager'].includes(m.role))) {
        const apps = await applicationRepository.getByOrganization(m.organizationId);
        allApps.push(...apps);
        const vacs = await vacancyRepository.getByOrganization(m.organizationId);
        vacs.forEach((v) => { vacMap[v.id] = v; });
      }
      setApplications(allApps.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      setVacancies(vacMap);
      setLoading(false);
    });
  }, [account]);

  const filtered = applications.filter((a) => {
    if (tab === 'all') return true;
    if (tab === 'new') return a.status === 'sent';
    if (tab === 'interview') return a.status === 'interview';
    if (tab === 'offer') return a.status === 'offer';
    return a.status === tab;
  });

  const updateStatus = async (app: JobApplication, status: JobApplication['status'], message: string) => {
    const updated = { ...app, status, updatedAt: new Date().toISOString() };
    await applicationRepository.update(updated);
    await applicationEventRepository.create({ applicationId: app.id, type: status as ApplicationEvent['type'], actorAccountId: account?.id || '', message });
    setApplications(applications.map((a) => a.id === app.id ? updated : a));
    if (selectedApp?.id === app.id) {
      setSelectedApp(updated);
      const evs = await applicationEventRepository.getByApplication(app.id);
      setEvents(evs);
    }
  };

  const openDetail = async (app: JobApplication) => {
    setSelectedApp(app);
    setResumeView(null);
    if (app.status !== 'withdrawn') setResumeView(await apiRequest('/api/applications/resume',{applicationId:app.id}));
    const evs = await applicationEventRepository.getByApplication(app.id);
    setEvents(evs);
  };

  if (loading) return <div className="dashboard-page"><div className="dashboard-body"><p style={{ color: 'var(--muted)' }}>Загрузка...</p></div></div>;

  return (
    <div className="dashboard-page">
      <div className="dashboard-body" style={{ maxWidth: 1200, margin: '0 auto' }}>
        <PageHeader title="Отклики" subtitle="Управление откликами на вакансии вашей организации" />

          <Tabs tabs={[{ id: 'all', label: 'Все' }, { id: 'new', label: 'Новые' }, { id: 'viewed', label: 'Просмотренные' }, { id: 'interview', label: 'Собеседование' }, { id: 'offer', label: 'Оффер' }, { id: 'rejected', label: 'Отклонённые' }]} active={tab} onChange={setTab} />

          {filtered.length === 0 ? (
            <EmptyState icon={<Inbox size={32} />} title="Нет откликов" description="Отклики кандидатов появятся здесь" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map((app) => {
                const vac = vacancies[app.vacancyId];
                return (
                  <Card key={app.id} style={{ padding: 16, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(59,130,246,0.08)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <User size={18} style={{ color: 'var(--blue)' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{vac?.title || 'Вакансия удалена'}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} /> {new Date(app.createdAt).toLocaleDateString('ru-RU')}</span>
                        <span>Соп.письмо: {app.coverLetter ? 'есть' : 'нет'}</span>
                      </div>
                    </div>
                    <StatusBadge status={app.status} />
                    <Button size="sm" variant="ghost" icon={<Eye size={16} />} onClick={() => openDetail(app)}>Открыть</Button>
                  </Card>
                );
              })}
            </div>
          )}

          <Modal open={!!selectedApp} onClose={() => setSelectedApp(null)} title="Отклик кандидата" maxWidth={600}>
            {selectedApp && (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }}>Вакансия</div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{vacancies[selectedApp.vacancyId]?.title || '—'}</div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }}>Сопроводительное письмо</div>
                  <p style={{ fontSize: 14, lineHeight: 1.5 }}>{selectedApp.coverLetter || 'Не указано'}</p>
                </div>
                {resumeView && <section className="repeat-card" style={{marginBottom:20}}><h2>{resumeView.fullName}</h2><h3>{resumeView.title}</h3><p>{resumeView.contacts.email} {resumeView.contacts.phone}</p><p className="pre-line">{resumeView.summary}</p><div className="paper-tags">{resumeView.skills.map(s=><span key={s}>{s}</span>)}</div>{resumeView.experience.map(e=><div key={e.id}><strong>{e.title} · {e.organization}</strong><p className="pre-line">{e.description}</p><p>{e.result}</p></div>)}{resumeView.education.map((e,i)=><p key={i}>{e.institution} · {e.specialty} · {e.endYear}</p>)}</section>}
                {events.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)', marginBottom: 8 }}>История</div>
                    {events.map((ev) => (
                      <div key={ev.id} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 13 }}>
                        <StatusBadge status={ev.type} />
                        <span style={{ color: 'var(--muted)' }}>{ev.message}</span>
                        <span style={{ color: 'var(--muted)', fontSize: 12 }}>{new Date(ev.createdAt).toLocaleDateString('ru-RU')}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <Button size="sm" disabled={selectedApp.status === 'withdrawn'} onClick={() => updateStatus(selectedApp, 'viewed', 'Отклик просмотрен')}>Просмотрен</Button>
                  <Button size="sm" variant="outline" disabled={selectedApp.status === 'withdrawn'} onClick={() => updateStatus(selectedApp, 'interview', 'Приглашён на собеседование')}>На собеседование</Button>
                  <Button size="sm" variant="outline" disabled={selectedApp.status === 'withdrawn'} onClick={() => updateStatus(selectedApp, 'offer', 'Отправлен оффер')}>Оффер</Button>
                  <Button size="sm" variant="ghost" disabled={selectedApp.status === 'withdrawn'} onClick={() => updateStatus(selectedApp, 'rejected', 'Отклонён')}>Отклонить</Button>
                </div>
              </div>
            )}
          </Modal>
        </div>
      </div>
  );
}
