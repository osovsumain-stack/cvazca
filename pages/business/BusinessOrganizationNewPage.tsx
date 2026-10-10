import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Search, ArrowLeft, ArrowRight, Check, AlertTriangle, Loader2, X, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { recordBusinessTermsAcceptance, hasBusinessTermsAccepted } from '@/services/consentService';
import { TextInput, FormField } from '@/ui';
import { useAuth } from '@/services/authContext';
import { organizationRepository, organizationMembershipRepository, accountRepository } from '@/repositories/mockRepositories';
import { lookupOrganizationByInn, lookupBankByBik } from '@/services/organizationLookup';
import { projectDraftSourceRepository } from '@/repositories/featureRepositories';
import type { OrganizationType, OrganizationLookupResult } from '@/types/platform';

const TOTAL_STEPS = 8;

import { businessOnboardingDraftRepository } from '@/repositories/businessOnboardingDraftRepository';

interface WizardForm {
  entityType: OrganizationType;
  inn: string;
  kpp: string;
  ogrn: string;
  ogrnip: string;
  fullName: string;
  shortName: string;
  legalAddress: string;
  actualAddress: string;
  addressSame: boolean;
  signatoryFullName: string;
  signatoryPosition: string;
  authorityType: string;
  powerOfAttorneyNumber: string;
  powerOfAttorneyDate: string;
  powerOfAttorneyExpiry: string;
  bankName: string;
  bik: string;
  checkingAccount: string;
  correspondentAccount: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  accountingEmail: string;
  accountingPhone: string;
  industry: string;
  website: string;
  city: string;
  orgSize: string;
  needs: string[];
  dataSource: string;
  dataVerifiedAt: string;
}

const defaultForm: WizardForm = {
  entityType: 'OOO',
  inn: '', kpp: '', ogrn: '', ogrnip: '', fullName: '', shortName: '',
  legalAddress: '', actualAddress: '', addressSame: true,
  signatoryFullName: '', signatoryPosition: '', authorityType: 'Устав',
  powerOfAttorneyNumber: '', powerOfAttorneyDate: '', powerOfAttorneyExpiry: '',
  bankName: '', bik: '', checkingAccount: '', correspondentAccount: '',
  contactPerson: '', contactPhone: '', contactEmail: '',
  accountingEmail: '', accountingPhone: '',
  industry: '', website: '', city: '', orgSize: '',
  needs: [],
  dataSource: '', dataVerifiedAt: '',
};

