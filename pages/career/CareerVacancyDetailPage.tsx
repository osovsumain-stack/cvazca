import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapPin, Clock, Briefcase, Send, ArrowLeft, Check, FileText, Mail, Building2, Heart } from 'lucide-react';
import {
  vacancyRepository,
  applicationRepository,
  accountRepository,
  candidateRepository,
  resumeRepository,
  organizationRepository,
} from '@/repositories/mockRepositories';
import { favoriteVacancyRepository } from '@/repositories/featureRepositories';
import type { VacancyPosting, Organization, Resume, PlatformAccount, CandidateProfile } from '@/types/platform';
import { canApplyToVacancy } from '@/services/guardianPermissionService';
import { getSharedContacts } from '@/services/resumeService';
import { getAgeCategory } from '@/services/careerEligibilityService';
import { EmptyState } from '@/components/EmptyState';
import { notifyNewApplication } from '@/services/notificationService';

const experienceLabels: Record<string, string> = {
  none: 'Без опыта', '0-1': '0–1 год', '1-3': '1–3 года', '3-6': '3–6 лет', '6+': '6+ лет',
};

export function CareerVacancyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vacancy, setVacancy] = useState<VacancyPosting | null>(null);
  const [org, setOrg] = useState<Organization | null>(null);
  const [account, setAccount] = useState<PlatformAccount | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [hasProfile, setHasProfile] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [showApply, setShowApply] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [applyError, setApplyError] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    (async () => {
      const v = await vacancyRepository.getById(id!);
      setVacancy(v);
      if (v) {
        const o = await organizationRepository.getById(v.organizationId);
        setOrg(o);
        const acc = await accountRepository.getCurrentAccount();
        setAccount(acc);
        if (acc) {
          const p = await candidateRepository.getProfile(acc.id);
          setProfile(p);
          setHasProfile(!!p);
          const rs = await resumeRepository.getByCandidate(acc.id);
          setResumes(rs);
          const apps = await applicationRepository.getByCandidate(acc.id);
          setAlreadyApplied(apps.some((a) => a.vacancyId === v.id && a.status !== 'withdrawn'));
          const fav = await favoriteVacancyRepository.isFavorite(acc.id, v.id);
          setIsFavorite(fav);
        }
      }
      setLoading(false);
    })().catch(() => setLoading(false));
  }, [id]);

  const handleApply = async () => {
    if (!account) { navigate('/auth', { state: { from: `/career/vacancies/${id}` } }); return; }
    if (!vacancy) return;
    if (!hasProfile) { navigate('/career/onboarding'); return; }
    setApplyError('');
    setSubmitting(true);
    try {
      const p = await candidateRepository.getProfile(account.id);
      if (!p) { navigate('/career/onboarding'); return; }

      // Guardian permission check
      if (!canApplyToVacancy(p)) {
        setApplyError('Для отклика требуется подтверждение родителя или законного представителя.');
        setSubmitting(false);
        return;
      }

      // Minimum age check
      if (vacancy.minimumAge && p.birthDate) {
        const ageCategory = getAgeCategory(p.birthDate);
        const age = p.birthDate ? Math.floor((Date.now() - new Date(p.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;
        if (age !== null && age < vacancy.minimumAge) {
          setApplyError(`Эта вакансия доступна только кандидатам от ${vacancy.minimumAge} лет.`);
          setSubmitting(false);
          return;
        }
        if (ageCategory === 'under_14') {
          setApplyError('СВЯЗКА.Карьера доступна пользователям с 14 лет.');
          setSubmitting(false);
          return;
        }
      }

      const readiness = candidateRepository.getProfileCompletion(p);
      const sharedContacts = getSharedContacts(p);
      await applicationRepository.create({
        vacancyId: vacancy.id,
        candidateId: account.id,
        resumeId: selectedResumeId || null,
        coverLetter,
        readinessScore: readiness,
        status: 'sent',
        sharedContacts,
      });
      setAlreadyApplied(true);
      setShowApply(false);
    } catch (err) { setApplyError(err instanceof Error ? err.message : 'Не удалось отправить отклик'); } finally { setSubmitting(false); }
  };

  const toggleFavorite = async () => {
    if (!account) { navigate('/auth', { state: { from: `/career/vacancies/${id}` } }); return; }
    if (!vacancy) return;
    const isFav = await favoriteVacancyRepository.toggle(account.id, vacancy.id);
    setIsFavorite(isFav);
  };

  if (loading) {
    return <div className="dashboard-page"><div className="dashboard-body"><p style={{ color: 'var(--muted)' }}>Загрузка...</p></div></div>;
  }

  if (!vacancy || vacancy.status !== 'published') {
    return (
      <div className="dashboard-page">
        <div className="dashboard-body">
          <EmptyState icon={<Briefcase size={32} />} title="Вакансия не найдена" description="Возможно, она была закрыта или удалена" action={<Link to="/career/vacancies" className="platform-nav-btn primary">К списку вакансий</Link>} />
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-body">
        <Link to="/career/vacancies" className="platform-nav-btn ghost" style={{ marginBottom: 16 }}>
          <ArrowLeft size={16} /> К списку вакансий
        </Link>

          <div className="vacancy-detail">
            <div className="vacancy-detail-header">
              <h1>{vacancy.title}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--blue)' }}>
                  {vacancy.salaryFrom && vacancy.salaryTo ? `${vacancy.salaryFrom}–${vacancy.salaryTo} ${vacancy.salaryCurrency}`
                    : vacancy.salaryFrom ? `от ${vacancy.salaryFrom} ${vacancy.salaryCurrency}`
                    : 'Зарплата не указана'}
                </span>
                <button onClick={toggleFavorite} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isFavorite ? '#dc2626' : 'var(--muted)', padding: 4, display: 'flex', alignItems: 'center' }}>
                  <Heart size={22} fill={isFavorite ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>

            <div className="vacancy-card-meta" style={{ marginBottom: 16 }}>
              <span><Building2 size={13} /> {org?.shortName || org?.name || 'Компания'}</span>
              <span><MapPin size={13} /> {vacancy.city}</span>
              <span><Clock size={13} /> {vacancy.workFormat}</span>
              <span><Briefcase size={13} /> {vacancy.employmentType}</span>
              <span>Опыт: {experienceLabels[vacancy.experienceLevel]}</span>
            </div>

            {vacancy.suitableForMinors && vacancy.minimumAge && (
              <span className="vacancy-status-badge" style={{ color: '#16a34a', background: 'rgba(22,163,74,0.08)', marginBottom: 16, display: 'inline-flex' }}>
                Доступно кандидатам {vacancy.minimumAge}+ лет
              </span>
            )}

            {vacancy.description && (
              <div className="vacancy-detail-section">
                <h3>Описание</h3>
                <p>{vacancy.description}</p>
              </div>
            )}
            {vacancy.responsibilities.length > 0 && (
              <div className="vacancy-detail-section">
                <h3>Обязанности</h3>
                <ul>{vacancy.responsibilities.map((r, i) => <li key={i}>{r}</li>)}</ul>
              </div>
            )}
            {vacancy.requirements.length > 0 && (
              <div className="vacancy-detail-section">
                <h3>Требования</h3>
                <ul>{vacancy.requirements.map((r, i) => <li key={i}>{r}</li>)}</ul>
              </div>
            )}
            {vacancy.niceToHave.length > 0 && (
              <div className="vacancy-detail-section">
                <h3>Будет плюсом</h3>
                <ul>{vacancy.niceToHave.map((r, i) => <li key={i}>{r}</li>)}</ul>
              </div>
            )}
            {vacancy.skills.length > 0 && (
              <div className="vacancy-detail-section">
                <h3>Навыки</h3>
                <div className="vacancy-card-skills">{vacancy.skills.map((s) => <span className="profile-tag" key={s}>{s}</span>)}</div>
              </div>
            )}

            <div className="vacancy-detail-section">
              <h3>Контакты</h3>
              <div style={{ fontSize: 14, color: 'var(--muted)' }}>
                <div><Mail size={13} /> {vacancy.contactEmail}</div>
                {vacancy.contactPerson && <div>{vacancy.contactPerson}</div>}
              </div>
            </div>

            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--line)' }}>
              {alreadyApplied ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#16a34a' }}>
                  <Check size={18} /> Вы уже откликнулись на эту вакансию
                </div>
              ) : !showApply ? (
                <div>
                  {applyError && (
                    <div style={{ marginBottom: 12, padding: '12px 16px', borderRadius: 10, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', fontSize: 13, color: '#d97706' }}>
                      {applyError}{' '}
                      {applyError.includes('родителя') && <Link to="/career/profile" style={{ textDecoration: 'underline' }}>Перейти к подтверждению</Link>}
                    </div>
                  )}
                  <button className="platform-nav-btn primary" onClick={() => { if (!hasProfile) navigate('/career/onboarding'); else setShowApply(true); }}>
                    <Send size={16} /> Откликнуться
                  </button>
                </div>
              ) : (
                <div className="vacancy-apply-form">
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Отклик на вакансию</h3>
                  {resumes.length === 0 ? (
                    <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 12 }}>
                      У вас нет резюме. <Link to="/career/resumes" style={{ color: 'var(--blue)' }}>Создайте резюме</Link>, чтобы повысить шансы.
                    </div>
                  ) : (
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Выберите резюме</label>
                      <select className="form-input" value={selectedResumeId} onChange={(e) => setSelectedResumeId(e.target.value)}>
                        <option value="">Без резюме</option>
                        {resumes.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
                      </select>
                    </div>
                  )}
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Сопроводительное письмо (необязательно)</label>
                    <textarea className="form-input" rows={4} value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} placeholder="Расскажите, почему вы подходите" />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="platform-nav-btn primary" onClick={handleApply} disabled={submitting}>
                      {submitting ? 'Отправка...' : <><Send size={16} /> Отправить отклик</>}
                    </button>
                    <button className="platform-nav-btn ghost" onClick={() => setShowApply(false)}>Отмена</button>
                  </div>
                </div>
              )}
            </div>
          </div>
      </div>
    </div>
  );
}
