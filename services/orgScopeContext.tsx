import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Organization, OrganizationMembership, OrganizationRole } from '@/types/platform';
import { organizationRepository, organizationMembershipRepository } from '@/repositories/mockRepositories';
import { useAuth } from '@/services/authContext';

interface OrgScopeValue {
  memberships: OrganizationMembership[];
  activeOrganization: Organization | null;
  activeMembership: OrganizationMembership | null;
  activeRole: OrganizationRole | null;
  setActiveOrgId: (orgId: string) => void;
  refresh: () => Promise<void>;
  isLoading: boolean;
}

const OrgScopeContext = createContext<OrgScopeValue | null>(null);

const STORAGE_KEY = 'svyazka_active_org';

export function OrgScopeProvider({ children }: { children: ReactNode }) {
  const { account } = useAuth();
  const [memberships, setMemberships] = useState<OrganizationMembership[]>([]);
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!account) {
      setMemberships([]);
      setActiveOrg(null);
      setIsLoading(false);
      return;
    }
    const ms = await organizationMembershipRepository.getByAccount(account.id);
    const active = ms.filter((m) => m.status === 'active');
    setMemberships(active);
    if (active.length === 0) {
      setActiveOrg(null);
      setIsLoading(false);
      return;
    }
    let storedId: string | null = null;
    try { storedId = localStorage.getItem(`${STORAGE_KEY}_${account.id}`); } catch { /* ignore */ }
    const target = active.find((m) => m.organizationId === storedId) ?? active[0];
    const org = await organizationRepository.getById(target.organizationId);
    setActiveOrg(org);
    setIsLoading(false);
  }, [account]);

  useEffect(() => { refresh().catch(() => { setMemberships([]); setActiveOrg(null); setIsLoading(false); }); }, [refresh]);
  useEffect(() => { const changed = () => refresh().catch(() => setIsLoading(false)); window.addEventListener('svyazka:organizations-changed', changed); return () => window.removeEventListener('svyazka:organizations-changed', changed); }, [refresh]);

  const setActiveOrgId = useCallback((orgId: string) => {
    const m = memberships.find((m) => m.organizationId === orgId);
    if (!m) return;
    try { localStorage.setItem(`${STORAGE_KEY}_${account?.id}`, orgId); } catch { /* ignore */ }
    organizationRepository.getById(orgId).then(setActiveOrg);
  }, [memberships]);

  const activeMembership = memberships.find((m) => m.organizationId === activeOrg?.id) ?? null;
  const activeRole = activeMembership?.role ?? null;

  return (
    <OrgScopeContext.Provider value={{ memberships, activeOrganization: activeOrg, activeMembership, activeRole, setActiveOrgId, refresh, isLoading }}>
      {children}
    </OrgScopeContext.Provider>
  );
}

export function useOrgScope(): OrgScopeValue {
  const ctx = useContext(OrgScopeContext);
  if (!ctx) throw new Error('useOrgScope must be used within OrgScopeProvider');
  return ctx;
}
