import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { User, MapPin, Mail, Phone, GraduationCap, Briefcase, Star, Globe, Target, Edit3, Sparkles, Plus, Trash2, X, Check, ShieldAlert, ShieldCheck, Send, Copy, Link2 } from 'lucide-react';
import { candidateRepository, accountRepository, guardianVerificationRepository } from '@/repositories/mockRepositories';
import { calculateAge, getAgeCategory } from '@/services/careerEligibilityService';
import type { CandidateProfile, PlatformAccount, GuardianVerification } from '@/types/platform';
import type { ExperienceItem, SkillItem, LanguageItem } from '@/types';
import { EmptyState } from '@/components/EmptyState';

// Age functions imported from careerEligibilityService

// Determines isMinor eligibility from birthDate, but does NOT reset
// the guardian verification workflow status. Only transitions
// not_required -> required when a minor first becomes eligible.
function applyAgeEligibility(profile: CandidateProfile): CandidateProfile {
  const category = getAgeCategory(profile.birthDate);
  if (category === 'adult') {
    return { ...profile, isMinor: false, guardianVerificationStatus: 'not_required' };
  }
  if (category === 'minor') {
    if (!profile.isMinor) {
      // First time becoming minor-eligible
      return { ...profile, isMinor: true, guardianVerificationStatus: 'required' };
    }
    // Already minor: preserve pending/verified/rejected status
    return profile;
  }
  // under_14 or unknown: not minor
  return { ...profile, isMinor: false, guardianVerificationStatus: 'not_required' };
}

const experienceTypes = [
  { value: 'work', label: 'Работа' },
  { value: 'internship', label: 'Стажировка' },
  { value: 'freelance', label: 'Фриланс' },
  { value: 'volunteering', label: 'Волонтёрство' },
  { value: 'community', label: 'Общественная деятельность' },
  { value: 'study_project', label: 'Учебный проект' },
  { value: 'own_project', label: 'Собственный проект' },
  { value: 'hackathon', label: 'Хакатон' },
];

