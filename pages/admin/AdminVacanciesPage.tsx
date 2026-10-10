import { useState, useEffect } from 'react';
import { Check, X, AlertTriangle, Building2, MapPin, Clock, Briefcase, Mail, User } from 'lucide-react';
import { vacancyRepository, vacancyEventRepository, organizationRepository, accountRepository } from '@/repositories/mockRepositories';
import { notifyVacancyApproved, notifyVacancyRejected } from '@/services/notificationService';
import type { VacancyPosting, VacancyStatus, Organization, PlatformAccount } from '@/types/platform';
import { EmptyState } from '@/components/EmptyState';

const statusLabels: Record<VacancyStatus, string> = {
  draft: 'Черновик', pending_moderation: 'На модерации', approved: 'Одобрена', published: 'Опубликована',
  paused: 'Приостановлена', rejected: 'Отклонена', closed: 'Закрыта', archived: 'В архиве',
};

type AdminFilter = 'pending_moderation' | 'approved' | 'published' | 'rejected';

const discriminationPatterns = [
  { pattern: /\b(только\s+мужчин|только\s+женщин|мужского\s+пола|женского\s+пола)\b/i, reason: 'Указание пола может быть дискриминационным' },
  { pattern: /\b(до\s+\d{2}\s+лет|моложе\s+\d{2}|старше\s+\d{2})\b/i, reason: 'Возрастной фильтр может быть дискриминационным' },
  { pattern: /\b(славян|русск|не\s+кавказ|не\s+азиат)\b/i, reason: 'Указание национальности дискриминационно' },
  { pattern: /\b(без\s+детей|без\s+семейных|не\s+замужем|не\s+женат)\b/i, reason: 'Указание семейного положения может быть дискриминационным' },
];

function checkDiscrimination(text: string): string[] {
  const found: string[] = [];
  for (const { pattern, reason } of discriminationPatterns) {
    if (pattern.test(text)) found.push(reason);
  }
  return found;
}

