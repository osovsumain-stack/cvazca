import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Plus, X, Briefcase, Link as LinkIcon, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { recordVacancyRulesAcceptance, hasVacancyRulesAccepted } from '@/services/consentService';
import { useAuth } from '@/services/authContext';
import { canManageVacancies } from '@/services/permissions';
import {
  vacancyRepository,
  vacancyEventRepository,
  organizationMembershipRepository,
  organizationRepository,
} from '@/repositories/mockRepositories';
import type {
  VacancyPosting,
  EmploymentType,
  WorkFormat,
  Schedule,
  ExperienceLevel,
  SalaryCurrency,
  OrganizationMembership,
} from '@/types/platform';

import { vacancyDraftRepository } from '@/repositories/vacancyDraftRepository';

const TOTAL_STEPS = 8;

interface VacancyForm {
  title: string;
  city: string;
  workFormat: WorkFormat;
  employmentType: EmploymentType;
  schedule: Schedule;
  salaryFrom: string;
  salaryTo: string;
  salaryCurrency: SalaryCurrency;
  salaryGross: boolean;
  description: string;
  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];
  skills: string[];
  experienceLevel: ExperienceLevel;
  suitableForMinors: boolean;
  minimumAge: string;
  contactPerson: string;
  contactEmail: string;
}

const defaultForm: VacancyForm = {
  title: '', city: '', workFormat: 'Офис', employmentType: 'Полная', schedule: 'Полный день',
  salaryFrom: '', salaryTo: '', salaryCurrency: 'RUB', salaryGross: false,
  description: '', responsibilities: [], requirements: [], niceToHave: [],
  skills: [], experienceLevel: 'none',
  suitableForMinors: false, minimumAge: '',
  contactPerson: '', contactEmail: '',
};