export function CareerProfilePage() {
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [account, setAccount] = useState<PlatformAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    const acc = await accountRepository.getCurrentAccount();
    setAccount(acc);
    if (acc) {
      const p = await candidateRepository.getProfile(acc.id);
      setProfile(p);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleSave = async (updated: CandidateProfile) => {
    // Apply age eligibility without resetting workflow status
    if (updated.birthDate) {
      updated = applyAgeEligibility(updated);
    }
    await candidateRepository.saveProfile(updated);
    setProfile(updated);
    setEditingSection(null);
  };

  if (loading) {
    return <div className="dashboard-page"><div className="dashboard-body"><p style={{ color: 'var(--muted)' }}>Загрузка...</p></div></div>;
  }

  if (!profile) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-body">
          <EmptyState
            icon={<User size={32} />}
            title="Профиль не заполнен"
            description="Пройдите карьерный маршрут, чтобы заполнить профиль"
            action={<Link to="/career/onboarding" className="platform-nav-btn primary"><Sparkles size={16} /> Начать карьерный маршрут</Link>}
          />
        </div>
      </div>
    );
  }

  const completion = candidateRepository.getProfileCompletion(profile);
  const age = calculateAge(profile.birthDate);

  return (
    <div className="dashboard-page">
      <div className="dashboard-body">
        <div className="profile-header">
          <div className="profile-avatar">
            {profile.photo || account?.avatarUrl ? (
              <img src={profile.photo || account?.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            ) : (
              <span style={{ fontSize: 32, fontWeight: 700, color: '#fff' }}>{(profile.firstName || '?')[0]}</span>
            )}
          </div>
          <div className="profile-info">
            <h1>{profile.firstName} {profile.lastName}</h1>
            <p className="profile-subtitle">
              {age && <span>{age} лет</span>}
              {profile.city && <span> · {profile.city}</span>}
              {profile.profession && <span> · {profile.profession}</span>}
            </p>
            <div className="profile-completion-bar">
              <div className="profile-completion-fill" style={{ width: `${completion}%` }} />
              <span className="profile-completion-text">Профиль заполнен на {completion}%</span>
            </div>
            {profile.isMinor && (
              <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '4px 12px', borderRadius: 8, background: profile.guardianVerificationStatus === 'verified' ? 'rgba(22,163,74,0.08)' : 'rgba(245,158,11,0.08)', color: profile.guardianVerificationStatus === 'verified' ? '#16a34a' : '#d97706' }}>
                {profile.guardianVerificationStatus === 'verified' ? <><ShieldCheck size={14} /> Подтверждено родителем</> : <><ShieldAlert size={14} /> Требуется подтверждение родителя</>}
              </div>
            )}
          </div>
        </div>

        {profile.isMinor && (
          <GuardianSection profile={profile} onUpdated={loadProfile} />
        )}

        <div className="profile-sections">
          <BasicInfoSection profile={profile} editing={editingSection === 'basic'} onEdit={() => setEditingSection('basic')} onCancel={() => setEditingSection(null)} onSave={handleSave} />
          <EducationSection profile={profile} editing={editingSection === 'education'} onEdit={() => setEditingSection('education')} onCancel={() => setEditingSection(null)} onSave={handleSave} />
          <ExperienceSection profile={profile} editing={editingSection === 'experience'} onEdit={() => setEditingSection('experience')} onCancel={() => setEditingSection(null)} onSave={handleSave} />
          <SkillsSection profile={profile} editing={editingSection === 'skills'} onEdit={() => setEditingSection('skills')} onCancel={() => setEditingSection(null)} onSave={handleSave} />
          <SoftSkillsSection profile={profile} editing={editingSection === 'soft'} onEdit={() => setEditingSection('soft')} onCancel={() => setEditingSection(null)} onSave={handleSave} />
          <LanguagesSection profile={profile} editing={editingSection === 'languages'} onEdit={() => setEditingSection('languages')} onCancel={() => setEditingSection(null)} onSave={handleSave} />
          <PreferencesSection profile={profile} editing={editingSection === 'prefs'} onEdit={() => setEditingSection('prefs')} onCancel={() => setEditingSection(null)} onSave={handleSave} />
        </div>
      </div>
    </div>
  );
}

function SectionWrapper({ title, icon, editing, onEdit, onCancel, children }: { title: string; icon: React.ReactNode; editing: boolean; onEdit: () => void; onCancel: () => void; children: React.ReactNode }) {
  return (
    <div className="profile-section">
      <div className="profile-section-header">
        <span className="profile-section-icon">{icon}</span>
        <h3>{title}</h3>
        {editing ? (
          <button className="profile-section-edit" onClick={onCancel}><X size={14} /> Отмена</button>
        ) : (
          <button className="profile-section-edit" onClick={onEdit}><Edit3 size={14} /> Редактировать</button>
        )}
      </div>
      <div className="profile-section-body">{children}</div>
    </div>
  );
}

function Field({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="profile-field">
      <span className="profile-field-label">{icon} {label}</span>
      <span className="profile-field-value">{value}</span>
    </div>
  );
}

