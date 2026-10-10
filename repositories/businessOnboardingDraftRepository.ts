export interface BusinessOnboardingDraft {
  step: number;
  form: Record<string, unknown>;
}

export interface IBusinessOnboardingDraftRepository {
  load(accountId: string): BusinessOnboardingDraft | null;
  save(accountId: string, draft: BusinessOnboardingDraft): void;
  clear(accountId: string): void;
}

const PREFIX = 'svyazka_dev_onboarding_draft_';

class SessionBusinessOnboardingDraftRepository implements IBusinessOnboardingDraftRepository {
  load(accountId: string): BusinessOnboardingDraft | null {
    try {
      const raw = sessionStorage.getItem(PREFIX + accountId);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
  save(accountId: string, draft: BusinessOnboardingDraft): void {
    try {
      sessionStorage.setItem(PREFIX + accountId, JSON.stringify(draft));
    } catch { /* dev-only */ }
  }
  clear(accountId: string): void {
    try {
      sessionStorage.removeItem(PREFIX + accountId);
    } catch { /* dev-only */ }
  }
}

export const businessOnboardingDraftRepository = new SessionBusinessOnboardingDraftRepository();
