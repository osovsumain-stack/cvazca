import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { PlatformAccount, PlatformRole } from '@/types/platform';
import { accountRepository } from '@/repositories/mockRepositories';
import { getCurrentSession, logout as authLogout, saveAuthOrigin, saveAuthReturnPath, initVkConfig, getVkSdkState } from '@/services/vkAuthService';
import { captureReferralFromUrl } from '@/services/referralCapture';

export type VkSdkStatus = 'loading' | 'ready' | 'error';

interface AuthContextValue {
  account: PlatformAccount | null;
  roles: PlatformRole[];
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
  refreshAccount: () => Promise<void>;
  hasRole: (role: PlatformRole) => boolean;
  vkStatus: VkSdkStatus;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<PlatformAccount | null>(null);
  const [roles, setRoles] = useState<PlatformRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [vkStatus, setVkStatus] = useState<VkSdkStatus>('loading');

  useEffect(() => {
    const VK_APP_ID = Number(import.meta.env.VITE_VK_APP_ID) || 0;
    if (!VK_APP_ID) {
      
      setVkStatus('error');
    } else {
      try {
        initVkConfig();
        // Check the actual state after init — initVkConfig may have failed internally
        const state = getVkSdkState();
        setVkStatus(state === 'ready' ? 'ready' : 'error');
      } catch (err) {
        console.error('[VK ID] Init failed:', err);
        setVkStatus('error');
      }
    }
    captureReferralFromUrl(window.location.href);
  }, []);

  const refreshAccount = useCallback(async () => {
    const session = await getCurrentSession();
    setAccount(session?.account ?? null);
    setRoles(session?.roles ?? []);
  }, []);

  useEffect(() => {
    (async () => {
      try { await refreshAccount(); } catch { setAccount(null); setRoles([]); } finally { setIsLoading(false); }
    })();
  }, [refreshAccount]);

  useEffect(() => { const changed = () => refreshAccount().catch(() => {}); window.addEventListener('svyazka:auth-changed', changed); return () => window.removeEventListener('svyazka:auth-changed', changed); }, [refreshAccount]);

  const logout = useCallback(async () => {
    await authLogout();
    setAccount(null);
    setRoles([]);
  }, []);

  const hasRole = useCallback((role: PlatformRole) => roles.includes(role), [roles]);

  return (
    <AuthContext.Provider value={{ account, roles, isAuthenticated: !!account, isLoading, logout, refreshAccount, hasRole, vkStatus }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { saveAuthOrigin, saveAuthReturnPath };
