import { apiRequest } from '@/repositories/transport';
// ─── Referral Capture Service ───
// Captures ?ref= from any URL before auth, so it survives the VK redirect.
// Stored in sessionStorage (survives redirect, cleared on tab close).

const REFERRAL_CONTEXT_KEY = 'svyazka_referral_context';

export interface ReferralContext {
  refCode: string;
  capturedAt: string;
  capturedPath: string;
}

export function captureReferralFromUrl(url: string): void {
  try {
    const u = new URL(url, window.location.origin);
    const ref = u.searchParams.get('ref');
    if (ref && ref.length > 0 && ref.length < 100) {
      const previous = getReferralContext();
      if (!previous || previous.refCode !== ref || Date.now()-Date.parse(previous.capturedAt)>60000) apiRequest('/api/referrals/visit', { code: ref }).catch(() => {});
      sessionStorage.setItem(REFERRAL_CONTEXT_KEY, JSON.stringify({
        refCode: ref,
        capturedAt: new Date().toISOString(),
        capturedPath: u.pathname,
      }));
    }
  } catch { /* dev-only */ }
}

export function getReferralContext(): ReferralContext | null {
  try {
    const raw = sessionStorage.getItem(REFERRAL_CONTEXT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ReferralContext;
  } catch {
    return null;
  }
}

export function clearReferralContext(): void {
  try {
    sessionStorage.removeItem(REFERRAL_CONTEXT_KEY);
  } catch { /* dev-only */ }
}
