export interface VacancyDraft {
  step: number;
  form: Record<string, unknown>;
  selectedOrganizationId: string;
}

export interface IVacancyDraftRepository {
  load(accountId: string, organizationId: string): VacancyDraft | null;
  save(accountId: string, organizationId: string, draft: VacancyDraft): void;
  clear(accountId: string, organizationId: string): void;
}

const PREFIX = 'svyazka_dev_vacancy_draft_';

class SessionVacancyDraftRepository implements IVacancyDraftRepository {
  private key(accountId: string, organizationId: string): string {
    return PREFIX + accountId + '_' + organizationId;
  }

  load(accountId: string, organizationId: string): VacancyDraft | null {
    try {
      const raw = sessionStorage.getItem(this.key(accountId, organizationId));
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
  save(accountId: string, organizationId: string, draft: VacancyDraft): void {
    try {
      sessionStorage.setItem(this.key(accountId, organizationId), JSON.stringify(draft));
    } catch { /* dev-only */ }
  }
  clear(accountId: string, organizationId: string): void {
    try {
      sessionStorage.removeItem(this.key(accountId, organizationId));
    } catch { /* dev-only */ }
  }
}

export const vacancyDraftRepository = new SessionVacancyDraftRepository();