function BasicInfoSection({ profile, editing, onEdit, onCancel, onSave }: { profile: CandidateProfile; editing: boolean; onEdit: () => void; onCancel: () => void; onSave: (p: CandidateProfile) => void }) {
  const [form, setForm] = useState(profile);

  useEffect(() => { if (editing) setForm(profile); }, [editing, profile]);

  if (editing) {
    return (
      <SectionWrapper title="Основное" icon={<User size={18} />} editing onEdit={onEdit} onCancel={onCancel}>
        <div className="edit-form-grid">
          <label><span>Имя</span><input className="form-input" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></label>
          <label><span>Фамилия</span><input className="form-input" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></label>
          <label><span>Отчество</span><input className="form-input" value={form.middleName} onChange={(e) => setForm({ ...form, middleName: e.target.value })} /></label>
          <label><span>Дата рождения</span><input className="form-input" type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} /></label>
          <label><span>Город</span><input className="form-input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></label>
          <label><span>Регион</span><input className="form-input" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} /></label>
          <label><span>Email</span><input className="form-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label><span>Телефон</span><input className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
          <label><span>Telegram</span><input className="form-input" value={form.telegram} onChange={(e) => setForm({ ...form, telegram: e.target.value })} /></label>
          <label><span>Профессия</span><input className="form-input" value={form.profession} onChange={(e) => setForm({ ...form, profession: e.target.value })} /></label>
        </div>
        <button className="platform-nav-btn primary" style={{ marginTop: 12 }} onClick={() => onSave(form)}><Check size={16} /> Сохранить</button>
      </SectionWrapper>
    );
  }

  return (
    <SectionWrapper title="Основное" icon={<User size={18} />} editing={false} onEdit={onEdit} onCancel={onCancel}>
      <div className="profile-fields">
        {profile.email && <Field icon={<Mail size={14} />} label="Email" value={profile.email} />}
        {profile.phone && <Field icon={<Phone size={14} />} label="Телефон" value={profile.phone} />}
        {profile.city && <Field icon={<MapPin size={14} />} label="Город" value={profile.city} />}
        {profile.region && <Field icon={<MapPin size={14} />} label="Регион" value={profile.region} />}
        {profile.profession && <Field label="Профессия" value={profile.profession} />}
      </div>
    </SectionWrapper>
  );
}

function EducationSection({ profile, editing, onEdit, onCancel, onSave }: { profile: CandidateProfile; editing: boolean; onEdit: () => void; onCancel: () => void; onSave: (p: CandidateProfile) => void }) {
  const [form, setForm] = useState(profile.education);

  useEffect(() => { if (editing) setForm(profile.education); }, [editing, profile.education]);

  if (editing) {
    return (
      <SectionWrapper title="Образование" icon={<GraduationCap size={18} />} editing onEdit={onEdit} onCancel={onCancel}>
        <div className="edit-form-grid">
          <label><span>Уровень</span><input className="form-input" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} /></label>
          <label><span>Учебное заведение</span><input className="form-input" value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} /></label>
          <label><span>Факультет</span><input className="form-input" value={form.faculty} onChange={(e) => setForm({ ...form, faculty: e.target.value })} /></label>
          <label><span>Специальность</span><input className="form-input" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} /></label>
          <label><span>Курс</span><input className="form-input" value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} /></label>
          <label><span>Форма обучения</span><input className="form-input" value={form.form} onChange={(e) => setForm({ ...form, form: e.target.value })} /></label>
          <label><span>Год окончания</span><input className="form-input" value={form.endYear} onChange={(e) => setForm({ ...form, endYear: e.target.value })} /></label>
        </div>
        <button className="platform-nav-btn primary" style={{ marginTop: 12 }} onClick={() => onSave({ ...profile, education: form })}><Check size={16} /> Сохранить</button>
      </SectionWrapper>
    );
  }

  return (
    <SectionWrapper title="Образование" icon={<GraduationCap size={18} />} editing={false} onEdit={onEdit} onCancel={onCancel}>
      {profile.education.institution ? (
        <div className="profile-fields">
          <Field label="Уровень" value={profile.education.level} />
          <Field label="Учебное заведение" value={profile.education.institution} />
          <Field label="Специальность" value={profile.education.specialty} />
          <Field label="Курс" value={profile.education.course} />
          <Field label="Форма обучения" value={profile.education.form} />
          <Field label="Год окончания" value={profile.education.endYear} />
        </div>
      ) : <p className="profile-empty">Не заполнено</p>}
    </SectionWrapper>
  );
}

