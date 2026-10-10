import { type ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/services/authContext';
import type { PlatformRole, OrganizationRole } from '@/types/platform';
import { organizationMembershipRepository } from '@/repositories/mockRepositories';
import { canManageVacancies } from '@/services/permissions';

// ─── RequireAuth ───

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: 'var(--muted)', fontSize: 16 }}>
        Загрузка...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location.pathname + location.search }} replace />;
  }

  return <>{children}</>;
}

// ─── RequirePlatformRole ───

export function RequirePlatformRole({ role, children }: { role: PlatformRole; children: ReactNode }) {
  const { hasRole, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: 'var(--muted)', fontSize: 16 }}>
        Загрузка...
      </div>
    );
  }

  if (!hasRole(role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// ─── RequireOrganizationMembership ───

export function RequireOrganizationMembership({ children }: { children: ReactNode }) {
  const { account, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [hasOrg, setHasOrg] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !account) {
      setChecking(false);
      return;
    }
    (async () => {
      const memberships = await organizationMembershipRepository.getByAccount(account.id);
      setHasOrg(memberships.length > 0);
      setChecking(false);
    })().catch(() => { setChecking(false); });
  }, [isLoading, isAuthenticated, account]);

  if (isLoading || checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: 'var(--muted)', fontSize: 16 }}>
        Загрузка...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location.pathname + location.search }} replace />;
  }

  if (!hasOrg) {
    return <Navigate to="/business/organizations/new" replace />;
  }

  return <>{children}</>;
}

// ─── RequireOrganizationPermission ───
// Checks that the current user has a specific organization-level permission
// (e.g. canManageVacancies) for at least one of their organizations.

export function RequireOrganizationPermission({ children, check }: { children: ReactNode; check: (role: OrganizationRole) => boolean }) {
  const { account, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !account) {
      setChecking(false);
      return;
    }
    (async () => {
      const memberships = await organizationMembershipRepository.getByAccount(account.id);
      setAllowed(memberships.some((m) => m.status === 'active' && check(m.role)));
      setChecking(false);
    })().catch(() => { setChecking(false); });
  }, [isLoading, isAuthenticated, account, check]);

  if (isLoading || checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: 'var(--muted)', fontSize: 16 }}>
        Загрузка...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location.pathname + location.search }} replace />;
  }

  if (!allowed) {
    return <Navigate to="/business/dashboard" replace />;
  }

  return <>{children}</>;
}

// Convenience wrapper for vacancy management permission
export function RequireVacancyManager({ children }: { children: ReactNode }) {
  return <RequireOrganizationPermission check={canManageVacancies}>{children}</RequireOrganizationPermission>;
}
