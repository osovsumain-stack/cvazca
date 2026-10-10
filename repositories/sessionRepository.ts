// ─── Session Repository (DEV adapter) ───
// DEVELOPMENT-ONLY: stores platform session in sessionStorage.
// In production this will be replaced by a backend session (HTTP-only cookie / server token).
// VK OAuth tokens are NOT stored here — only the platform session reference.

import type { PlatformAccount, PlatformRole } from '@/types/platform';

export interface PlatformSession {
  accountId: string;
  roles: PlatformRole[];
  createdAt: string;
  expiresAt: string;
}

export interface ISessionRepository {
  save(session: PlatformSession): void;
  load(): PlatformSession | null;
  clear(): void;
  updateRoles(roles: PlatformRole[]): void;
}

const SESSION_KEY = 'svyazka_platform_session';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

class DevSessionRepository implements ISessionRepository {
  save(session: PlatformSession): void {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch { /* dev-only */ }
  }

  load(): PlatformSession | null {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw) as PlatformSession;
      if (new Date(session.expiresAt).getTime() < Date.now()) {
        this.clear();
        return null;
      }
      return session;
    } catch {
      return null;
    }
  }

  clear(): void {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch { /* dev-only */ }
  }

  updateRoles(roles: PlatformRole[]): void {
    const session = this.load();
    if (session) {
      session.roles = roles;
      this.save(session);
    }
  }
}

export const sessionRepository: ISessionRepository = new DevSessionRepository();
