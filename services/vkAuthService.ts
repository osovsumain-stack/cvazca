import { apiRequest } from '@/repositories/transport';
import * as VKID from '@vkid/sdk';
import type { PlatformAccount, PlatformRole, VkUserInfo, AuthSession } from '@/types/platform';
import { accountRepository, referralRepository } from '@/repositories/mockRepositories';
import { sessionRepository, type PlatformSession } from '@/repositories/sessionRepository';
import { getReferralContext, clearReferralContext } from '@/services/referralCapture';

const VK_APP_ID = Number(import.meta.env.VITE_VK_APP_ID) || 0;
const VK_REDIRECT_URL = import.meta.env.VITE_VK_REDIRECT_URL || (typeof window !== 'undefined' ? `${window.location.origin}/auth/vk/callback` : '');

const AUTH_ORIGIN_KEY = 'svyazka_auth_origin';
const AUTH_RETURN_PATH_KEY = 'svyazka_auth_return_path';

// ─── VK SDK configuration ───

let configInitialized = false;
let configInitError = false;

export type VkSdkState = 'loading' | 'ready' | 'error';

export function getVkSdkState(): VkSdkState {
  if (!VK_APP_ID) return 'error';
  if (configInitError) return 'error';
  return configInitialized ? 'ready' : 'loading';
}

export function initVkConfig(): void {
  if (configInitialized) return;
  if (!VK_APP_ID) {
    console.error('[VK ID] VITE_VK_APP_ID is not set or invalid');
    configInitError = true;
    return;
  }

  // Debug diagnostics — no secrets exposed
  console.info('[VK ID config]', {
    appIdPresent: Boolean(VK_APP_ID),
    appId: VK_APP_ID,
    redirectUrl: VK_REDIRECT_URL,
    sdkVersion: '2.6.8',
  });

  try {
    VKID.Config.init({
      app: VK_APP_ID,
      redirectUrl: VK_REDIRECT_URL,
      responseMode: VKID.ConfigResponseMode.Callback,
      source: VKID.ConfigSource.LOWCODE,
      scope: 'email phone',
    });
    configInitialized = true;
    configInitError = false;
  } catch (err) {
    console.error('[VK ID] Config init failed:', err);
    configInitError = true;
  }
}

// ─── Auth origin tracking ───

export function saveAuthOrigin(origin: 'career' | 'business' | 'home'): void {
  try { sessionStorage.setItem(AUTH_ORIGIN_KEY, origin); } catch { /* dev-only */ }
}

export function getAuthOrigin(): 'career' | 'business' | 'home' {
  try {
    return (sessionStorage.getItem(AUTH_ORIGIN_KEY) as 'career' | 'business' | 'home') || 'home';
  } catch { return 'home'; }
}

export function clearAuthOrigin(): void {
  try { sessionStorage.removeItem(AUTH_ORIGIN_KEY); } catch { /* dev-only */ }
  try { sessionStorage.removeItem(AUTH_RETURN_PATH_KEY); } catch { /* dev-only */ }
}

export function saveAuthReturnPath(path: string): void {
  try { sessionStorage.setItem(AUTH_RETURN_PATH_KEY, path); } catch { /* dev-only */ }
}

export function getAuthReturnPath(): string | null {
  try { return sessionStorage.getItem(AUTH_RETURN_PATH_KEY); } catch { return null; }
}

// ─── Render VK OAuth button widget ───

export function renderVkButton(
  container: HTMLElement,
  onSuccess: (code: string, deviceId: string) => void,
  onError: (error: string) => void,
): () => void {
  initVkConfig();

  try {
    const oAuth = new VKID.OAuthList();
    oAuth.render({
      container,
      styles: { borderRadius: 44, height: 56 },
      oauthList: [VKID.OAuthName.VK],
    })
      .on(VKID.WidgetEvents.ERROR, (...args: unknown[]) => {
        console.error('[VK ID] Widget error:', args[0]);
        onError('Ошибка виджета VK ID');
      })
      .on(VKID.OAuthListInternalEvents.LOGIN_SUCCESS, (payload: unknown) => {
        const p = payload as { code?: string; device_id?: string; state?: string };
        if (p?.code && p?.device_id) {
          onSuccess(p.code, p.device_id);
        } else {
          onError('Неверный ответ от VK ID: отсутствует code или device_id');
        }
      });

    return () => {
      try { container.innerHTML = ''; } catch { /* cleanup */ }
    };
  } catch (err) {
    console.error('[VK ID] Failed to render widget:', err);
    onError('Не удалось отрисовать кнопку VK ID');
    return () => {};
  }
}

// ─── Exchange code + create/update account ───

export interface VkAuthResult {
  success: boolean;
  error: string | null;
  cancelled: boolean;
  account: PlatformAccount | null;
  roles: PlatformRole[];
  origin: 'career' | 'business' | 'home';
}

// Guard against duplicate code exchange (StrictMode, repeated callbacks)
let activeCodeExchange: string | null = null;

