import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { downloadResume } from '@/services/resumeExport';
import { Link } from 'react-router-dom';
import { FileText, Plus, Copy, Trash2, Download, Eye, EyeOff, Briefcase } from 'lucide-react';
import { resumeRepository, accountRepository, candidateRepository } from '@/repositories/mockRepositories';
import type { Resume, PlatformAccount } from '@/types/platform';
import { canPublishResume } from '@/services/guardianPermissionService';
import { toggleResumePublic } from '@/services/resumeService';
import { EmptyState } from '@/components/EmptyState';
import { PublicConsentModal, type PublicConsentCategories } from '@/components/PublicConsentModal';
import { recordPublicDistributionConsent, hasPublicDistributionConsent } from '@/services/consentService';

export function CareerResumesPage() {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [account, setAccount] = useState<PlatformAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPosition, setNewPosition] = useState('');
  const [guardianError, setGuardianError] = useState('');
  const [consentModalOpen, setConsentModalOpen] = useState(false);
  const [pendingResume, setPendingResume] = useState<Resume | null>(null);

  useEffect(() => {
    (async () => {
      const acc = await accountRepository.getCurrentAccount();
      setAccount(acc);
      if (acc) {
        const r = await resumeRepository.getByCandidate(acc.id);
        setResumes(r);
      }
      setLoading(false);
    })().catch(() => setLoading(false));
  }, []);

  const reload = async () => {
    if (account) setResumes(await resumeRepository.getByCandidate(account.id));
  };

  const handleCreate = async () => {
    if (!account || !newTitle.trim()) return;
    const created = await resumeRepository.create({
      candidateId: account.id,
      title: newTitle,
      targetPosition: newPosition.trim() || newTitle.trim(),
      summary: '',
      experienceIds: [],
      educationIncluded: true,
      skills: [],
      isPublic: false,
      publicSlug: '',
      visibility: { showEmail: false, showPhone: false, showCity: true, showExperience: true },
    });
    setNewTitle('');
    setNewPosition('');
    setShowCreate(false);
    navigate(`/career/resumes/${created.id}`);
  };

  const handleDuplicate = async (id: string) => {
    await resumeRepository.duplicate(id);
    await reload();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Удалить резюме? Его публичная ссылка перестанет работать.')) return;
    await resumeRepository.delete(id);
    await reload();
  };

  const handleTogglePublic = async (resume: Resume) => {
    if (!resume.isPublic) {
      const profile = account ? await candidateRepository.getProfile(account.id) : null;
      if (profile && !canPublishResume(profile)) {
        setGuardianError('Для публикации резюме требуется подтверждение родителя или законного представителя.');
        return;
      }
      const hasConsent = account ? await hasPublicDistributionConsent(account.id) : false;
      if (!hasConsent) {
        setPendingResume(resume);
        setConsentModalOpen(true);
        return;
      }
    }
    setGuardianError('');
    try {
      const profile = account ? await candidateRepository.getProfile(account.id) : null;
      if (profile) {
        await toggleResumePublic(resume.id, profile);
      } else {
        await resumeRepository.update({ ...resume, isPublic: !resume.isPublic });
      }
    } catch {
      // PermissionError - already shown by guardianError
    }
    await reload();
  };

  const handleConsentConfirm = async (categories: PublicConsentCategories) => {
    if (!account || !pendingResume) return;
    await recordPublicDistributionConsent(account.id, categories);
    setConsentModalOpen(false);
    setPendingResume(null);
    const profile = await candidateRepository.getProfile(account.id);
    if (profile) {
      await toggleResumePublic(pendingResume.id, profile);
    } else {
      await resumeRepository.update({ ...pendingResume, isPublic: true });
    }
    await reload();
  };

  const handleDownload = async (resume: Resume) => {
    const profile = account ? await candidateRepository.getProfile(account.id) : null;
    await downloadResume(resume, profile);
  };

  if (loading) {
    return <div className="dashboard-page"><div className="dashboard-body"><p style={{ color: 'var(--muted)' }}>Загрузка...</p></div></div>;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-body">
        <div className="dashboard-header">
          <h1>Резюме</h1>
          <p>Создавайте разные резюме под разные позиции</p>
        </div>

        {guardianError && (
          <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 10, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', fontSize: 13, color: '#d97706' }}>
            {guardianError} <Link to="/career/profile" style={{ textDecoration: 'underline' }}>Перейти к подтверждению</Link>
          </div>
        )}

        {resumes.length === 0 && !showCreate ? (
          <EmptyState
            icon={<FileText size={32} />}
            title="У вас пока нет резюме"
            description="Создайте первое резюме — его можно будет скачать в PDF"
            action={<button className="platform-nav-btn primary" onClick={() => setShowCreate(true)}><Plus size={16} /> Создать резюме</button>}
          />
        ) : (
          <>
            {showCreate && (
              <div className="create-form">
                <h3>Новое резюме</h3>
                <input className="form-input" placeholder="Название резюме (например: Маркетолог)" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
                <input className="form-input" placeholder="Целевая позиция" value={newPosition} onChange={(e) => setNewPosition(e.target.value)} />
                <div className="create-form-actions">
                  <button className="platform-nav-btn primary" onClick={handleCreate} disabled={!newTitle.trim()}>Создать</button>
                  <button className="platform-nav-btn ghost" onClick={() => setShowCreate(false)}>Отмена</button>
                </div>
              </div>
            )}

            <div className="resume-list">
              {resumes.map((resume) => (
                <div className="resume-card" key={resume.id}>
                  <div className="resume-card-header">
                    <div className="resume-card-icon"><Briefcase size={18} /></div>
                    <div>
                      <h3>{resume.title}</h3>
                      <p>{resume.targetPosition || 'Позиция не указана'}</p>
                    </div>
                    <span className={`resume-status ${resume.isPublic ? 'public' : 'private'}`}>
                      {resume.isPublic ? <><Eye size={12} /> Опубликовано</> : <><EyeOff size={12} /> Скрыто</>}
                    </span>
                  </div>
                  <div className="resume-card-actions">
                    <button onClick={() => handleDownload(resume)}><Download size={14} /> PDF</button>
                    <button onClick={() => handleDuplicate(resume.id)}><Copy size={14} /> Дублировать</button>
                    <button onClick={() => handleTogglePublic(resume)}>{resume.isPublic ? <><EyeOff size={14} /> Скрыть</> : <><Eye size={14} /> Опубликовать</>}</button>
                    <button onClick={() => handleDelete(resume.id)} className="danger"><Trash2 size={14} /> Удалить</button>
                  </div>
                </div>
              ))}
            </div>

            <button className="platform-nav-btn ghost" onClick={() => setShowCreate(true)} style={{ marginTop: 16 }}>
              <Plus size={16} /> Создать ещё резюме
            </button>
          </>
        )}

        <PublicConsentModal
          open={consentModalOpen}
          onClose={() => { setConsentModalOpen(false); setPendingResume(null); }}
          onConfirm={handleConsentConfirm}
        />
      </div>
    </div>
  );
}