function ExperienceSection({ profile, editing, onEdit, onCancel, onSave }: { profile: CandidateProfile; editing: boolean; onEdit: () => void; onCancel: () => void; onSave: (p: CandidateProfile) => void }) {
  const [experiences, setExperiences] = useState<ExperienceItem[]>(profile.experiences);
  const [editingExp, setEditingExp] = useState<ExperienceItem | null>(null);

  useEffect(() => { if (editing) setExperiences(profile.experiences); }, [editing, profile.experiences]);

  const handleAddExp = () => {
    const newExp: ExperienceItem = {
      id: crypto.randomUUID(),
      type: 'work', title: '', organization: '', role: '',
      startDate: '', endDate: '', ongoing: false,
      description: '', result: '', teamSize: '', numbers: '', link: '', skills: [],
    };
    setEditingExp(newExp);
  };

  const handleSaveExp = () => {
    if (!editingExp) return;
    const idx = experiences.findIndex((e) => e.id === editingExp.id);
    if (idx >= 0) {
      const updated = [...experiences];
      updated[idx] = editingExp;
      setExperiences(updated);
    } else {
      setExperiences([...experiences, editingExp]);
    }
    setEditingExp(null);
  };

  const handleDeleteExp = (id: string) => {
    setExperiences(experiences.filter((e) => e.id !== id));
  };

  if (editing) {
    return (
      <SectionWrapper title="Опыт" icon={<Briefcase size={18} />} editing onEdit={onEdit} onCancel={onCancel}>
        {editingExp ? (
          <div className="edit-form" style={{ marginBottom: 16, padding: 16, borderRadius: 12, background: 'var(--glass)', border: '1px solid var(--glass-border)' }}>
            <div className="edit-form-grid">
              <label><span>Тип</span>
                <select className="form-input" value={editingExp.type} onChange={(e) => setEditingExp({ ...editingExp, type: e.target.value })}>
                  {experienceTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </label>
              <label><span>Название</span><input className="form-input" value={editingExp.title} onChange={(e) => setEditingExp({ ...editingExp, title: e.target.value })} /></label>
              <label><span>Организация</span><input className="form-input" value={editingExp.organization} onChange={(e) => setEditingExp({ ...editingExp, organization: e.target.value })} /></label>
              <label><span>Роль</span><input className="form-input" value={editingExp.role} onChange={(e) => setEditingExp({ ...editingExp, role: e.target.value })} /></label>
              <label><span>Дата начала</span><input className="form-input" type="date" value={editingExp.startDate} onChange={(e) => setEditingExp({ ...editingExp, startDate: e.target.value })} /></label>
              <label><span>Дата окончания</span><input className="form-input" type="date" value={editingExp.endDate} disabled={editingExp.ongoing} onChange={(e) => setEditingExp({ ...editingExp, endDate: e.target.value })} /></label>
              <label className="checkbox-label"><input type="checkbox" checked={editingExp.ongoing} onChange={(e) => setEditingExp({ ...editingExp, ongoing: e.target.checked, endDate: e.target.checked ? '' : editingExp.endDate })} /> <span>По настоящее время</span></label>
              <label><span>Ссылка</span><input className="form-input" value={editingExp.link} onChange={(e) => setEditingExp({ ...editingExp, link: e.target.value })} /></label>
            </div>
            <label style={{ display: 'block', marginTop: 8 }}><span>Описание</span><textarea className="form-input" rows={2} value={editingExp.description} onChange={(e) => setEditingExp({ ...editingExp, description: e.target.value })} /></label>
            <label style={{ display: 'block', marginTop: 8 }}><span>Результат</span><textarea className="form-input" rows={2} value={editingExp.result} onChange={(e) => setEditingExp({ ...editingExp, result: e.target.value })} /></label>
            <label style={{ display: 'block', marginTop: 8 }}><span>Навыки (через запятую)</span><input className="form-input" value={editingExp.skills.join(', ')} onChange={(e) => setEditingExp({ ...editingExp, skills: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} /></label>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="platform-nav-btn primary" onClick={handleSaveExp}><Check size={16} /> Сохранить опыт</button>
              <button className="platform-nav-btn ghost" onClick={() => setEditingExp(null)}>Отмена</button>
            </div>
          </div>
        ) : (
          <button className="platform-nav-btn ghost" style={{ marginBottom: 12 }} onClick={handleAddExp}><Plus size={16} /> Добавить опыт</button>
        )}

        {experiences.map((exp) => (
          <div key={exp.id} className="profile-experience-item" style={{ position: 'relative' }}>
            <strong>{exp.title || 'Без названия'}</strong>
            <span>{experienceTypes.find((t) => t.value === exp.type)?.label || exp.type} · {exp.organization}</span>
            {exp.description && <p>{exp.description}</p>}
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <button className="platform-nav-btn ghost" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => setEditingExp(exp)}><Edit3 size={12} /> Изменить</button>
              <button className="platform-nav-btn ghost" style={{ fontSize: 12, padding: '4px 10px', color: '#ef4444' }} onClick={() => handleDeleteExp(exp.id)}><Trash2 size={12} /> Удалить</button>
            </div>
          </div>
        ))}

        <button className="platform-nav-btn primary" style={{ marginTop: 12 }} onClick={() => onSave({ ...profile, experiences })}><Check size={16} /> Сохранить раздел</button>
      </SectionWrapper>
    );
  }

  return (
    <SectionWrapper title="Опыт" icon={<Briefcase size={18} />} editing={false} onEdit={onEdit} onCancel={onCancel}>
      {profile.experiences.length > 0 ? (
        <div className="profile-experiences">
          {profile.experiences.map((exp) => (
            <div className="profile-experience-item" key={exp.id}>
              <strong>{exp.title}</strong>
              <span>{experienceTypes.find((t) => t.value === exp.type)?.label || exp.type} · {exp.organization}</span>
              {exp.description && <p>{exp.description}</p>}
            </div>
          ))}
        </div>
      ) : <p className="profile-empty">Опыта пока нет</p>}
    </SectionWrapper>
  );
}

function SkillsSection({ profile, editing, onEdit, onCancel, onSave }: { profile: CandidateProfile; editing: boolean; onEdit: () => void; onCancel: () => void; onSave: (p: CandidateProfile) => void }) {
  const [skills, setSkills] = useState<SkillItem[]>(profile.skills);
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => { if (editing) setSkills(profile.skills); }, [editing, profile.skills]);

  const addSkill = () => {
    if (!newSkill.trim()) return;
    setSkills([...skills, { name: newSkill.trim(), level: 3, source: 'manual' }]);
    setNewSkill('');
  };

  const removeSkill = (name: string) => setSkills(skills.filter((s) => s.name !== name));

  if (editing) {
    return (
      <SectionWrapper title="Hard Skills" icon={<Star size={18} />} editing onEdit={onEdit} onCancel={onCancel}>
        <div className="profile-tags" style={{ marginBottom: 8 }}>
          {skills.map((s) => <span className="profile-tag" key={s.name} style={{ cursor: 'pointer' }} onClick={() => removeSkill(s.name)}>{s.name} ✕</span>)}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input className="form-input" placeholder="Добавить навык..." value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} />
          <button className="platform-nav-btn ghost" onClick={addSkill}><Plus size={16} /></button>
        </div>
        <button className="platform-nav-btn primary" style={{ marginTop: 12 }} onClick={() => onSave({ ...profile, skills })}><Check size={16} /> Сохранить</button>
      </SectionWrapper>
    );
  }

  return (
    <SectionWrapper title="Hard Skills" icon={<Star size={18} />} editing={false} onEdit={onEdit} onCancel={onCancel}>
      {profile.skills.length > 0 ? (
        <div className="profile-tags">{profile.skills.map((s) => <span className="profile-tag" key={s.name}>{s.name}</span>)}</div>
      ) : <p className="profile-empty">Не заполнено</p>}
    </SectionWrapper>
  );
}

