import { repositoryAdapter } from './transport';
import type { AppState, UserProfile, Vacancy } from '@/types';

// ─── Journey Repository (demo adapter) ───
// This encapsulates all localStorage/Supabase access for the career journey.
// UI components should never touch localStorage or Supabase directly.
// In production, this would be replaced by a Supabase-backed implementation.

const STORAGE_KEY = 'career-journey-v3';
const PROFILE_ID_KEY = 'career-journey-profile-id';

function getProfileId(): string {
  try {
    let id = localStorage.getItem(PROFILE_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(PROFILE_ID_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

function loadLocalState(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AppState;
  } catch {
    return null;
  }
}

export interface IJourneyRepository {
  loadState(): Promise<AppState | null>;
  saveState(state: AppState): Promise<void>;
  resetJourney(): Promise<void>;
  recordApplication(profile: UserProfile, vacancy: Vacancy, coverLetter: string): Promise<void>;
  prefillFromVk(vkInfo: { firstName: string; lastName: string; phone: string; email: string; avatarUrl: string }): Partial<UserProfile>;
}

class LocalDemoJourneyRepository implements IJourneyRepository {
  async loadState(): Promise<AppState | null> {
    return loadLocalState();
  }

  async saveState(state: AppState): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch { /* dev-only */ }
  }

  async resetJourney(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(PROFILE_ID_KEY);
    } catch { /* dev-only */ }
  }

  async recordApplication(_profile: UserProfile, vacancy: Vacancy, _coverLetter: string): Promise<void> {
    // In production this would insert into career_applications via Supabase
    // For demo, we just log
    console.log('Application recorded:', vacancy.title);
  }

  prefillFromVk(vkInfo: { firstName: string; lastName: string; phone: string; email: string; avatarUrl: string }): Partial<UserProfile> {
    const prefill: Partial<UserProfile> = {};
    if (vkInfo.firstName) prefill.firstName = vkInfo.firstName;
    if (vkInfo.lastName) prefill.lastName = vkInfo.lastName;
    if (vkInfo.phone) prefill.phone = vkInfo.phone;
    if (vkInfo.email) prefill.email = vkInfo.email;
    if (vkInfo.avatarUrl) prefill.photo = vkInfo.avatarUrl;
    return prefill;
  }
}

export const journeyRepository: IJourneyRepository = repositoryAdapter("journey", new LocalDemoJourneyRepository());
