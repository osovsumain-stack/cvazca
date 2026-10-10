// ─── Session Repository (DEV adapter) ───
// DEVELOPMENT-ONLY: stores platform session in sessionStorage.
// In production this will be replaced by a backend session (HTTP-only cookie / server token).
// VK OAuth tokens are NOT stored here — only the platform session reference.
const SESSION_KEY = 'svyazka_platform_session';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
class DevSessionRepository {
    save(session) {
        try {
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
        }
        catch { /* dev-only */ }
    }
    load() {
        try {
            const raw = sessionStorage.getItem(SESSION_KEY);
            if (!raw)
                return null;
            const session = JSON.parse(raw);
            if (new Date(session.expiresAt).getTime() < Date.now()) {
                this.clear();
                return null;
            }
            return session;
        }
        catch {
            return null;
        }
    }
    clear() {
        try {
            sessionStorage.removeItem(SESSION_KEY);
        }
        catch { /* dev-only */ }
    }
    updateRoles(roles) {
        const session = this.load();
        if (session) {
            session.roles = roles;
            this.save(session);
        }
    }
}
export const sessionRepository = new DevSessionRepository();
