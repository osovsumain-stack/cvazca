import { useState, useEffect } from 'react';
import { Heart, MapPin, Briefcase, ArrowRight } from 'lucide-react';
import { favoriteVacancyRepository } from '@/repositories/featureRepositories';
import { vacancyRepository as mainVacancyRepo } from '@/repositories/mockRepositories';
import { useAuth } from '@/services/authContext';
import type { VacancyPosting, FavoriteVacancy } from '@/types/platform';
import { PageHeader, Card, SearchInput } from '@/components/ui';
import { EmptyState } from '@/components/EmptyState';
import { useNavigate } from 'react-router-dom';

export function CareerFavoritesPage() {
  const { account } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<FavoriteVacancy[]>([]);
  const [vacancies, setVacancies] = useState<VacancyPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!account) { setLoading(false); return; }
    let active = true;
    setLoading(true);
    Promise.all([favoriteVacancyRepository.getByAccount(account.id), mainVacancyRepo.getPublished()]).then(([favs, published]) => {
      if (!active) return;
      setFavorites(favs);
      const ids = new Set(favs.map(f => f.vacancyId));
      setVacancies(published.filter(v => ids.has(v.id)));
      setLoading(false);
    }).catch(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [account]);

  const filtered = vacancies.filter((v) =>
    !search || v.title.toLowerCase().includes(search.toLowerCase()) || v.city.toLowerCase().includes(search.toLowerCase())
  );

  const removeFavorite = async (vacancyId: string) => {
    if (!account) return;
    await favoriteVacancyRepository.remove(account.id, vacancyId);
    setFavorites(favorites.filter((f) => f.vacancyId !== vacancyId));
    setVacancies(vacancies.filter((v) => v.id !== vacancyId));
  };

  if (loading) return <div className="dashboard-page"><div className="dashboard-body"><p style={{ color: 'var(--muted)' }}>Загрузка...</p></div></div>;

  return (
    <div className="dashboard-page">
      <div className="dashboard-body" style={{ maxWidth: 1000, margin: '0 auto' }}>
        <PageHeader title="Избранные вакансии" subtitle="Вакансии, которые вы сохранили" />
          {favorites.length > vacancies.length && <Card style={{ padding: 16, marginBottom: 16 }}>
            <p>Часть сохранённых вакансий больше не принимает отклики.</p>
            <button className="platform-nav-btn" onClick={async () => {
              const available = new Set(vacancies.map(v => v.id));
              await Promise.all(favorites.filter(f => !available.has(f.vacancyId)).map(f => favoriteVacancyRepository.remove(account!.id, f.vacancyId)));
              setFavorites(favorites.filter(f => available.has(f.vacancyId)));
            }}>Убрать недоступные вакансии из избранного</button>
          </Card>}

          {vacancies.length === 0 ? (
            <EmptyState
              icon={<Heart size={32} />}
              title="Нет избранных вакансий"
              description="Нажмите на сердечко на карточке вакансии, чтобы сохранить её"
              action={<button onClick={() => navigate('/career/vacancies')} className="platform-nav-btn primary" style={{ fontSize: 14 }}>Перейти к вакансиям</button>}
            />
          ) : (
            <>
              <div style={{ marginBottom: 20 }}>
                <SearchInput value={search} onChange={setSearch} placeholder="Поиск..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {filtered.map((v) => (
                  <Card key={v.id} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, flex: 1, paddingRight: 8 }}>{v.title}</h3>
                      <button onClick={() => removeFavorite(v.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 4 }}>
                        <Heart size={18} fill="currentColor" />
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 13, color: 'var(--muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={14} /> {v.city}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Briefcase size={14} /> {v.workFormat}</span>
                    </div>
                    {v.salaryFrom && (
                      <div style={{ fontSize: 14, fontWeight: 600 }}>
                        {v.salaryFrom.toLocaleString('ru-RU')} {v.salaryCurrency}
                        {v.salaryTo && ` — ${v.salaryTo.toLocaleString('ru-RU')} ${v.salaryCurrency}`}
                      </div>
                    )}
                    <button onClick={() => navigate(`/career/vacancies/${v.id}`)} style={{ textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--blue)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      Подробнее <ArrowRight size={14} />
                    </button>
                  </Card>
                ))}
              </div>
            </>
          )}
      </div>
    </div>
  );
}