function SoftSkillsSection({ profile, editing, onEdit, onCancel, onSave }: { profile: CandidateProfile; editing: boolean; onEdit: () => void; onCancel: () => void; onSave: (p: CandidateProfile) => void }) {
  const [skills, setSkills] = useState(profile.softSkills);
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => { if (editing) setSkills(profile.softSkills); }, [editing, profile.softSkills]);

  const addSkill = () => {
    if (!newSkill.trim()) return;
    setSkills([...skills, { name: newSkill.trim(), score: 0 }]);
    setNewSkill('');
  };

  const removeSkill = (name: string) => setSkills(skills.filter((s) => s.name !== name));

  if (editing) {
    return (
      <SectionWrapper title="Soft Skills" icon={<Star size={18} />} editing onEdit={onEdit} onCancel={onCancel}>
        <div className="profile-tags" style={{ marginBottom: 8 }}>
          {skills.map((s) => <span className="profile-tag" key={s.name} style={{ cursor: 'pointer' }} onClick={() => removeSkill(s.name)}>{s.name} ✕</span>)}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input className="form-input" placeholder="Добавить навык..." value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} />
          <button className="platform-nav-btn ghost" onClick={addSkill}><Plus size={16} /></button>
        </div>
        <button className="platform-nav-btn primary" style={{ marginTop: 12 }} onClick={() => onSave({ ...profile, softSkills: skills })}><Check size={16} /> Сохранить</button>
      </SectionWrapper>
    );
  }

  return (
    <SectionWrapper title="Soft Skills" icon={<Star size={18} />} editing={false} onEdit={onEdit} onCancel={onCancel}>
      {profile.softSkills.length > 0 ? (
        <div className="profile-tags">{profile.softSkills.map((s) => <span className="profile-tag" key={s.name}>{s.name}</span>)}</div>
      ) : <p className="profile-empty">Не заполнено</p>}
    </SectionWrapper>
  );
}