export function BusinessOrganizationNewPage() {
  const navigate = useNavigate();
  const { account } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<WizardForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businessTermsAccepted, setBusinessTermsAccepted] = useState(false);

  // Restore from draft repository on mount
  useEffect(() => {
    if (!account) return;
    const saved = businessOnboardingDraftRepository.load(account.id);
    if (saved) {
      setForm({ ...defaultForm, ...(saved.form as Partial<WizardForm>) });
      setStep(saved.step ?? 1);
    }
  }, [account]);

  // Save to draft repository on every change
  useEffect(() => {
    if (!account) return;
    businessOnboardingDraftRepository.save(account.id, { step, form: form as unknown as Record<string, unknown> });
  }, [form, step, account]);

  const update = (key: keyof WizardForm, value: string | boolean | string[]) => setForm((f) => ({ ...f, [key]: value }) as WizardForm);

  const handleSubmit = async () => {
    if (!account) {
      navigate('/auth', { state: { from: '/business' } });
      return;
    }
    if (!form.inn || !form.fullName) {
      setError('Заполните ИНН и полное наименование');
      return;
    }
    if (!businessTermsAccepted) {
      setError('Необходимо принять условия бизнес-сервиса');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (account) {
        const already = await hasBusinessTermsAccepted(account.id);
        if (!already) await recordBusinessTermsAcceptance(account.id);
      }
      const org = await organizationRepository.create({
        name: form.shortName || form.fullName,
        type: form.entityType,
        inn: form.inn,
        kpp: form.kpp,
        ogrn: form.ogrn,
        ogrnip: form.ogrnip,
        fullName: form.fullName,
        shortName: form.shortName,
        legalAddress: form.legalAddress,
        actualAddress: form.addressSame ? form.legalAddress : form.actualAddress,
        signatoryFullName: form.signatoryFullName,
        signatoryPosition: form.signatoryPosition,
        authorityType: form.authorityType,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        accountingEmail: form.accountingEmail,
        website: form.website,
        description: '',
        logo: '',
        industry: form.industry,
        dataSource: (form.dataSource as 'dadata' | 'manual' | 'mixed') || 'manual',
        dataVerifiedAt: form.dataVerifiedAt || null,
        bankDetails: {
          bankName: form.bankName,
          bik: form.bik,
          accountNumber: form.checkingAccount,
          correspondentAccount: form.correspondentAccount,
        },
      });
      await organizationMembershipRepository.create({
        organizationId: org.id,
        accountId: account.id,
        role: 'owner',
        status: 'active',
      });
      await accountRepository.assignRole(account.id, 'business_member');
      window.dispatchEvent(new Event('svyazka:organizations-changed'));
      businessOnboardingDraftRepository.clear(account.id);
      const pendingProjectSource = await projectDraftSourceRepository.get();
      navigate(
        pendingProjectSource.type
          ? '/business/projects/new'
          : '/business/dashboard',
        { replace: true },
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при создании организации');
    } finally {
      setSaving(false);
    }
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 1: return !!form.inn && !!form.fullName;
      case 2: return !!form.inn && !!form.fullName;
      case 3: return !!form.legalAddress;
      case 4: return !!form.signatoryFullName;
      case 5: return true; // bank optional
      case 6: return !!form.contactEmail || !!form.contactPhone;
      case 7: return true;
      case 8: return businessTermsAccepted;
      default: return true;
    }
  };

  return (
    <div className="simple-page">
      <div className="bg-blobs" />
      <div className="simple-card css-fade-up" style={{ maxWidth: 680 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div className="platform-path-icon business" style={{ width: 44, height: 44 }}><Building2 size={20} /></div>
          <div>
            <h1>Новая организация</h1>
            <p>Шаг {step} из {TOTAL_STEPS}</p>
          </div>
        </div>

        <div className="wizard-progress">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div key={i} className={`wizard-dot ${i + 1 <= step ? 'active' : ''}`} />
          ))}
        </div>

        {error && (
          <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', fontSize: 13, color: '#ef4444', marginBottom: 16 }}>
            {error}
          </div>
        )}

        <StepContent
          step={step}
          form={form}
          update={update}
          setStep={setStep}
          setForm={setForm}
          setError={setError}
          businessTermsAccepted={businessTermsAccepted}
          setBusinessTermsAccepted={setBusinessTermsAccepted}
        />

        <div className="wizard-nav">
          {step > 1 && (
            <button className="big-button ghost" onClick={() => setStep((s) => Math.max(1, s - 1))}>
              <ArrowLeft size={18} /> Назад
            </button>
          )}
          {step < TOTAL_STEPS ? (
            <button
              className="big-button primary"
              onClick={() => setStep((s) => Math.min(TOTAL_STEPS, s + 1))}
              disabled={!canProceed()}
            >
              Продолжить <ArrowRight size={18} />
            </button>
          ) : (
            <button className="big-button primary" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Создание...' : 'Создать организацию'}
            </button>
          )}
          <button className="big-button ghost" onClick={() => navigate('/business')}>
            Сохранить и выйти
          </button>
        </div>
      </div>
    </div>
  );
}

function StepContent({ step, form, update, setStep, setForm, setError, businessTermsAccepted, setBusinessTermsAccepted }: {
  step: number;
  form: WizardForm;
  update: (key: keyof WizardForm, value: string | boolean | string[]) => void;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  setForm: React.Dispatch<React.SetStateAction<WizardForm>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  businessTermsAccepted: boolean;
  setBusinessTermsAccepted: (v: boolean) => void;
}) {
  if (step === 1) return <Step1Lookup form={form} update={update} setStep={setStep} setForm={setForm} setError={setError} />;
  if (step === 2) return <Step2Requisites form={form} update={update} />;
  if (step === 3) return <Step3Address form={form} update={update} />;
  if (step === 4) return <Step4Signatory form={form} update={update} />;
  if (step === 5) return <Step5Bank form={form} update={update} />;
  if (step === 6) return <Step6Contacts form={form} update={update} />;
  if (step === 7) return <Step7About form={form} update={update} />;
  if (step === 8) return <Step8Needs form={form} update={update} businessTermsAccepted={businessTermsAccepted} setBusinessTermsAccepted={setBusinessTermsAccepted} />;
  return null;
}

