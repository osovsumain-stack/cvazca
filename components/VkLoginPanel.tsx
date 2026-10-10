import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Loader2, Briefcase, Sparkles, RefreshCw } from 'lucide-react';
import { useAuth, saveAuthOrigin } from '@/services/authContext';
import { renderVkButton, processVkAuth } from '@/services/vkAuthService';
import { candidateRepository, organizationMembershipRepository, accountRepository } from '@/repositories/mockRepositories';
import { ConsentGate } from '@/components/ConsentGate';
import { recordRegistrationConsent, hasRegistrationConsent } from '@/services/consentService';

interface VkLoginPanelProps {
  origin: 'career' | 'business';
  title: string;
  subtitle: string;
  backUrl: string;
}

export function VkLoginPanel({ origin, title, subtitle, backUrl }: VkLoginPanelProps) {
  const { isAuthenticated, isLoading, vkStatus, refreshAccount } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState({ user_terms: false, personal_data: false, marketing: false });
  const vkContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated && !processing && !isLoading) {
      handlePostLoginRedirect();
    }
  }, [isAuthenticated, processing, isLoading]);

  const handlePostLoginRedirect = async () => {
    const account = await accountRepository.getCurrentAccount();
    if (!account) return;
    if (origin === 'career') {
      const profile = await candidateRepository.getProfile(account.id);
      navigate(profile ? '/career' : '/career/onboarding');
    } else {
      const memberships = await organizationMembershipRepository.getByAccount(account.id);
      navigate(memberships.length > 0 ? '/business/dashboard' : '/business/onboarding');
    }
  };

  useEffect(() => {
    if (vkStatus !== 'ready' || !vkContainerRef.current || processing) return;
    if (!consentAccepted.user_terms || !consentAccepted.personal_data) return;

    const cleanup = renderVkButton(
      vkContainerRef.current,
      async (code, deviceId) => {
        setProcessing(true);
        setError(null);
        saveAuthOrigin(origin);
        try {
          const result = await processVkAuth(code, deviceId);
          if (!result.success || !result.account) {
            setError(result.cancelled ? 'Авторизация отменена' : (result.error || 'Ошибка авторизации'));
            setProcessing(false);
            return;
          }
          const alreadyHasConsent = await hasRegistrationConsent(result.account.id);
          if (!alreadyHasConsent) {
            await recordRegistrationConsent(result.account.id, consentAccepted);
          }
          await refreshAccount();
          await handlePostLoginRedirect();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Ошибка авторизации');
          setProcessing(false);
        }
      },
      (errMsg) => {
        setError(errMsg);
      },
    );

    return cleanup;
  }, [vkStatus, processing, origin, refreshAccount, consentAccepted]);

  const isBusiness = origin === 'business';

  return (
    <div className="simple-page">
      <div className="bg-blobs" />
      <div className="simple-card css-fade-up">
        <button
          onClick={() => navigate(backUrl)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, padding: 0 }}
        >
          <ArrowLeft size={16} /> Назад
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div className={`platform-path-icon ${isBusiness ? 'business' : 'career'}`} style={{ width: 44, height: 44 }}>
            {isBusiness ? <Briefcase size={20} /> : <Sparkles size={20} />}
          </div>
          <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
        </div>

        {vkStatus === 'error' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', fontSize: 13, color: '#ef4444', marginBottom: 16 }}>
            <AlertCircle size={16} />
            <span style={{ flex: 1 }}>VK ID не настроен. Проверьте VITE_VK_APP_ID в настройках сборки.</span>
            <button onClick={() => window.location.reload()} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#ef4444', background: 'none', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '4px 10px', cursor: 'pointer' }}>
              <RefreshCw size={13} /> Повторить
            </button>
          </div>
        )}

        {vkStatus === 'loading' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', fontSize: 13, color: '#d97706', marginBottom: 16 }}>
            <Loader2 size={16} className="animate-spin" />
            Загрузка VK ID SDK...
          </div>
        )}

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', fontSize: 13, color: '#ef4444', marginBottom: 16 }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <ConsentGate onAllRequiredAccepted={setConsentAccepted} />

        {processing && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '24px' }}>
            <Loader2 size={24} className="animate-spin" color="var(--blue)" />
            <span style={{ fontSize: 14, color: 'var(--muted)' }}>Обработка авторизации...</span>
          </div>
        )}

        <div ref={vkContainerRef} style={{ minHeight: 56, opacity: processing ? 0 : 1, transition: 'opacity 0.2s' }} />

        <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
          Один аккаунт VK ID даёт доступ и к Карьере, и к Бизнесу.
        </p>
      </div>
    </div>
  );
}