export function VacancyCreateWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const { account } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<VacancyForm>(defaultForm);
  const [memberships, setMemberships] = useState<OrganizationMembership[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [saving, setSaving] = useState(false);
  const [vacancyRulesAccepted, setVacancyRulesAccepted] = useState(false);
  const [showRulesStep, setShowRulesStep] = useState(false);
  const [editingVacancy, setEditingVacancy] = useState<VacancyPosting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orgNames, setOrgNames] = useState<Record<string,string>>({});

  useEffect(() => {
    (async () => {
      if (!account) return;
      const ms = await organizationMembershipRepository.getByAccount(account.id);
      setMemberships(ms);
      const manageable = ms.filter((m) => canManageVacancies(m.role));
      const orgs = await Promise.all(manageable.map(m => organizationRepository.getById(m.organizationId)));
      setOrgNames(Object.fromEntries(orgs.filter(Boolean).map(o => [o!.id,o!.shortName || o!.name])));
      if (editId) {
        const vacancy = await vacancyRepository.getById(editId);
        if (!vacancy || !manageable.some(m => m.organizationId === vacancy.organizationId)) throw new Error('Нет доступа к редактированию вакансии');
        setEditingVacancy(vacancy); setSelectedOrgId(vacancy.organizationId);
        setForm({...defaultForm,...vacancy,salaryFrom:vacancy.salaryFrom?.toString()||'',salaryTo:vacancy.salaryTo?.toString()||'',minimumAge:vacancy.minimumAge?.toString()||''});
        return;
      }
      if (manageable.length > 0) {
        const firstOrg = manageable[0].organizationId;
        setSelectedOrgId(firstOrg);
        // Restore draft
        const draft = vacancyDraftRepository.load(account.id, firstOrg);
        if (draft) {
          setForm({ ...defaultForm, ...(draft.form as Partial<VacancyForm>) });
          setStep(draft.step ?? 1);
        }
      }
    })().catch(e => setError(e instanceof Error ? e.message : 'Не удалось открыть вакансию')).finally(() => setLoading(false));
  }, [account, editId]);

  // Save draft on every change
  useEffect(() => {
    if (!account || !selectedOrgId || editId) return;
    vacancyDraftRepository.save(account.id, selectedOrgId, { step, form: form as unknown as Record<string, unknown>, selectedOrganizationId: selectedOrgId });
  }, [form, step, account, selectedOrgId, editId]);

  const currentMembership = memberships.find((m) => m.organizationId === selectedOrgId);
  const canManage = canManageVacancies(currentMembership?.role);

  if (loading) return <div className="dashboard-body">Загрузка формы вакансии…</div>;
  if (!canManage) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-body">
          <p style={{ color: 'var(--muted)' }}>{error || 'У вас нет прав для создания вакансий.'}</p>
        </div>
      </div>
    );
  }

  const update = <K extends keyof VacancyForm>(key: K, value: VacancyForm[K]) => setForm((f) => ({ ...f, [key]: value }));

  const buildVacancy = (status: VacancyPosting['status']): Omit<VacancyPosting, 'id' | 'createdAt' | 'updatedAt'> => ({
    organizationId: selectedOrgId,
    title: form.title,
    description: form.description,
    responsibilities: form.responsibilities,
    requirements: form.requirements,
    niceToHave: form.niceToHave,
    employmentType: form.employmentType,
    schedule: form.schedule,
    workFormat: form.workFormat,
    location: form.city,
    city: form.city,
    salaryFrom: form.salaryFrom ? parseInt(form.salaryFrom) : null,
    salaryTo: form.salaryTo ? parseInt(form.salaryTo) : null,
    salaryCurrency: form.salaryCurrency,
    salaryGross: form.salaryGross,
    experienceLevel: form.experienceLevel,
    skills: form.skills,
    suitableForMinors: form.suitableForMinors,
    minimumAge: form.suitableForMinors && form.minimumAge ? parseInt(form.minimumAge) : null,
    contactPerson: form.contactPerson,
    contactEmail: form.contactEmail,
    status,
    moderationComment: '',
    moderatedBy: null,
    moderatedAt: null,
    publishedAt: null,
    closedAt: null,
    createdBy: account?.id || '',
  });

  const saveVacancy = async () => {
    if (editingVacancy) {
      const changed = {...editingVacancy,...buildVacancy('draft')};
      await vacancyRepository.update(changed);
      return changed;
    }
    const created = await vacancyRepository.create(buildVacancy('draft'));
    setEditingVacancy(created);
    return created;
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const v = await saveVacancy();
      await vacancyEventRepository.create({ vacancyId: v.id, type: 'created', actorAccountId: account?.id || '', message: 'Вакансия создана как черновик' });
      if (account) vacancyDraftRepository.clear(account.id, selectedOrgId);
      navigate('/business/team');
    } catch(e) { setError(e instanceof Error ? e.message : 'Не удалось сохранить вакансию'); } finally { setSaving(false); }
  };

  const handleSubmitModeration = async () => {
    if (!account || !selectedOrgId) return;
    if (!vacancyRulesAccepted) {
      setShowRulesStep(true);
      return;
    }
    setSaving(true);
    try {
      const already = await hasVacancyRulesAccepted(account.id);
      if (!already) await recordVacancyRulesAcceptance(account.id, selectedOrgId);
      const v = await saveVacancy();
      await vacancyRepository.submitForModeration(v.id);
      await vacancyEventRepository.create({ vacancyId: v.id, type: 'created', actorAccountId: account?.id || '', message: 'Вакансия создана и отправлена на модерацию' });
      await vacancyEventRepository.create({ vacancyId: v.id, type: 'submitted_for_moderation', actorAccountId: account?.id || '', message: 'Отправлена на модерацию' });
      if (account) vacancyDraftRepository.clear(account.id, selectedOrgId);
      navigate('/business/team');
    } catch(e) { setError(e instanceof Error ? e.message : 'Не удалось отправить вакансию'); } finally { setSaving(false); }
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 1: return !!form.title && !!form.city;
      case 2: return true;
      case 3: return !!form.description;
      case 4: return true;
      case 5: return true;
      case 6: return true;
      case 7: return !!form.contactEmail;
      case 8: return true;
      default: return true;
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-body" style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div className="platform-path-icon business" style={{ width: 44, height: 44 }}><Briefcase size={20} /></div>
          <div>
            <h1>{editId ? 'Редактировать вакансию' : 'Новая вакансия'}</h1>
            <p>Шаг {step} из {TOTAL_STEPS}</p>
          </div>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        {!editId && <label className="stack-form">Организация<select className="form-input" value={selectedOrgId} onChange={e => {
          const organizationId = e.target.value, draft = account ? vacancyDraftRepository.load(account.id,organizationId) : null;
          setSelectedOrgId(organizationId); setEditingVacancy(null); setForm({...defaultForm,...(draft?.form as Partial<VacancyForm> || {})}); setStep(draft?.step || 1);
        }}>{memberships.filter(m => canManageVacancies(m.role)).map(m => <option key={m.id} value={m.organizationId}>{orgNames[m.organizationId] || 'Организация'}</option>)}</select></label>}
        {editId && <p className="field-hint">Изменения сохраняются как черновик и требуют повторной модерации перед публикацией.</p>}

        <div className="wizard-progress">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div key={i} className={`wizard-dot ${i + 1 <= step ? 'active' : ''}`} />
          ))}
        </div>

        <div className="wizard-step">
            {step === 1 && (
              <>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Основное</h3>
                <FormField label="Название вакансии"><input className="form-input" value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="Junior frontend-разработчик" /></FormField>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <FormField label="Город"><input className="form-input" value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="Москва" /></FormField>
                  <FormField label="Формат работы">
                    <select className="form-input" value={form.workFormat} onChange={(e) => update('workFormat', e.target.value as WorkFormat)}>
                      <option value="Офис">Офис</option><option value="Гибрид">Гибрид</option><option value="Удалённо">Удалённо</option>
                    </select>
                  </FormField>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <FormField label="Тип занятости">
                    <select className="form-input" value={form.employmentType} onChange={(e) => update('employmentType', e.target.value as EmploymentType)}>
                      <option value="Полная">Полная</option><option value="Частичная">Частичная</option><option value="Стажировка">Стажировка</option><option value="Проектная">Проектная</option>
                    </select>
                  </FormField>
                  <FormField label="График">
                    <select className="form-input" value={form.schedule} onChange={(e) => update('schedule', e.target.value as Schedule)}>
                      <option value="Полный день">Полный день</option><option value="Сменный">Сменный</option><option value="Гибкий">Гибкий</option><option value="Удалённая работа">Удалённая работа</option>
                    </select>
                  </FormField>
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Зарплата</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <FormField label="Зарплата от"><input className="form-input" type="number" value={form.salaryFrom} onChange={(e) => update('salaryFrom', e.target.value)} placeholder="45000" /></FormField>
                  <FormField label="Зарплата до"><input className="form-input" type="number" value={form.salaryTo} onChange={(e) => update('salaryTo', e.target.value)} placeholder="60000" /></FormField>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <FormField label="Валюта">
                    <select className="form-input" value={form.salaryCurrency} onChange={(e) => update('salaryCurrency', e.target.value as SalaryCurrency)}>
                      <option value="RUB">₽ RUB</option><option value="USD">$ USD</option><option value="EUR">€ EUR</option>
                    </select>
                  </FormField>
                  <FormField label="До/после налогов">
                    <select className="form-input" value={form.salaryGross ? 'gross' : 'net'} onChange={(e) => update('salaryGross', e.target.value === 'gross')}>
                      <option value="net">После налогов (net)</option><option value="gross">До налогов (gross)</option>
                    </select>
                  </FormField>
                </div>
              </>
            )}
            {step === 3 && (
              <>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Описание</h3>
                <FormField label="Описание вакансии"><textarea className="form-input" rows={4} value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Расскажите о вакансии и вашей команде" /></FormField>
                <TagInput label="Обязанности" values={form.responsibilities} onChange={(v) => update('responsibilities', v)} placeholder="Разработка UI, работа с API" />
                <TagInput label="Требования" values={form.requirements} onChange={(v) => update('requirements', v)} placeholder="React, TypeScript, CSS" />
                <TagInput label="Будет плюсом" values={form.niceToHave} onChange={(v) => update('niceToHave', v)} placeholder="Next.js, GraphQL" />
              </>
            )}
            {step === 4 && (
              <>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Навыки</h3>
                <TagInput label="Hard skills" values={form.skills} onChange={(v) => update('skills', v)} placeholder="JavaScript, React, SQL" />
              </>
            )}
            {step === 5 && (
              <>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Опыт</h3>
                <FormField label="Уровень опыта">
                  <select className="form-input" value={form.experienceLevel} onChange={(e) => update('experienceLevel', e.target.value as ExperienceLevel)}>
                    <option value="none">Без опыта</option><option value="0-1">0–1 год</option><option value="1-3">1–3 года</option><option value="3-6">3–6 лет</option><option value="6+">6+ лет</option>
                  </select>
                </FormField>
              </>
            )}
            {step === 6 && (
              <>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Возраст / несовершеннолетние</h3>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, marginBottom: 12 }}>
                  <input type="checkbox" checked={form.suitableForMinors} onChange={(e) => update('suitableForMinors', e.target.checked)} />
                  Подходит для кандидатов младше 18 лет
                </label>
                {form.suitableForMinors && (
                  <>
                    <FormField label="Минимальный возраст">
                      <select className="form-input" value={form.minimumAge} onChange={(e) => update('minimumAge', e.target.value)}>
                        <option value="">Выберите</option><option value="14">14+</option><option value="16">16+</option><option value="18">18+</option>
                      </select>
                    </FormField>
                    <div style={{ fontSize: 12, color: 'var(--muted)', padding: '8px 12px', background: 'rgba(245,158,11,0.06)', borderRadius: 8, border: '1px solid rgba(245,158,11,0.15)' }}>
                      Для трудоустройства несовершеннолетних действуют специальные требования законодательства и внутренней проверки вакансии.
                    </div>
                  </>
                )}
              </>
            )}
            {step === 7 && (
              <>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Контакт</h3>
                <FormField label="Ответственный HR"><input className="form-input" value={form.contactPerson} onChange={(e) => update('contactPerson', e.target.value)} placeholder="Иванова Анна" /></FormField>
                <FormField label="Email для связи"><input className="form-input" type="email" value={form.contactEmail} onChange={(e) => update('contactEmail', e.target.value)} placeholder="hr@company.ru" /></FormField>
              </>
            )}
            {step === 8 && (
              <>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Предпросмотр</h3>
                <div className="vacancy-card">
                  <div className="vacancy-card-header"><h3>{form.title || 'Без названия'}</h3></div>
                  <div className="vacancy-card-meta">
                    <span>{form.city}</span><span>{form.workFormat}</span><span>{form.employmentType}</span>
                    {form.salaryFrom && <span>от {form.salaryFrom} {form.salaryCurrency}</span>}
                  </div>
                  <p className="vacancy-card-desc">{form.description}</p>
                  {form.requirements.length > 0 && <div className="vacancy-card-skills">{form.requirements.map((s) => <span className="profile-tag" key={s}>{s}</span>)}</div>}
                  {form.suitableForMinors && <span className="vacancy-status-badge" style={{ color: '#16a34a', background: 'rgba(22,163,74,0.08)' }}>Доступно с {form.minimumAge || 14}+ лет</span>}
                </div>
              </>
            )}
          </div>

        <div className="wizard-nav">
          {step > 1 && <button className="platform-nav-btn ghost" onClick={() => setStep((s) => Math.max(1, s - 1))}><ArrowLeft size={18} /> Назад</button>}
          {step < TOTAL_STEPS ? (
            <button className="platform-nav-btn primary" onClick={() => setStep((s) => Math.min(TOTAL_STEPS, s + 1))} disabled={!canProceed()}>
              Продолжить <ArrowRight size={18} />
            </button>
          ) : (
            <>
              <button className="platform-nav-btn ghost" onClick={handleSaveDraft} disabled={saving}>Сохранить черновик</button>
              <button className="platform-nav-btn primary" onClick={handleSubmitModeration} disabled={saving}>
                <Check size={18} /> Отправить на модерацию
              </button>
            </>
          )}
        </div>

        {showRulesStep && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
            <div style={{ background: 'var(--card)', borderRadius: 16, padding: 24, maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Правила размещения вакансий</h3>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 16 }}>
                <p style={{ marginBottom: 8 }}>Перед отправкой вакансии на модерацию ознакомьтесь с правилами:</p>
                <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <li>Запрещена дискриминация по полу, возрасту, национальности, семейному положению, религии, месту жительства</li>
                  <li>Вакансии проверяются вручную перед публикацией</li>
                  <li>Система может отметить потенциально проблемные формулировки для ручной проверки</li>
                  <li>Несоблюдение правил может привести к отклонению вакансии</li>
                </ul>
                <Link to="/legal/vacancies" target="_blank" style={{ color: 'var(--blue)', display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 13, marginTop: 8 }}>
                  Открыть полный текст правил <LinkIcon size={11} />
                </Link>
              </div>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, cursor: 'pointer', padding: '12px 14px', borderRadius: 12, background: 'rgba(0,0,0,0.02)', border: '1px solid var(--line)', marginBottom: 16 }}>
                <input type="checkbox" checked={vacancyRulesAccepted} onChange={(e) => setVacancyRulesAccepted(e.target.checked)} style={{ marginTop: 2 }} />
                <span>Я ознакомился с правилами размещения вакансий и принимаю их</span>
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="platform-nav-btn ghost" onClick={() => setShowRulesStep(false)}>Отмена</button>
                <button className="platform-nav-btn primary" onClick={handleSubmitModeration} disabled={!vacancyRulesAccepted || saving}>
                  {saving ? 'Отправка...' : 'Принять и отправить'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--ink)' }}>{label}</label>
      {children}
    </div>
  );
}

function TagInput({ label, values, onChange, placeholder }: { label: string; values: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setInput('');
  };
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{label}</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <input className="form-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder={placeholder} onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
        <button className="platform-nav-btn ghost" onClick={add}><Plus size={16} /></button>
      </div>
      {values.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {values.map((v) => (
            <span key={v} className="profile-tag" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {v}
              <button onClick={() => onChange(values.filter((x) => x !== v))} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
