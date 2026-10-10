import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Check, Megaphone, TrendingUp, Palette, Globe, Bot, Users, MoreHorizontal, ArrowRight, Link as LinkIcon } from 'lucide-react';
import { recordAdvertisingTermsAcceptance, hasAdvertisingTermsAccepted } from '@/services/consentService';
import { useAuth } from '@/services/authContext';
import { useOrgScope } from '@/services/orgScopeContext';
import { repositories } from '@/repositories';
import { projectDraftSourceRepository } from '@/repositories/featureRepositories';
import type { ProjectDraftSource } from '@/repositories/featureRepositories';
import { rublesToKopecks } from '@/services/projectPricingService';
import { quoteTargetAds, TARGET_ADS_PRICING_VERSION } from '@/services/targetAdsPricingService';
import type { BusinessProjectType, BusinessProjectBrief, ServiceCategory } from '@/types/platform';

const serviceCategoryToProjectType: Partial<Record<ServiceCategory, BusinessProjectType>> = {
  marketing: 'marketing',
  targeted_ads: 'marketing',
  context_ads: 'marketing',
  seo: 'marketing',
  content: 'marketing',
  video: 'marketing',
  design: 'design',
  branding: 'design',
  websites: 'website',
  ai_automation: 'ai',
  ai_agents: 'ai',
  hr_brand: 'hr',
};

function projectTypeFromDraftService(source: ProjectDraftSource): BusinessProjectType {
  const category = source.category as ServiceCategory | null | undefined;
  return category ? serviceCategoryToProjectType[category] ?? 'other' : 'other';
}

const typeOptions: { value: BusinessProjectType; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'advertising', label: 'Реклама', icon: <Megaphone size={24} />, desc: 'Размещение рекламы на площадках' },
  { value: 'marketing', label: 'Маркетинг', icon: <TrendingUp size={24} />, desc: 'Стратегия, каналы, продвижение' },
  { value: 'design', label: 'Дизайн', icon: <Palette size={24} />, desc: 'Графика, бренд, UI/UX' },
  { value: 'website', label: 'Сайт', icon: <Globe size={24} />, desc: 'Лендинг, корпоративный сайт' },
  { value: 'ai', label: 'AI / автоматизация', icon: <Bot size={24} />, desc: 'Внедрение AI в процессы' },
  { value: 'hr', label: 'HR / сотрудники', icon: <Users size={24} />, desc: 'Подбор персонала' },
  { value: 'other', label: 'Другое', icon: <MoreHorizontal size={24} />, desc: 'Опишите вашу задачу' },
];

const advertisingTypes = ['ТЦ', 'Наружная', 'Digital screens', 'Транспорт', 'Indoor', 'Лифты', 'СМИ', 'Радио', 'Интернет', 'VK', 'Telegram', 'Блогеры', 'Полиграфия', 'Промо', 'Другое'];
const websiteTypes = ['Лендинг', 'Корпоративный сайт', 'Сервис', 'Другое'];

