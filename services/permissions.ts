import type { OrganizationRole } from '@/types/platform';

const MANAGE_VACANCY_ROLES: OrganizationRole[] = ['owner', 'administrator', 'hr_manager'];
const EDIT_ORG_ROLES: OrganizationRole[] = ['owner', 'administrator'];
const MANAGE_MEMBERS_ROLES: OrganizationRole[] = ['owner', 'administrator'];
const MANAGE_PROJECTS_ROLES: OrganizationRole[] = ['owner', 'administrator', 'marketing_manager'];
const VIEW_FINANCIAL_DOCS_ROLES: OrganizationRole[] = ['owner', 'administrator', 'accountant'];

export function canManageVacancies(role: OrganizationRole | undefined | null): boolean {
  if (!role) return false;
  return MANAGE_VACANCY_ROLES.includes(role);
}

export function canViewApplications(role: OrganizationRole | undefined | null): boolean {
  if (!role) return false;
  return MANAGE_VACANCY_ROLES.includes(role);
}

export function canEditOrganization(role: OrganizationRole | undefined | null): boolean {
  if (!role) return false;
  return EDIT_ORG_ROLES.includes(role);
}

export function canManageMembers(role: OrganizationRole | undefined | null): boolean {
  if (!role) return false;
  return MANAGE_MEMBERS_ROLES.includes(role);
}

export function canManageProjects(role: OrganizationRole | undefined | null): boolean {
  if (!role) return false;
  return MANAGE_PROJECTS_ROLES.includes(role);
}

export function canViewFinancialDocs(role: OrganizationRole | undefined | null): boolean {
  if (!role) return false;
  return VIEW_FINANCIAL_DOCS_ROLES.includes(role);
}