function LanguagesSection({ profile, editing, onEdit, onCancel, onSave }: { profile: CandidateProfile; editing: boolean; onEdit: () => void; onCancel: () => void; onSave: (p: CandidateProfile) => void }) {
  const [langs, setLangs] = useState<LanguageItem[]>(profile.languages);
  const [newName, setNewName] = useState('');
  const [newLevel, setNewLevel] = useState('');

  useEffect(() => { if (editing) setLangs(profile.languages); }, [editing, profile.languages]);

  const addLang = () => {
    if (!newName.trim()) return;
    setLangs([...langs, { name: newName.trim(), level: newLevel || 'A1' }]);
    setNewName(''); setNewLevel('');
  };

  if (editing) {
    return (
      <SectionWrapper title="Языки" icon={<Globe size={18} />} editing onEdit={onEdit} onCancel={onCancel}>
        <div className="profile-tags" style={{ marginBottom: 8 }}>
          {langs.map((l) => <span className="profile-tag" key={l.name} style={{ cursor: 'pointer' }} onClick={() => setLangs(langs.filter((x) => x.name !== l.name))}>{l.name} · {l.level} ✕</span>)}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input className="form-input" placeholder="Язык" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <select className="form-input" style={{ maxWidth: 100 }} value={newLevel} onChange={(e) => setNewLevel(e.target.value)}>
            <option value="">Уровень</option>
            {['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Родной'].map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <button className="platform-nav-btn ghost" onClick={addLang}><Plus size={16} /></button>
        </div>
        <button className="platform-nav-btn primary" style={{ marginTop: 12 }} onClick={() => onSave({ ...profile, languages: langs })}><Check size={16} /> Сохранить</button>
      </SectionWrapper>
    );
  }

  return (
    <SectionWrapper title="Языки" icon={<Globe size={18} />} editing={false} onEdit={onEdit} onCancel={onCancel}>
      {profile.languages.length > 0 ? (
        <div className="profile-tags">{profile.languages.map((l) => <span className="profile-tag" key={l.name}>{l.name} · {l.level}</span>)}</div>
      ) : <p className="profile-empty">Не заполнено</p>}
    </SectionWrapper>
  );
}

function PreferencesSection({ profile, editing, onEdit, onCancel, onSave }: { profile: CandidateProfile; editing: boolean; onEdit: () => void; onCancel: () => void; onSave: (p: CandidateProfile) => void }) {
  const [form, setForm] = useState(profile.opportunity);
  const [priorities, setPriorities] = useState(profile.priorities);
  const [newPriority, setNewPriority] = useState('');

  useEffect(() => { if (editing) { setForm(profile.opportunity); setPriorities(profile.priorities); } }, [editing, profile]);

  if (editing) {
    return (
      <SectionWrapper title="Карьерные предпочтения" icon={<Target size={18} />} editing onEdit={onEdit} onCancel={onCancel}>
        <div className="edit-form-grid">
          <label><span>Формат</span><input className="form-input" value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })} /></label>
          <label><span>Занятость</span><input className="form-input" value={form.hoursPerWeek} onChange={(e) => setForm({ ...form, hoursPerWeek: e.target.value })} /></label>
          <label><span>Зарплата</span><input className="form-input" type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: Number(e.target.value) })} /></label>
        </div>
        <div style={{ marginTop: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>Типы:</span>
          <div className="profile-tags" style={{ marginTop: 4 }}>
            {form.types.map((t) => <span className="profile-tag" key={t} style={{ cursor: 'pointer' }} onClick={() => setForm({ ...form, types: form.types.filter((x) => x !== t) })}>{t} ✕</span>)}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            <input className="form-input" placeholder="Добавить тип..." onKeyDown={(e) => { if (e.key === 'Enter' && e.currentTarget.value.trim()) { e.preventDefault(); setForm({ ...form, types: [...form.types, e.currentTarget.value.trim()] }); e.currentTarget.value = ''; } }} />
          </div>
        </div>
        <div style={{ marginTop: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>Приоритеты:</span>
          <div className="profile-tags" style={{ marginTop: 4 }}>
            {priorities.map((p) => <span className="profile-tag" key={p} style={{ cursor: 'pointer' }} onClick={() => setPriorities(priorities.filter((x) => x !== p))}>{p} ✕</span>)}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            <input className="form-input" placeholder="Добавить приоритет..." value={newPriority} onChange={(e) => setNewPriority(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (newPriority.trim()) { setPriorities([...priorities, newPriority.trim()]); setNewPriority(''); } } }} />
          </div>
        </div>
        <button className="platform-nav-btn primary" style={{ marginTop: 12 }} onClick={() => onSave({ ...profile, opportunity: form, priorities })}><Check size={16} /> Сохранить</button>
      </SectionWrapper>
    );
  }

  return (
    <SectionWrapper title="Карьерные предпочтения" icon={<Target size={18} />} editing={false} onEdit={onEdit} onCancel={onCancel}>
      <div className="profile-fields">
        <Field label="Формат" value={profile.opportunity.format} />
        <Field label="Занятость" value={profile.opportunity.hoursPerWeek} />
        <Field label="Типы" value={profile.opportunity.types.join(', ')} />
        {profile.priorities.length > 0 && <Field label="Приоритеты" value={profile.priorities.join(', ')} />}
      </div>
    </SectionWrapper>
  );
}