export async function processVkAuth(code: string, deviceId: string): Promise<VkAuthResult> {
  const origin = getAuthOrigin();
  if (!VK_APP_ID) return { success: false, error: 'VK ID не настроен: отсутствует VITE_VK_APP_ID', cancelled: false, account: null, roles: [], origin };

  if (activeCodeExchange === code) {
    return { success: false, error: 'Этот код уже обрабатывается', cancelled: false, account: null, roles: [], origin };
  }
  activeCodeExchange = code;

  // Do NOT call initVkConfig() here — it was already called during AuthProvider init.
  // Calling it again could reset SDK internal PKCE state and break exchangeCode.
  if (!configInitialized) {
    activeCodeExchange = null;
    return { success: false, error: 'VK ID SDK не инициализирован', cancelled: false, account: null, roles: [], origin };
  }

  let tokenResult: Omit<VKID.TokenResult, 'id_token'>;
  try {
    tokenResult = await VKID.Auth.exchangeCode(code, deviceId);
  } catch (err) {
    console.error('[VK ID] exchangeCode failed:', err);
    activeCodeExchange = null;
    const errMsg = err && typeof err === 'object' && 'error' in err
      ? String((err as Record<string, unknown>).error)
      : 'Не удалось обменять код авторизации';
    return { success: false, error: `Ошибка обмена кода: ${errMsg}`, cancelled: false, account: null, roles: [], origin };
  }

  const accessToken = tokenResult.access_token;
  if (!accessToken) {
    activeCodeExchange = null;
    return { success: false, error: 'access_token не получен', cancelled: false, account: null, roles: [], origin };
  }

  try {
    const session = await apiRequest<AuthSession>('/api/auth/vk', { accessToken, referralCode: getReferralContext()?.refCode });
    sessionRepository.save({ accountId: session.account.id, roles: session.roles, createdAt: new Date().toISOString(), expiresAt: session.expiresAt });
    return { success: true, error: null, cancelled: false, account: session.account, roles: session.roles, origin };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Ошибка входа', cancelled: false, account: null, roles: [], origin };
  } finally { activeCodeExchange = null; }
}

// ─── Redirect-based callback ───

let callbackHandled = false;

export async function handleVkCallback(): Promise<VkAuthResult> {
  if (callbackHandled) {
    return { success: false, error: 'Callback уже обработан', cancelled: false, account: null, roles: [], origin: getAuthOrigin() };
  }

  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const deviceId = url.searchParams.get('device_id');
  const errorParam = url.searchParams.get('error');
  const errorDesc = url.searchParams.get('error_description');
  const origin = getAuthOrigin();

  if (errorParam === 'access_denied' || (errorParam && !code)) {
    callbackHandled = true;
    cleanUrlParams();
    return { success: false, error: 'Авторизация отменена', cancelled: true, account: null, roles: [], origin };
  }
  if (errorParam) {
    console.error('[VK ID] Auth error:', errorParam, errorDesc);
    callbackHandled = true;
    cleanUrlParams();
    return { success: false, error: 'Ошибка VK ID. Попробуйте позже.', cancelled: false, account: null, roles: [], origin };
  }
  if (!code) {
    return { success: false, error: 'Код авторизации не получен', cancelled: false, account: null, roles: [], origin };
  }
  if (!state) {
    callbackHandled = true;
    cleanUrlParams();
    return { success: false, error: 'Параметр state отсутствует — возможная атака CSRF', cancelled: false, account: null, roles: [], origin };
  }
  if (!deviceId) {
    callbackHandled = true;
    cleanUrlParams();
    return { success: false, error: 'Параметр device_id отсутствует', cancelled: false, account: null, roles: [], origin };
  }

  callbackHandled = true;
  const result = await processVkAuth(code, deviceId);
  cleanUrlParams();
  return result;
}

function cleanUrlParams(): void {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('code');
    url.searchParams.delete('state');
    url.searchParams.delete('device_id');
    url.searchParams.delete('error');
    url.searchParams.delete('error_description');
    window.history.replaceState({}, '', url.pathname + (url.search || ''));
  } catch { /* dev-only */ }
}

export function normalizeVkId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const urlMatch = trimmed.match(/(?:vk\.ru|vk\.com)\/(?:id)?(\d+)/);
  if (urlMatch) return urlMatch[1];
  if (/^\d+$/.test(trimmed)) return trimmed;
  return null;
}

// ─── Get current session ───

export async function getCurrentSession(): Promise<AuthSession | null> {
  const session = await apiRequest<AuthSession | null>('/api/auth/session');
  if (session) sessionRepository.save({ accountId: session.account.id, roles: session.roles, createdAt: new Date().toISOString(), expiresAt: session.expiresAt });
  else sessionRepository.clear();
  return session;
}

export async function logout(): Promise<void> {
  await apiRequest('/api/auth/logout', {});
  sessionRepository.clear();
  clearAuthOrigin();
  clearReferralContext();
}