// ─── Step 1: INN Lookup ───
function Step1Lookup({ form, update, setStep, setForm, setError }: {
  form: WizardForm;
  update: (key: keyof WizardForm, value: string | boolean | string[]) => void;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  setForm: React.Dispatch<React.SetStateAction<WizardForm>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const [inn, setInn] = useState(form.inn);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OrganizationLookupResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [statusWarning, setStatusWarning] = useState(false);

  const handleSearch = async () => {
    const cleanInn = inn.replace(/\D/g, '');
    if (!cleanInn || cleanInn.length < 10) {
      setError('ИНН должен содержать не менее 10 цифр');
      return;
    }
    setError(null);
    setLoading(true);
    setNotFound(false);
    setResult(null);
    setConfirmed(false);
    try {
      const res = await lookupOrganizationByInn(cleanInn);
      setResult(res);
      const status = res.organizationStatus;
      if (status === 'LIQUIDATED' || status === 'BANKRUPT' || status === 'LIQUIDATING' || status === 'REORGANIZING') {
        setStatusWarning(true);
      } else {
        setStatusWarning(false);
      }
    } catch (err) {
      setNotFound(true);
      setError(err instanceof Error ? err.message : 'Не удалось получить данные');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!result) return;
    update('entityType', result.entityType === 'INDIVIDUAL' ? 'IP' : 'OOO');
    update('inn', result.inn);
    update('kpp', result.kpp);
    update('ogrn', result.ogrn);
    update('ogrnip', result.ogrnip);
    update('fullName', result.fullName);
    update('shortName', result.shortName);
    update('legalAddress', result.legalAddress);
    update('signatoryFullName', result.signatoryFullName);
    update('signatoryPosition', result.signatoryPosition);
    update('dataSource', 'dadata');
    update('dataVerifiedAt', new Date().toISOString());
    setConfirmed(true);
    setStep(2);
  };

  const handleManual = () => {
    update('inn', inn.replace(/\D/g, ''));
    setStep(2);
  };

  return (
    <div className="wizard-step">
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Найдём вашу организацию</h3>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>Введите ИНН — мы автоматически заполним реквизиты из ЕГРЮЛ/ЕГРИП</p>

      <FormField label="ИНН организации">
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="form-input"
            value={inn}
            onChange={(e) => setInn(e.target.value.replace(/\D/g, ''))}
            placeholder="7701234567"
            onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }}
            style={{ flex: 1 }}
          />
          <button
            className="big-button primary"
            onClick={handleSearch}
            disabled={loading || inn.length < 10}
            style={{ whiteSpace: 'nowrap', padding: '0 20px' }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            {loading ? '' : 'Найти'}
          </button>
        </div>
      </FormField>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 24, justifyContent: 'center' }}>
          <Loader2 size={24} className="animate-spin" color="var(--blue)" />
          <span style={{ fontSize: 14, color: 'var(--muted)' }}>Поиск организации...</span>
        </div>
      )}

      {result && !loading && (
        <div className="lookup-result">
          {statusWarning && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 13, color: '#d97706', marginBottom: 12 }}>
              <AlertTriangle size={16} />
              Внимание: статус организации — {result.organizationStatus}. Убедитесь, что организация действующая.
            </div>
          )}
          <div className="lookup-result-card">
            <div className="lookup-result-row"><span>Название</span><strong>{result.fullName}</strong></div>
            <div className="lookup-result-row"><span>ИНН</span><strong>{result.inn}</strong></div>
            {result.kpp && <div className="lookup-result-row"><span>КПП</span><strong>{result.kpp}</strong></div>}
            {result.ogrn && <div className="lookup-result-row"><span>ОГРН</span><strong>{result.ogrn}</strong></div>}
            {result.legalAddress && <div className="lookup-result-row"><span>Адрес</span><strong>{result.legalAddress}</strong></div>}
            {result.signatoryFullName && <div className="lookup-result-row"><span>Руководитель</span><strong>{result.signatoryFullName}</strong></div>}
            {result.signatoryPosition && <div className="lookup-result-row"><span>Должность</span><strong>{result.signatoryPosition}</strong></div>}
            {result.organizationStatus && <div className="lookup-result-row"><span>Статус</span><strong>{result.organizationStatus}</strong></div>}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="big-button primary" onClick={handleConfirm}>
              <Check size={18} /> Это моя организация
            </button>
            <button className="big-button ghost" onClick={() => { setResult(null); setInn(''); }}>
              Искать другую
            </button>
          </div>
        </div>
      )}

      {notFound && !loading && (
        <div className="lookup-fallback">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 12, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', fontSize: 13, color: '#d97706', marginBottom: 12 }}>
            <AlertTriangle size={16} />
            Не удалось получить данные автоматически. Вы можете заполнить реквизиты вручную.
          </div>
          <button className="big-button ghost" onClick={handleManual}>
            Заполнить вручную
          </button>
        </div>
      )}

      {!result && !notFound && !loading && (
        <button className="big-button ghost" onClick={handleManual} style={{ marginTop: 12 }}>
          Заполнить вручную
        </button>
      )}
    </div>
  );
}