const guardianRelations = ['Мать', 'Отец', 'Опекун', 'Попечитель', 'Другое'];

function GuardianSection({ profile, onUpdated }: { profile: CandidateProfile; onUpdated: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [guardianName, setGuardianName] = useState('');
  const [guardianRelation, setGuardianRelation] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [verification, setVerification] = useState<GuardianVerification | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    (async () => {
      if (!profile.isMinor) return;
      const acc = await accountRepository.getCurrentAccount();
      if (acc) {
        const v = await guardianVerificationRepository.getByCandidate(acc.id);
        setVerification(v);
      }
    })().catch(err => setError(err instanceof Error ? err.message : 'Ошибка загрузки согласия'));
  }, [profile.isMinor]);

  const handleSubmit = async () => {
    setError('');
    if (!guardianName.trim() || !guardianRelation || !guardianEmail.trim()) {
      setError('Заполните ФИО, отношение и email родителя');
      return;
    }
    if (!consent) {
      setError('Необходимо подтвердить согласие');
      return;
    }
    const acc = await accountRepository.getCurrentAccount();
    if (!acc) return;
    const token = crypto.randomUUID();
    await guardianVerificationRepository.create({
      candidateId: acc.id,
      guardianName: guardianName.trim(),
      guardianRelation,
      guardianEmail: guardianEmail.trim(),
      guardianPhone: guardianPhone.trim(),
      status: 'pending',
      verificationToken: token,
      sentAt: new Date().toISOString(),
      verifiedAt: null,
    });
    await candidateRepository.saveProfile({ ...profile, guardianVerificationStatus: 'pending' });
    const v = await guardianVerificationRepository.getByCandidate(acc.id);
    setVerification(v);
    setShowForm(false);
    onUpdated();
  };

  const handleCopyLink = () => {
    if (!verification) return;
    const link = `${window.location.origin}/guardian/verify/${verification.verificationToken}`;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const statusLabel: Record<string, string> = {
    required: 'Требуется подтверждение родителя',
    pending: 'Запрос отправлен — ожидает подтверждения',
    verified: 'Подтверждено родителем',
    rejected: 'Отклонено — можно отправить новый запрос',
  };

  const statusColor: Record<string, string> = {
    required: '#d97706',
    pending: '#d97706',
    verified: '#16a34a',
    rejected: '#ef4444',
  };

  const status = profile.guardianVerificationStatus;
  if (status === 'not_required') return null;

  return (
    <div className="profile-section" style={{ borderColor: 'rgba(245,158,11,0.2)' }}>
      <div className="profile-section-header">
        <span className="profile-section-icon"><ShieldAlert size={18} style={{ color: statusColor[status] }} /></span>
        <h3>Подтверждение родителя</h3>
      </div>
      <div className="profile-section-body">
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '6px 14px', borderRadius: 8, background: `${statusColor[status]}14`, color: statusColor[status], marginBottom: 12 }}>
          {status === 'verified' ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
          {statusLabel[status] || status}
        </div>

        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
          Для публикации резюме и передачи контактов работодателю необходимо подтверждение родителя или законного представителя.
        </p>

        {status === 'required' && !showForm && (
          <button className="platform-nav-btn primary" onClick={() => setShowForm(true)}>
            <Send size={16} /> Отправить запрос
          </button>
        )}

        {status === 'rejected' && !showForm && (
          <button className="platform-nav-btn primary" onClick={() => setShowForm(true)}>
            <Send size={16} /> Отправить новый запрос
          </button>
        )}

        {showForm && (
          <div style={{ padding: 16, borderRadius: 12, background: 'var(--glass)', border: '1px solid var(--glass-border)' }}>
            <div className="edit-form-grid">
              <label style={{ gridColumn: '1 / -1' }}><span>ФИО родителя / законного представителя</span><input className="form-input" value={guardianName} onChange={(e) => setGuardianName(e.target.value)} /></label>
              <label><span>Отношение</span>
                <select className="form-input" value={guardianRelation} onChange={(e) => setGuardianRelation(e.target.value)}>
                  <option value="">Выберите</option>
                  {guardianRelations.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </label>
              <label><span>Email</span><input className="form-input" type="email" value={guardianEmail} onChange={(e) => setGuardianEmail(e.target.value)} /></label>
              <label><span>Телефон</span><input className="form-input" value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} /></label>
            </div>
            <label className="checkbox-label" style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 12, cursor: 'pointer' }}>
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 2 }} />
              <span style={{ fontSize: 13 }}>Я подтверждаю, что указал контакт моего законного представителя</span>
            </label>
            {error && <p style={{ fontSize: 13, color: '#ef4444', marginTop: 4 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="platform-nav-btn primary" onClick={handleSubmit}><Send size={16} /> Отправить запрос</button>
              <button className="platform-nav-btn ghost" onClick={() => setShowForm(false)}>Отмена</button>
            </div>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>DEV-режим: ссылка для подтверждения будет показана здесь, а не отправлена по email.</p>
          </div>
        )}

        {status === 'pending' && verification && (
          <div style={{ padding: 16, borderRadius: 12, background: 'var(--glass)', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: 13, marginBottom: 8 }}>
              <strong>Кому отправлено:</strong> {verification.guardianName} ({verification.guardianRelation})
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
              DEV-режим: ссылка для подтверждения
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <code style={{ fontSize: 12, padding: '8px 12px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--glass-border)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <Link2 size={12} /> {window.location.origin}/guardian/verify/{verification.verificationToken}
              </code>
              <button className="platform-nav-btn ghost" onClick={handleCopyLink}>
                <Copy size={14} /> {linkCopied ? 'Скопировано!' : 'Копировать'}
              </button>
            </div>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>В production ссылка будет отправлена родителю автоматически.</p>
          </div>
        )}
      </div>
    </div>
  );
}