export function AdminVacanciesPage() {
  const [vacancies, setVacancies] = useState<VacancyPosting[]>([]);
  const [filter, setFilter] = useState<AdminFilter>('pending_moderation');
  const [orgs, setOrgs] = useState<Map<string, Organization>>(new Map());
  const [authors, setAuthors] = useState<Map<string, PlatformAccount>>(new Map());
  const [selected, setSelected] = useState<VacancyPosting | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const all = await vacancyRepository.getAll();
    setVacancies(all);
    const orgIds = [...new Set(all.map((v) => v.organizationId))];
    const os = await Promise.all(orgIds.map((id) => organizationRepository.getById(id)));
    setOrgs(new Map(os.filter(Boolean).map((o) => [o!.id, o!])));
    const authorIds = [...new Set(all.map((v) => v.createdBy).filter((id) => id && id !== 'demo'))];
    const accs = await Promise.all(authorIds.map((id) => accountRepository.getById(id)));
    setAuthors(new Map(accs.filter(Boolean).map((a) => [a!.id, a!])));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = vacancies.filter((v) => v.status === filter);

  const handleApprove = async (v: VacancyPosting) => {
    await vacancyRepository.approve(v.id, 'admin');
    await vacancyEventRepository.create({ vacancyId: v.id, type: 'approved', actorAccountId: 'admin', message: 'Вакансия одобрена администратором' });
    if (v.createdBy && v.createdBy !== 'demo') {
      await notifyVacancyApproved(v.createdBy, v.title);
    }
    setSelected(null);
    await load();
  };

  const handleReject = async () => {
    if (!selected || !rejectComment.trim()) return;
    await vacancyRepository.reject(selected.id, 'admin', rejectComment);
    await vacancyEventRepository.create({ vacancyId: selected.id, type: 'rejected', actorAccountId: 'admin', message: `Отклонена: ${rejectComment}` });
    if (selected.createdBy && selected.createdBy !== 'demo') {
      await notifyVacancyRejected(selected.createdBy, selected.title, rejectComment);
    }
    setShowReject(false);
    setRejectComment('');
    setSelected(null);
    await load();
  };

  if (loading) {
    return <div className="dashboard-page"><div className="dashboard-body"><p style={{ color: 'var(--muted)' }}>Загрузка...</p></div></div>;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-body">
        <div className="dashboard-header">
          <h1>Модерация вакансий</h1>
          <p>Проверка вакансий перед публикацией</p>
        </div>

        <div className="vacancy-filters">
          {(['pending_moderation', 'approved', 'published', 'rejected'] as AdminFilter[]).map((f) => (
            <button key={f} className={`platform-nav-btn ${filter === f ? 'primary' : 'ghost'}`} onClick={() => setFilter(f)} style={{ fontSize: 13 }}>
              {statusLabels[f]}
            </button>
          ))}
        </div>

          {filtered.length === 0 ? (
            <EmptyState icon={<Check size={32} />} title="Нет вакансий в этом статусе" description="Здесь пусто" />
          ) : (
            <div className="vacancy-list">
              {filtered.map((v) => {
                const org = orgs.get(v.organizationId);
                const author = authors.get(v.createdBy);
                return (
                  <div className="vacancy-card" key={v.id}>
                    <div className="vacancy-card-header">
                      <h3>{v.title}</h3>
                      <span className="vacancy-status-badge" style={{ color: 'var(--blue)', background: 'rgba(25,181,254,0.08)' }}>
                        {statusLabels[v.status]}
                      </span>
                    </div>
                    <div className="vacancy-card-meta">
                      <span><Building2 size={13} /> {org?.shortName || org?.name || 'Организация'}</span>
                      {org?.inn && <span>ИНН: {org.inn}</span>}
                      <span><MapPin size={13} /> {v.city}</span>
                      <span><Clock size={13} /> {new Date(v.createdAt).toLocaleDateString('ru-RU')}</span>
                      {author && <span><User size={13} /> {author.displayName}</span>}
                    </div>
                    <p className="vacancy-card-desc">{v.description}</p>
                    <div className="vacancy-card-skills">
                      {v.requirements.slice(0, 5).map((s) => <span className="profile-tag" key={s}>{s}</span>)}
                    </div>
                    {v.moderationComment && v.status === 'rejected' && (
                      <div style={{ fontSize: 13, color: '#ef4444', padding: '8px 12px', background: 'rgba(239,68,68,0.06)', borderRadius: 8, margin: '8px 0' }}>
                        Причина: {v.moderationComment}
                      </div>
                    )}
                    {v.status === 'pending_moderation' && (
                      <div className="vacancy-card-actions">
                        <button className="platform-nav-btn primary" onClick={() => setSelected(v)}>
                          <Check size={14} /> Проверить
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {selected && (
            <div className="modal-overlay" onClick={() => { setSelected(null); setShowReject(false); setRejectComment(''); }}>
              <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
                <ModerationDetail
                  vacancy={selected}
                  org={orgs.get(selected.organizationId)}
                  author={authors.get(selected.createdBy)}
                  onApprove={() => handleApprove(selected)}
                  onReject={() => setShowReject(true)}
                  showReject={showReject}
                  setShowReject={setShowReject}
                  rejectComment={rejectComment}
                  setRejectComment={setRejectComment}
                  onConfirmReject={handleReject}
                  onClose={() => { setSelected(null); setShowReject(false); setRejectComment(''); }}
                />
              </div>
            </div>
          )}
      </div>
    </div>
  );
}

function ModerationDetail({
  vacancy, org, author, onApprove, onReject, showReject, setShowReject, rejectComment, setRejectComment, onConfirmReject, onClose,
}: {
  vacancy: VacancyPosting;
  org?: Organization;
  author?: PlatformAccount;
  onApprove: () => void;
  onReject: () => void;
  showReject: boolean;
  setShowReject: (v: boolean) => void;
  rejectComment: string;
  setRejectComment: (v: string) => void;
  onConfirmReject: () => void;
  onClose: () => void;
}) {
  const warnings = checkDiscrimination(`${vacancy.title} ${vacancy.description} ${vacancy.requirements.join(' ')} ${vacancy.responsibilities.join(' ')}`);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{vacancy.title}</h2>
        <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20} /></button>
      </div>

      {warnings.length > 0 && (
        <div style={{ marginBottom: 12, padding: '12px 16px', borderRadius: 12, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#d97706', marginBottom: 4 }}>
            <AlertTriangle size={16} /> Потенциально проблемные формулировки
          </div>
          {warnings.map((w, i) => <div key={i} style={{ fontSize: 12, color: '#d97706', marginLeft: 24 }}>{w}</div>)}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, marginBottom: 16 }}>
        <div><strong>Организация:</strong> {org?.fullName || org?.name || '—'}</div>
        {org?.inn && <div><strong>ИНН:</strong> {org.inn}</div>}
        <div><strong>Автор:</strong> {author?.displayName || '—'}</div>
        <div><strong>Город:</strong> {vacancy.city}</div>
        <div><strong>Формат:</strong> {vacancy.workFormat} · {vacancy.employmentType}</div>
        <div><strong>Зарплата:</strong> {vacancy.salaryFrom && vacancy.salaryTo ? `${vacancy.salaryFrom}–${vacancy.salaryTo} ${vacancy.salaryCurrency}` : vacancy.salaryFrom ? `от ${vacancy.salaryFrom}` : '—'}</div>
        <div><strong>Опыт:</strong> {vacancy.experienceLevel}</div>
        {vacancy.suitableForMinors && <div><strong>Для несовершеннолетних:</strong> от {vacancy.minimumAge} лет</div>}
        <div><strong>Контакт:</strong> {vacancy.contactPerson} · {vacancy.contactEmail}</div>
      </div>

      <div style={{ fontSize: 13, marginBottom: 8 }}><strong>Описание:</strong><br />{vacancy.description}</div>
      {vacancy.responsibilities.length > 0 && <div style={{ fontSize: 13, marginBottom: 8 }}><strong>Обязанности:</strong> {vacancy.responsibilities.join(', ')}</div>}
      {vacancy.requirements.length > 0 && <div style={{ fontSize: 13, marginBottom: 8 }}><strong>Требования:</strong> {vacancy.requirements.join(', ')}</div>}
      {vacancy.niceToHave.length > 0 && <div style={{ fontSize: 13, marginBottom: 8 }}><strong>Будет плюсом:</strong> {vacancy.niceToHave.join(', ')}</div>}
      {vacancy.skills.length > 0 && <div style={{ fontSize: 13, marginBottom: 16 }}><strong>Навыки:</strong> {vacancy.skills.join(', ')}</div>}

      {showReject ? (
        <div>
          <textarea className="form-input" rows={3} placeholder="Укажите причину отклонения" value={rejectComment} onChange={(e) => setRejectComment(e.target.value)} style={{ marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="platform-nav-btn primary" onClick={onConfirmReject} disabled={!rejectComment.trim()}>
              <Check size={16} /> Подтвердить отказ
            </button>
            <button className="platform-nav-btn ghost" onClick={() => setShowReject(false)}>Отмена</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button className="platform-nav-btn primary" onClick={onApprove}><Check size={16} /> Одобрить</button>
          <button className="platform-nav-btn ghost" onClick={onReject} style={{ color: '#ef4444' }}><X size={16} /> Отклонить</button>
        </div>
      )}
    </div>
  );
}