// ─── Step 2: Requisites ───
function Step2Requisites({ form, update }: { form: WizardForm; update: (k: keyof WizardForm, v: string | boolean | string[]) => void }) {
  return (
    <div className="wizard-step">
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Основные реквизиты</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormField label="Тип организации">
          <select value={form.entityType} onChange={(e) => update('entityType', e.target.value)} className="form-input">
            <option value="OOO">ООО</option>
            <option value="IP">ИП</option>
            <option value="AO">АО</option>
            <option value="ZAO">ЗАО</option>
            <option value="NonProfit">НКО</option>
          </select>
        </FormField>
        <FormField label="ИНН"><TextInput value={form.inn} onChange={(v) => update('inn', v)} placeholder="7701234567" /></FormField>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormField label="КПП"><TextInput value={form.kpp} onChange={(v) => update('kpp', v)} placeholder="770101001" /></FormField>
        <FormField label="ОГРН / ОГРНИП"><TextInput value={form.ogrn || form.ogrnip} onChange={(v) => form.entityType === 'IP' ? update('ogrnip', v) : update('ogrn', v)} placeholder="1027700123456" /></FormField>
      </div>
      <FormField label="Полное наименование"><TextInput value={form.fullName} onChange={(v) => update('fullName', v)} placeholder="ООО «Ромашка»" /></FormField>
      <FormField label="Краткое наименование"><TextInput value={form.shortName} onChange={(v) => update('shortName', v)} placeholder="Ромашка" /></FormField>
      {form.dataSource === 'dadata' && (
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Данные получены из ЕГРЮЛ/ЕГРИП</div>
      )}
    </div>
  );
}

// ─── Step 3: Address ───
function Step3Address({ form, update }: { form: WizardForm; update: (k: keyof WizardForm, v: string | boolean | string[]) => void }) {
  return (
    <div className="wizard-step">
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Адреса</h3>
      <FormField label="Юридический адрес"><TextInput value={form.legalAddress} onChange={(v) => update('legalAddress', v)} placeholder="г. Москва, ул. Примерная, д. 1" /></FormField>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, margin: '8px 0' }}>
        <input type="checkbox" checked={form.addressSame} onChange={(e) => update('addressSame', e.target.checked)} />
        Фактический совпадает с юридическим
      </label>
      {!form.addressSame && (
        <FormField label="Фактический адрес"><TextInput value={form.actualAddress} onChange={(v) => update('actualAddress', v)} placeholder="г. Москва, ул. Примерная, д. 1" /></FormField>
      )}
    </div>
  );
}