export function BusinessProjectCreateWizard() {
  const navigate = useNavigate();
  const { account } = useAuth();
  const { activeOrganization, memberships, activeRole, refresh: refreshScope } = useOrgScope();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [type, setType] = useState<BusinessProjectType | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [deadline, setDeadline] = useState('');
  const [budget, setBudget] = useState('');
  const [comment, setComment] = useState('');
  const [extra, setExtra] = useState<Record<string, string>>({});
  const [hrChoice, setHrChoice] = useState<'vacancy' | 'recruitment' | null>(null);
  const [draftSource, setDraftSource] = useState<ProjectDraftSource>({ type: null, sourceId: null, sourceName: null, category: null, providerName: null, format: null, basePrice: null });
  const [adTermsAccepted, setAdTermsAccepted] = useState(false);
  const [advertiserName, setAdvertiserName] = useState('');
  const [advertiserInn, setAdvertiserInn] = useState('');
  const [erid, setErid] = useState('');
  const [ordProvider, setOrdProvider] = useState('');

  useEffect(() => {
    (async () => {
      if (!account) { setLoading(false); return; }
      await refreshScope();
      const source = await projectDraftSourceRepository.get();
      setDraftSource(source);
      if (source.type === 'target_ads') setType('advertising');
      if (source.type === 'advertising') setType('advertising');
      if (source.type === 'media_plan') setType('advertising');
      if (source.type === 'service') {
        setType(projectTypeFromDraftService(source));
        setTitle(source.sourceName || '');
      }
      setLoading(false);
    })().catch(() => setLoading(false));
  }, [account]);

  const handleCreate = async () => {
    if (!account || !type || !activeOrganization) return;
    if (type === 'advertising' && !adTermsAccepted) return;
    setCreating(true);
    try {
    const isPlacement = draftSource.type === 'advertising' || draftSource.type === 'media_plan';
    const providerAmountKopecks = isPlacement || draftSource.type === 'target_ads' ? rublesToKopecks(draftSource.placementSubtotal ?? draftSource.basePrice ?? 0) : 0;
    const brief: BusinessProjectBrief = {
      description,
      city,
      deadline,
      budgetKopecks: rublesToKopecks(budget),
      comment,
      advertiserName,
      advertiserInn,
      erid,
      ordProvider,
      extra,
    };
    if (draftSource.type === 'target_ads') {
      brief.extra = {...extra,sourceType:'target_ads',targetAdsInput:draftSource.category || '{}'};
    } else if (draftSource.type === 'advertising' && draftSource.placements) {
      brief.extra = { ...extra, sourceType: 'media_plan', placements: JSON.stringify(draftSource.placements), providerBreakdown: JSON.stringify(draftSource.providerBreakdown || []) };
    } else if (draftSource.type === 'media_plan' && draftSource.placements) {
      brief.extra = { ...extra, sourceType: 'media_plan', placements: JSON.stringify(draftSource.placements), providerBreakdown: JSON.stringify(draftSource.providerBreakdown || []) };
    } else if (draftSource.type === 'advertising' && draftSource.sourceId) {
      brief.extra = { ...extra, sourceType: 'advertising', sourceId: draftSource.sourceId, providerName: draftSource.providerName || '', format: draftSource.format || '', basePrice: String(draftSource.basePrice || 0) };
    } else if (draftSource.type === 'service') {
      brief.extra = { ...extra, sourceType: 'service', serviceId: draftSource.sourceId || '', serviceName: draftSource.sourceName || '', serviceCategory: draftSource.category || '', format: draftSource.format || '' };
    }
    if (type === 'advertising') {
      const already = await hasAdvertisingTermsAccepted(account.id);
      if (!already) await recordAdvertisingTermsAcceptance(account.id, activeOrganization.id);
    }
    const project = await repositories.businessProject.create({
      organizationId: activeOrganization.id,
      type,
      title: title || typeOptions.find((t) => t.value === type)?.label || 'Проект',
      status: 'draft',
      providerAmountKopecks,
      platformFeeKopecks: draftSource.type === 'target_ads' ? rublesToKopecks(draftSource.platformFee || 0) : 0,
      totalAmountKopecks: draftSource.type === 'target_ads' ? rublesToKopecks(draftSource.totalAmount || 0) : providerAmountKopecks,
      pricingVersion: isPlacement ? 'vk-placement-pilot-2026-10' : null,
      brief,
    });
    await repositories.projectEvent.create({
      projectId: project.id,
      type: 'created',
      actorAccountId: account.id,
      message: 'Проект создан',
    });
    navigate(`/business/projects/${project.id}`);
    await projectDraftSourceRepository.clear();
    } finally { setCreating(false); }
  };

  if (loading) {
    return <div className="dashboard-page"><div className="dashboard-body"><p style={{ color: 'var(--muted)' }}>Загрузка...</p></div></div>;
  }

  if (!activeOrganization && memberships.length === 0) {
    return <div className="dashboard-page"><div className="dashboard-body"><p style={{ color: 'var(--muted)' }}>Сначала добавьте организацию</p><Link to="/business/organizations/new" className="platform-nav-btn primary">Добавить организацию</Link></div></div>;
  }
  if (!activeOrganization) {
    return <div className="dashboard-page"><div className="dashboard-body"><p style={{ color: 'var(--muted)' }}>Выберите организацию в переключателе сверху</p></div></div>;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-body">
        <Link to="/business/projects" className="platform-nav-btn ghost" style={{ marginBottom: 16 }}>
          <ArrowLeft size={16} /> Назад
        </Link>

        <div className="dashboard-header">
          <h1>Новый проект</h1>
          <p>Шаг {step} из 2</p>
        </div>

        {step === 1 && (
          <div>
            {draftSource.sourceName && draftSource.type === 'service' && (
              <div className="platform-card" style={{ padding: 16, marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
                <Check size={20} style={{ color: '#16a34a' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Выбранная услуга: {draftSource.sourceName}</div>
                  {draftSource.category && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Категория: {draftSource.category}{draftSource.format ? ` · ${draftSource.format}` : ''}</div>}
                </div>
              </div>
            )}
            {draftSource.sourceName && (draftSource.type === 'advertising' || draftSource.type === 'media_plan') && (
              <div className="platform-card" style={{ padding: 16, marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
                <Check size={20} style={{ color: '#16a34a' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Выбранное размещение: {draftSource.sourceName}</div>
                  {draftSource.providerName && <div style={{ fontSize: 13, color: 'var(--muted)' }}>Провайдер: {draftSource.providerName}{draftSource.format ? ` · ${draftSource.format}` : ''}{draftSource.basePrice ? ` · ${draftSource.basePrice.toLocaleString('ru-RU')} ₽` : ''}</div>}
                </div>
              </div>
            )}
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Что вам нужно?</h3>
            <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 10, background: 'rgba(0,0,0,0.02)', border: '1px solid var(--line)', fontSize: 13, fontWeight: 600 }}>
              Организация: {activeOrganization.shortName || activeOrganization.fullName}
              {activeRole && <span style={{ color: 'var(--muted)', fontWeight: 400, marginLeft: 8 }}>· {activeRole}</span>}
            </div>
            <div className="project-type-grid">
              {typeOptions.map((t) => (
                <button
                  key={t.value}
                  className={`project-type-card ${type === t.value ? 'selected' : ''}`}
                  onClick={() => {
                    setType(t.value);
                    if (t.value === 'hr') { setHrChoice(null); }
                  }}
                >
                  <div className="project-type-icon">{t.icon}</div>
                  <strong>{t.label}</strong>
                  <span>{t.desc}</span>
                </button>
              ))}
            </div>

            {type === 'hr' && (
              <div style={{ marginTop: 20, padding: 20, borderRadius: 12, background: 'var(--glass)', border: '1px solid var(--glass-border)' }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Что нужно?</h4>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button className={`platform-nav-btn ${hrChoice === 'vacancy' ? 'primary' : 'ghost'}`} onClick={() => setHrChoice('vacancy')}>
                    Создать вакансию
                  </button>
                  <button className={`platform-nav-btn ${hrChoice === 'recruitment' ? 'primary' : 'ghost'}`} onClick={() => setHrChoice('recruitment')}>
                    Нужна помощь с подбором
                  </button>
                </div>
                {hrChoice === 'vacancy' && (
                  <div style={{ marginTop: 12 }}>
                    <Link to="/business/team/vacancies/new" className="platform-nav-btn primary">
                      Перейти к созданию вакансии <ArrowRight size={16} />
                    </Link>
                  </div>
                )}
              </div>
            )}

            {type && (type !== 'hr' || hrChoice === 'recruitment') && (
              <button className="platform-nav-btn primary" style={{ marginTop: 20 }} onClick={() => setStep(2)}>
                Далее <ArrowRight size={16} />
              </button>
            )}
          </div>
        )}

        {step === 2 && type && (
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Опишите задачу</h3>
            <div className="edit-form-grid">
              <label style={{ gridColumn: '1 / -1' }}>
                <span>Название проекта</span>
                <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`Проект: ${typeOptions.find((t) => t.value === type)?.label}`} />
              </label>
              <label style={{ gridColumn: '1 / -1' }}>
                <span>Описание задачи</span>
                <textarea className="form-input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
              </label>
              <label><span>Город</span><input className="form-input" value={city} onChange={(e) => setCity(e.target.value)} /></label>
              <label><span>Желаемый срок</span><input className="form-input" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></label>
              <label><span>Ориентировочный бюджет (₽)</span><input className="form-input" type="number" value={budget} onChange={(e) => setBudget(e.target.value)} /></label>
              <label style={{ gridColumn: '1 / -1' }}>
                <span>Комментарий</span>
                <textarea className="form-input" rows={2} value={comment} onChange={(e) => setComment(e.target.value)} />
              </label>
            </div>

            {type === 'advertising' && (
              <>
              <div className="edit-form-grid" style={{ marginTop: 12 }}>
                <label>
                  <span>Тип рекламы</span>
                  <select className="form-input" value={extra.adType || ''} onChange={(e) => setExtra({ ...extra, adType: e.target.value })}>
                    <option value="">Выберите</option>
                    {advertisingTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                <label>
                  <span>Период</span>
                  <input className="form-input" value={extra.period || ''} onChange={(e) => setExtra({ ...extra, period: e.target.value })} placeholder="Напр: 1 месяц" />
                </label>
                <label style={{ gridColumn: '1 / -1' }}>
                  <span>Целевая аудитория</span>
                  <input className="form-input" value={extra.targetAudience || ''} onChange={(e) => setExtra({ ...extra, targetAudience: e.target.value })} />
                </label>
                <label><span>Рекламодатель (наименование)</span><input className="form-input" value={advertiserName} onChange={(e) => setAdvertiserName(e.target.value)} placeholder="ООО «Ромашка»" /></label>
                <label><span>ИНН рекламодателя</span><input className="form-input" value={advertiserInn} onChange={(e) => setAdvertiserInn(e.target.value.replace(/\D/g, ''))} placeholder="7701234567" /></label>
                <label><span>ERID (маркировка)</span><input className="form-input" value={erid} onChange={(e) => setErid(e.target.value)} placeholder="ERID-XXXX" /></label>
                <label><span>ОРД-провайдер</span><input className="form-input" value={ordProvider} onChange={(e) => setOrdProvider(e.target.value)} placeholder="Яндекс ОРД / VK ОРД" /></label>
              </div>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, marginTop: 16, cursor: 'pointer', padding: '12px 14px', borderRadius: 12, background: 'rgba(0,0,0,0.02)', border: '1px solid var(--line)' }}>
                <input type="checkbox" checked={adTermsAccepted} onChange={(e) => setAdTermsAccepted(e.target.checked)} style={{ marginTop: 2 }} />
                <span>Принимаю <Link to="/legal/advertising" target="_blank" style={{ color: 'var(--blue)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>условия рекламного сервиса <LinkIcon size={11} /></Link> и подтверждаю достоверность данных рекламодателя</span>
              </label>
              </>
            )}

            {type === 'marketing' && (
              <div className="edit-form-grid" style={{ marginTop: 12 }}>
                <label><span>Цель</span><input className="form-input" value={extra.goal || ''} onChange={(e) => setExtra({ ...extra, goal: e.target.value })} /></label>
                <label><span>Каналы</span><input className="form-input" value={extra.channels || ''} onChange={(e) => setExtra({ ...extra, channels: e.target.value })} /></label>
              </div>
            )}

            {type === 'design' && (
              <div className="edit-form-grid" style={{ marginTop: 12 }}>
                <label style={{ gridColumn: '1 / -1' }}><span>Что нужно</span><input className="form-input" value={extra.designTask || ''} onChange={(e) => setExtra({ ...extra, designTask: e.target.value })} placeholder="Логотип, брендбук, UI/UX..." /></label>
              </div>
            )}

            {type === 'website' && (
              <div className="edit-form-grid" style={{ marginTop: 12 }}>
                <label>
                  <span>Тип сайта</span>
                  <select className="form-input" value={extra.siteType || ''} onChange={(e) => setExtra({ ...extra, siteType: e.target.value })}>
                    <option value="">Выберите</option>
                    {websiteTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
              </div>
            )}

            {type === 'ai' && (
              <div className="edit-form-grid" style={{ marginTop: 12 }}>
                <label style={{ gridColumn: '1 / -1' }}><span>Задача / процесс для автоматизации</span><textarea className="form-input" rows={2} value={extra.aiTask || ''} onChange={(e) => setExtra({ ...extra, aiTask: e.target.value })} /></label>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button className="platform-nav-btn ghost" onClick={() => setStep(1)}>Назад</button>
              <button className="platform-nav-btn primary" onClick={handleCreate} disabled={creating || (type === 'advertising' && !adTermsAccepted)}>
                <Check size={16} /> {creating ? 'Создание...' : 'Создать проект'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
