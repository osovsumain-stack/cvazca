import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Briefcase, Clock, Send, Check, Building2, Heart } from 'lucide-react';
import { vacancyRepository, accountRepository, applicationRepository } from '@/repositories/mockRepositories';
import { favoriteVacancyRepository } from '@/repositories/featureRepositories';
import { useAuth } from '@/services/authContext';
import type { VacancyPosting, PlatformAccount } from '@/types/platform';
import { EmptyState } from '@/components/EmptyState';

const experienceLabels: Record<string, string> = {
  none: 'Без опыта', '0-1': '0–1 год', '1-3': '1–3 года', '3-6': '3–6 лет', '6+': '6+ лет',
};

export function CareerVacanciesPage() {
  const { account: authAccount } = useAuth();
  const [vacancies, setVacancies] = useState<VacancyPosting[]>([]);
  const [account, setAccount] = useState<PlatformAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [formatFilter, setFormatFilter] = useState('');
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const acc = await accountRepository.getCurrentAccount();
      setAccount(acc);
      const v = await vacancyRepository.getPublished();
      setVacancies(v);
      if (acc) {
        const apps = await applicationRepository.getByCandidate(acc.id);
        setAppliedIds(new Set(apps.map((a) => a.vacancyId)));
        const favs = await favoriteVacancyRepository.getByAccount(acc.id);
        setFavoriteIds(new Set(favs.map((f) => f.vacancyId)));
      }
      setLoading(false);
    })().catch(() => setLoading(false));
  }, []);

  const filtered = vacancies.filter((v) => {
    if (search && !v.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (cityFilter && !v.city.toLowerCase().includes(cityFilter.toLowerCase())) return false;
    if (formatFilter && v.workFormat !== formatFilter) return false;
    return true;
  });

  const toggleFavorite = async (vacancyId: string) => {
    if (!account) return;
    const isFav = await favoriteVacancyRepository.toggle(account.id, vacancyId);
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (isFav) next.add(vacancyId); else next.delete(vacancyId);
      return next;
    });
  };

  if (loading) {
    return <div className="dashboard-page"><div className="dashboard-body"><p style={{ color: 'var(--muted)' }}>Загрузка...</p></div></div>;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-body">
        <div className="dashboard-header">
          <h1>Вакансии</h1>
          <p>Стажировки и стартовые позиции</p>
        </div>

        <div className="vacancy-filters">
          <div className="vacancy-search">
            <Search size={16} />
            <input placeholder="Поиск по названию" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <input placeholder="Город" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="form-input" />
          <select value={formatFilter} onChange={(e) => setFormatFilter(e.target.value)} className="form-input">
            <option value="">Все форматы</option>
            <option value="Офис">Офис</option>
            <option value="Гибрид">Гибрид</option>
            <option value="Удалённо">Удалённо</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={<Briefcase size={32} />} title="Подходящих вакансий пока нет" description="Попробуйте изменить фильтры или загляните позже" />
        ) : (
          <div className="vacancy-list">
            {filtered.map((v) => (
              <div className="vacancy-card" key={v.id}>
                <div className="vacancy-card-header">
                  <Link to={`/career/vacancies/${v.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <h3>{v.title}</h3>
                  </Link>
                  <span className="vacancy-salary">
                    {v.salaryFrom && v.salaryTo ? `${v.salaryFrom}–${v.salaryTo} ₽`
                      : v.salaryFrom ? `от ${v.salaryFrom} ₽`
                      : '—'}
                  </span>
                </div>
                <div className="vacancy-card-meta">
                  <span><MapPin size={13} /> {v.city}</span>
                  <span><Clock size={13} /> {v.workFormat}</span>
                  <span><Briefcase size={13} /> {experienceLabels[v.experienceLevel]}</span>
                  {v.suitableForMinors && <span style={{ color: '#16a34a' }}>Для {v.minimumAge}+</span>}
                </div>
                <p className="vacancy-card-desc">{v.description}</p>
                <div className="vacancy-card-skills">
                  {v.requirements.slice(0, 5).map((s) => <span className="profile-tag" key={s}>{s}</span>)}
                </div>
                <div className="vacancy-card-actions">
                  <button onClick={() => toggleFavorite(v.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: favoriteIds.has(v.id) ? '#dc2626' : 'var(--muted)', padding: 4, display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                    <Heart size={16} fill={favoriteIds.has(v.id) ? 'currentColor' : 'none'} /> {favoriteIds.has(v.id) ? 'В избранном' : 'В избранное'}
                  </button>
                  {appliedIds.has(v.id) ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, color: '#16a34a' }}>
                      <Check size={16} /> Отклик отправлен
                    </span>
                  ) : (
                    <Link to={`/career/vacancies/${v.id}`} className="platform-nav-btn primary">
                      <Send size={14} /> Откликнуться
                    </Link>
                  )}
                  <Link to={`/career/vacancies/${v.id}`} className="platform-nav-btn ghost">
                    Подробнее
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