// ─── Step 4: Signatory ───
function Step4Signatory({ form, update }: { form: WizardForm; update: (k: keyof WizardForm, v: string | boolean | string[]) => void }) {
  return (
    <div className="wizard-step">
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Подписант</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormField label="ФИО подписанта"><TextInput value={form.signatoryFullName} onChange={(v) => update('signatoryFullName', v)} placeholder="Иванов Иван Иванович" /></FormField>
        <FormField label="Должность"><TextInput value={form.signatoryPosition} onChange={(v) => update('signatoryPosition', v)} placeholder="Генеральный директор" /></FormField>
      </div>
      <FormField label="Основание полномочий">
        <select value={form.authorityType} onChange={(e) => update('authorityType', e.target.value)} className="form-input">
          <option value="Устав">Устав</option>
          <option value="Доверенность">Доверенность</option>
          <option value="Другое">Другое</option>
        </select>
      </FormField>
      {form.authorityType === 'Доверенность' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <FormField label="Номер доверенности"><TextInput value={form.powerOfAttorneyNumber} onChange={(v) => update('powerOfAttorneyNumber', v)} placeholder="123" /></FormField>
            <FormField label="Дата"><TextInput value={form.powerOfAttorneyDate} onChange={(v) => update('powerOfAttorneyDate', v)} type="date" /></FormField>
            <FormField label="Срок действия"><TextInput value={form.powerOfAttorneyExpiry} onChange={(v) => update('powerOfAttorneyExpiry', v)} type="date" /></FormField>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Step 5: Bank ───
function Step5Bank({ form, update }: { form: WizardForm; update: (k: keyof WizardForm, v: string | boolean | string[]) => void }) {
  const [bankLoading, setBankLoading] = useState(false);
  const [bankError, setBankError] = useState<string | null>(null);

  const handleBikLookup = async () => {
    const cleanBik = form.bik.replace(/\D/g, '');
    if (cleanBik.length !== 9) return;
    setBankLoading(true);
    setBankError(null);
    try {
      const res = await lookupBankByBik(cleanBik);
      update('bankName', res.bankName);
      update('correspondentAccount', res.correspondentAccount);
    } catch (err) {
      setBankError(err instanceof Error ? err.message : 'Банк не найден');
    } finally {
      setBankLoading(false);
    }
  };

  return (
    <div className="wizard-step">
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Банковские реквизиты</h3>
      <FormField label="БИК">
        <div style={{ display: 'flex', gap: 8 }}>
          <TextInput value={form.bik} onChange={(v) => update('bik', v.replace(/\D/g, ''))} placeholder="044525225" />
          <button className="big-button ghost" onClick={handleBikLookup} disabled={bankLoading || form.bik.length !== 9} style={{ whiteSpace: 'nowrap', padding: '0 16px' }}>
            {bankLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          </button>
        </div>
      </FormField>
      {bankError && <div style={{ fontSize: 12, color: '#d97706', marginBottom: 8 }}>{bankError}</div>}
      <FormField label="Наименование банка"><TextInput value={form.bankName} onChange={(v) => update('bankName', v)} placeholder="ПАО Сбербанк" /></FormField>
      <FormField label="Расчётный счёт"><TextInput value={form.checkingAccount} onChange={(v) => update('checkingAccount', v)} placeholder="40702810400000012345" /></FormField>
      <FormField label="Корреспондентский счёт"><TextInput value={form.correspondentAccount} onChange={(v) => update('correspondentAccount', v)} placeholder="30101810400000000225" /></FormField>
    </div>
  );
}

// ─── Step 6: Contacts ───
function Step6Contacts({ form, update }: { form: WizardForm; update: (k: keyof WizardForm, v: string | boolean | string[]) => void }) {
  return (
    <div className="wizard-step">
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Контакты</h3>
      <FormField label="Контактное лицо"><TextInput value={form.contactPerson} onChange={(v) => update('contactPerson', v)} placeholder="Иванов Иван" /></FormField>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormField label="Телефон"><TextInput value={form.contactPhone} onChange={(v) => update('contactPhone', v)} placeholder="+7 (495) 123-45-67" /></FormField>
        <FormField label="Email"><TextInput value={form.contactEmail} onChange={(v) => update('contactEmail', v)} placeholder="info@example.com" type="email" /></FormField>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormField label="Email бухгалтерии"><TextInput value={form.accountingEmail} onChange={(v) => update('accountingEmail', v)} placeholder="buh@example.com" type="email" /></FormField>
        <FormField label="Телефон бухгалтерии"><TextInput value={form.accountingPhone} onChange={(v) => update('accountingPhone', v)} placeholder="+7 (495) 123-45-67" /></FormField>
      </div>
    </div>
  );
}

// ─── Step 7: About ───
function Step7About({ form, update }: { form: WizardForm; update: (k: keyof WizardForm, v: string | boolean | string[]) => void }) {
  return (
    <div className="wizard-step">
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>О бизнесе</h3>
      <FormField label="Сфера деятельности">
        <select value={form.industry} onChange={(e) => update('industry', e.target.value)} className="form-input">
          <option value="">Выберите сферу</option>
          <option value="IT">IT</option>
          <option value="Маркетинг">Маркетинг</option>
          <option value="Розничная торговля">Розничная торговля</option>
          <option value="Производство">Производство</option>
          <option value="Услуги">Услуги</option>
          <option value="Образование">Образование</option>
          <option value="Другое">Другое</option>
        </select>
      </FormField>
      <FormField label="Сайт"><TextInput value={form.website} onChange={(v) => update('website', v)} placeholder="example.com" /></FormField>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormField label="Город"><TextInput value={form.city} onChange={(v) => update('city', v)} placeholder="Москва" /></FormField>
        <FormField label="Размер компании">
          <select value={form.orgSize} onChange={(e) => update('orgSize', e.target.value)} className="form-input">
            <option value="">Выберите размер</option>
            <option value="1-10">1–10 человек</option>
            <option value="11-50">11–50 человек</option>
            <option value="51-200">51–200 человек</option>
            <option value="200+">200+ человек</option>
          </select>
        </FormField>
      </div>
    </div>
  );
}

// ─── Step 8: Needs ───
function Step8Needs({ form, update, businessTermsAccepted, setBusinessTermsAccepted }: { form: WizardForm; update: (k: keyof WizardForm, v: string | boolean | string[]) => void; businessTermsAccepted: boolean; setBusinessTermsAccepted: (v: boolean) => void }) {
  const needs = [
    { id: 'advertising', label: 'Реклама' },
    { id: 'marketing', label: 'Маркетинг' },
    { id: 'design', label: 'Дизайн' },
    { id: 'website', label: 'Сайт' },
    { id: 'ai', label: 'AI' },
    { id: 'hr', label: 'Поиск сотрудников' },
    { id: 'exploring', label: 'Пока изучаю' },
  ];
  const toggle = (id: string) => {
    const current = form.needs;
    update('needs', current.includes(id) ? current.filter((n) => n !== id) : [...current, id]);
  };
  return (
    <div className="wizard-step">
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Что вам нужно</h3>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>Выберите одно или несколько</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {needs.map((n) => (
          <button
            key={n.id}
            onClick={() => toggle(n.id)}
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              border: `1px solid ${form.needs.includes(n.id) ? 'var(--blue)' : 'var(--line)'}`,
              background: form.needs.includes(n.id) ? 'rgba(25,181,254,0.08)' : 'var(--card)',
              color: form.needs.includes(n.id) ? 'var(--blue)' : 'var(--text)',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {form.needs.includes(n.id) && <Check size={14} style={{ display: 'inline', marginRight: 4 }} />}
            {n.label}
          </button>
        ))}
      </div>
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, marginTop: 20, cursor: 'pointer', padding: '12px 14px', borderRadius: 12, background: 'rgba(0,0,0,0.02)', border: '1px solid var(--line)' }}>
        <input type="checkbox" checked={businessTermsAccepted} onChange={(e) => setBusinessTermsAccepted(e.target.checked)} style={{ marginTop: 2 }} />
        <span>
          Принимаю <Link to="/legal/business" target="_blank" style={{ color: 'var(--blue)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>условия бизнес-сервиса <LinkIcon size={11} /></Link>
        </span>
      </label>
    </div>
  );
}
