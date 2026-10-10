import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Send, Clock, MapPin, Briefcase, ChevronDown, ChevronUp } from 'lucide-react';
import { applicationRepository, applicationEventRepository, vacancyRepository, accountRepository } from '@/repositories/mockRepositories';
import type { JobApplication, VacancyPosting, ApplicationEvent } from '@/types/platform';
import { EmptyState } from '@/components/EmptyState';
import { ActivityTimeline, type TimelineEvent } from '@/components/ActivityTimeline';

const applicationStatusLabels: Record<string, string> = {
  draft: 'Черновик',
  sent: 'Отправлен',
  viewed: 'Просмотрен',
  interview: 'Собеседование',
  offer: 'Оффер',
  rejected: 'Отклонён',
  withdrawn: 'Отозван',
};

export function CareerApplicationsPage() {
  const [apps, setApps] = useState<JobApplication[]>([]);
  const [vacancies, setVacancies] = useState<Map<string, VacancyPosting>>(new Map());
  const [eventsMap, setEventsMap] = useState<Map<string, ApplicationEvent[]>>(new Map());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const acc = await accountRepository.getCurrentAccount();
      if (acc) {
        const a = await applicationRepository.getByCandidate(acc.id);
        setApps(a);
        const allVacancies = await vacancyRepository.getPublished();
        const vmap = new Map(allVacancies.map((v) => [v.id, v]));
        // Also get non-published vacancies that user applied to
        const appliedVacancyIds = a.map((app) => app.vacancyId);
        for (const vid of appliedVacancyIds) {
          if (!vmap.has(vid)) {
            const v = await vacancyRepository.getById(vid);
            if (v) vmap.set(vid, v);
          }
        }
        setVacancies(vmap);

        // Load events for each application
        const evMap = new Map<string, ApplicationEvent[]>();
        for (const app of a) {
          const events = await applicationEventRepository.getByApplication(app.id);
          evMap.set(app.id, events);
        }
        setEventsMap(evMap);
      }
      setLoading(false);
    })().catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="dashboard-page"><div className="dashboard-body"><p style={{ color: 'var(--muted)' }}>Загрузка...</p></div></div>;
  }

  if (apps.length === 0) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-body">
          <div className="dashboard-header">
            <h1>Отклики</h1>
            <p>История ваших откликов на вакансии</p>
          </div>
          <EmptyState
            icon={<Send size={32} />}
            title="Нет откликов"
            description="Откликнитесь на вакансию — она появится здесь"
            action={<Link to="/career/vacancies" className="platform-nav-btn primary">Найти вакансии</Link>}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-body">
        <div className="dashboard-header">
          <h1>Отклики</h1>
          <p>История ваших откликов на вакансии</p>
        </div>
        <div className="resume-list">
          {apps.map((app) => {
            const vacancy = vacancies.get(app.vacancyId);
            const events = eventsMap.get(app.id) || [];
            const isExpanded = expanded === app.id;

            const timelineEvents: TimelineEvent[] = [
              { id: 'created', title: 'Отклик отправлен', date: app.createdAt, status: 'sent' },
              ...events.map((e) => ({
                id: e.id,
                title: e.message,
                date: e.createdAt,
                status: e.type,
              })),
            ];

            return (
              <div key={app.id}>
                <div className="vacancy-card" onClick={() => setExpanded(isExpanded ? null : app.id)} style={{ cursor: 'pointer' }}>
                  <div className="vacancy-card-header">
                    <h3>{vacancy?.title || 'Вакансия удалена'}</h3>
                    <span className="profile-tag">{applicationStatusLabels[app.status] || app.status}</span>
                  </div>
                  <div className="vacancy-card-meta">
                    {vacancy && <span><MapPin size={13} /> {vacancy.city}</span>}
                    <span><Clock size={13} /> {new Date(app.createdAt).toLocaleDateString('ru-RU')}</span>
                    {events.length > 0 && <span>{events.length} событий</span>}
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, marginLeft: 'auto' }}>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  </div>
                  {app.coverLetter && <p className="vacancy-card-desc">{app.coverLetter.slice(0, 120)}...</p>}
                </div>
                {app.status !== 'withdrawn' && <button className="platform-nav-btn ghost" onClick={async()=>{if(!window.confirm('Отозвать отклик?'))return;await applicationRepository.update({...app,status:'withdrawn'});setApps(prev=>prev.map(a=>a.id===app.id?{...a,status:'withdrawn'}:a));}}>Отозвать отклик</button>}
                {isExpanded && (
                  <div style={{ marginTop: 4, marginBottom: 12, padding: 16, borderRadius: 12, background: 'var(--glass)', border: '1px solid var(--glass-border)' }}>
                    <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Briefcase size={16} /> Хронология отклика
                    </h4>
                    <ActivityTimeline events={timelineEvents} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
