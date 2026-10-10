import { consentRepository } from '@/repositories/featureRepositories';
import type { ConsentType } from '@/types/platform';
import { getLegalDocument } from '@/data/legalDocuments';

export interface ConsentChecklistItem {
  consentType: ConsentType;
  documentSlug: string;
  label: string;
  required: boolean;
}

export const REGISTRATION_CONSENT_ITEMS: ConsentChecklistItem[] = [
  {
    consentType: 'user_terms',
    documentSlug: 'terms',
    label: 'Я принимаю Пользовательское соглашение',
    required: true,
  },
  {
    consentType: 'personal_data',
    documentSlug: 'personal-data-consent',
    label: 'Я даю согласие на обработку персональных данных',
    required: true,
  },
  {
    consentType: 'marketing',
    documentSlug: 'marketing-consent',
    label: 'Хочу получать новости и предложения СВЯЗКИ',
    required: false,
  },
];

export async function recordRegistrationConsent(
  accountId: string,
  accepted: { user_terms: boolean; personal_data: boolean; marketing: boolean },
): Promise<void> {
  for (const item of REGISTRATION_CONSENT_ITEMS) {
    if (!accepted[item.consentType as 'user_terms' | 'personal_data' | 'marketing']) continue;
    const doc = getLegalDocument(item.documentSlug);
    await consentRepository.recordAcceptance({
      accountId,
      consentType: item.consentType,
      documentSlug: item.documentSlug,
      documentVersion: doc?.version ?? '1.0-draft',
      source: 'vk_registration',
    });
  }
}

export async function hasRegistrationConsent(accountId: string): Promise<boolean> {
  const userTerms = await consentRepository.hasAccepted(accountId, 'user_terms');
  const personalData = await consentRepository.hasAccepted(accountId, 'personal_data');
  return userTerms && personalData;
}

export async function recordBusinessTermsAcceptance(accountId: string, organizationId?: string): Promise<void> {
  const doc = getLegalDocument('business');
  await consentRepository.recordAcceptance({
    accountId,
    consentType: 'business_terms',
    documentSlug: 'business',
    documentVersion: doc?.version ?? '1.0-draft',
    organizationId: organizationId ?? null,
    source: 'business_creation',
  });
}

export async function hasBusinessTermsAccepted(accountId: string): Promise<boolean> {
  return consentRepository.hasAccepted(accountId, 'business_terms');
}

export async function recordVacancyRulesAcceptance(accountId: string, organizationId: string): Promise<void> {
  const doc = getLegalDocument('vacancies');
  await consentRepository.recordAcceptance({
    accountId,
    consentType: 'vacancy_rules',
    documentSlug: 'vacancies',
    documentVersion: doc?.version ?? '1.0-draft',
    organizationId,
    source: 'vacancy_submit',
  });
}

export async function hasVacancyRulesAccepted(accountId: string): Promise<boolean> {
  return consentRepository.hasAccepted(accountId, 'vacancy_rules');
}

export async function recordAdvertisingTermsAcceptance(accountId: string, organizationId: string): Promise<void> {
  const doc = getLegalDocument('advertising');
  await consentRepository.recordAcceptance({
    accountId,
    consentType: 'advertising_terms',
    documentSlug: 'advertising',
    documentVersion: doc?.version ?? '1.0-draft',
    organizationId,
    source: 'advertising_create',
  });
}

export async function hasAdvertisingTermsAccepted(accountId: string): Promise<boolean> {
  return consentRepository.hasAccepted(accountId, 'advertising_terms');
}

export async function recordPublicDistributionConsent(
  accountId: string,
  categories: { name: boolean; photo: boolean; city: boolean; education: boolean; experience: boolean; skills: boolean; careerGoal: boolean; phone: boolean; email: boolean; birthDate: boolean },
): Promise<void> {
  const doc = getLegalDocument('public-data-consent');
  await consentRepository.recordAcceptance({
    accountId,
    consentType: 'public_distribution',
    documentSlug: 'public-data-consent',
    documentVersion: doc?.version ?? '1.0-draft',
    source: 'resume_publish',
    categories,
  });
}

export async function hasPublicDistributionConsent(accountId: string): Promise<boolean> {
  return consentRepository.hasAccepted(accountId, 'public_distribution');
}
