import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Briefcase, TrendingUp, Sparkles } from 'lucide-react';
import { vacancyRepository } from '@/repositories/mockRepositories';
import type { VacancyPosting } from '@/types/platform';

type Tab = 'new' | 'popular' | 'promoted';

export function HomeVacanciesTeaser() {
  const [tab, setTab] = useState<Tab>('new');
  const [vacancies, setVacancies] = useState<VacancyPosting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const all = await vacancyRepository.getAll();
      const published = all.filter((v) => v.status === 'published');
      const sorted = [...published].sort((a, b) => {
        if (tab === 'new') return b.createdAt.localeCompare(a.createdAt);
        if (tab === 'popular') return (b.views || 0) - (a.views || 0);
        if (tab === 'promoted') {
          const aPromo = a.promotion ? 1 : 0;
          const bPromo = b.promotion ? 1 : 0;
          if (bPromo !== aPromo) return bPromo - aPromo;
          return b.createdAt.localeCompare(a.createdAt);
        }
        return 0;
      });
      setVacancies(sorted.slice(0, 6));
      setLoading(false);
    })();
  }, [tab]);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'new', label: 'Новые', icon: <Sparkles size={14} /> },
    { key: 'popular', label: 'Популярные', icon: <TrendingUp size={14} /> },
    { key: 'promoted', label: 'Рекомендуемые', icon: <Briefcase size={14} /> },
  ];

  return (
    <section className="platform-section">
      <div className="platform-section-header">
        <h2>Свежие вакансии</h2>
        <p>Стажировки и стартовые позиции для начинающих специалистов</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 100,
              border: `1px solid ${tab === t.key ? 'var(--blue)' : 'var(--line)'}`,
              background: tab === t.key ? 'rgba(25,181,254,0.08)' : 'transparent',
              color: tab === t.key ? 'var(--blue)' : 'var(--muted)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <div className="animate-spin" style={{ width: 24, height: 24, border: '2px solid var(--line)', borderTopColor: 'var(--blue)', borderRadius: '50%' }} />
        </div>
      ) : vacancies.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
          Пока нет опубликованных вакансий
        </div>
      ) : (
        <div className="home-vacancies-grid">
          {vacancies.map((v) => (
            <Link to={`/career/vacancies/${v.id}`} key={v.id} className="home-vacancy-card css-fade-up">
              {v.promotion && (
                <span className="home-vacancy-promo-badge" style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'var(--blue)',
                  background: 'rgba(25,181,254,0.12)',
                  padding: '3px 8px',
                  borderRadius: 100,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}>Реклама</span>
              )}
              <h3>{v.title}</h3>
              <div className="home-vacancy-meta">
                {v.city && <span><MapPin size={12} /> {v.city}</span>}
                <span><Briefcase size={12} /> {v.employmentType}</span>
                {v.salaryFrom && <span>от {v.salaryFrom.toLocaleString('ru-RU')} {v.salaryCurrency}</span>}
              </div>
              <p className="home-vacancy-desc">{v.description.slice(0, 120)}{v.description.length > 120 ? '...' : ''}</p>
              {v.skills.length > 0 && (
                <div className="home-vacancy-skills">
                  {v.skills.slice(0, 3).map((s) => <span key={s} className="profile-tag">{s}</span>)}
                </div>
              )}
              <div className="home-vacancy-footer">
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Подробнее</span>
                <ArrowRight size={14} style={{ color: 'var(--blue)' }} />
              </div>
            </Link>
          ))}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Link to="/career/vacancies" className="platform-nav-btn ghost">
          Все вакансии <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}
