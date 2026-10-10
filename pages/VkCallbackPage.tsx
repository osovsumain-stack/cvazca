import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleVkCallback, getAuthReturnPath, clearAuthOrigin } from '@/services/vkAuthService';
import { useAuth } from '@/services/authContext';
import { candidateRepository, organizationMembershipRepository, accountRepository } from '@/repositories/mockRepositories';
import { recordRegistrationConsent, hasRegistrationConsent } from '@/services/consentService';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';

export function VkCallbackPage() {
  const navigate = useNavigate();
  const { refreshAccount, vkStatus } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);
  const handledRef = useRef(false);

  useEffect(() => {
    if (vkStatus !== 'ready') return;
    if (handledRef.current) return;
    handledRef.current = true;

    (async () => {
      const result = await handleVkCallback();
      if (!result.success || !result.account) {
        setError(result.cancelled ? 'Авторизация отменена' : (result.error || 'Ошибка авторизации'));
        setProcessing(false);
        return;
      }

      const consentKey = 'svyazka_registration_consent';
      try {
        const savedConsent = sessionStorage.getItem(consentKey);
        if (savedConsent) {
          const parsed = JSON.parse(savedConsent);
          const alreadyHasConsent = await hasRegistrationConsent(result.account.id);
          if (!alreadyHasConsent) {
            await recordRegistrationConsent(result.account.id, parsed);
          }
        }
      } catch { /* dev-only */ }

      await refreshAccount();
      const account = await accountRepository.getCurrentAccount();
      if (!account) {
        setError('Аккаунт не найден');
        setProcessing(false);
        return;
      }

      if (result.origin === 'career') {
        const profile = await candidateRepository.getProfile(account.id);
        const returnPath = getAuthReturnPath();
        navigate(returnPath && returnPath.startsWith('/career/') ? returnPath : (profile ? '/career' : '/career/onboarding'), { replace: true });
      } else if (result.origin === 'business') {
        const memberships = await organizationMembershipRepository.getByAccount(account.id);
        const returnPath = getAuthReturnPath();
        navigate(memberships.length > 0 ? (returnPath && returnPath.startsWith('/business/') ? returnPath : '/business/dashboard') : '/business/organizations/new', { replace: true });
      } else {
        const returnPath = getAuthReturnPath();
        navigate(returnPath || '/', { replace: true });
      }
      clearAuthOrigin();
    })();
  }, [navigate, refreshAccount, vkStatus]);

  if (vkStatus === 'error') {
    return (
      <div className="simple-page">
        <div className="bg-blobs" />
        <div className="simple-card css-fade-up">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
            <AlertCircle size={40} color="#ef4444" />
            <h1>VK ID не настроен</h1>
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>Проверьте VITE_VK_APP_ID в настройках сборки.</p>
            <button className="big-button primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => navigate('/auth', { replace: true })}>
              <RefreshCw size={16} /> Вернуться к входу
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="simple-page">
        <div className="bg-blobs" />
        <div className="simple-card css-fade-up">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
            <AlertCircle size={40} color="#ef4444" />
            <h1>Ошибка авторизации</h1>
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>{error}</p>
            <button className="big-button primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => navigate('/auth', { replace: true })}>
              <RefreshCw size={16} /> Попробовать снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="simple-page">
      <div className="bg-blobs" />
      <div className="simple-card css-fade-up">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
          <Loader2 size={40} className="animate-spin" color="var(--blue)" />
          <h1>Авторизация...</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>
            {vkStatus === 'loading' ? 'Инициализация VK ID SDK...' : 'Обрабатываем ответ VK ID'}
          </p>
        </div>
      </div>
    </div>
  );
}
