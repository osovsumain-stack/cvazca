// ─── Platform Account ───
// A single account is identified by VK ID. One person can use both Career and Business.
// Roles are separate assignments, not a single field.

export type PlatformRole = 'candidate' | 'business_member' | 'admin';

export interface PlatformAccount {
  id: string;
  vkUserId: string;        // unique VK ID, never null after VK auth
  displayName: string;
  avatarUrl: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  roles: PlatformRole[];
  createdAt: string;
  updatedAt: string;
}

export interface AccountRoleAssignment {
  id: string;
  accountId: string;
  role: PlatformRole;
  createdAt: string;
}

// ─── Candidate Profile ───
// Distinct from Organization. Used for career users (14+).

export interface CandidateProfile {
  id: string;
  accountId: string;
  firstName: string;
  lastName: string;
  middleName: string;
  birthDate: string;
  gender: string;
  city: string;
  region: string;
  relocation: string;
  phone: string;
  email: string;
  telegram: string;
  vk: string;
  photo: string;
  isMinor: boolean;
  guardianVerificationStatus: GuardianVerificationStatus;
  education: {
    level: string;
    institution: string;
    faculty: string;
    specialty: string;
    profile: string;
    course: string;
    endYear: string;
    form: string;
    gpa: string;
    achievements: string[];
  };
  opportunity: {
    types: string[];
    startWhen: string;
    hoursPerWeek: string;
    format: string;
    salary: number;
    salaryNotMain: boolean;
  };
  profession: string;
  roles: string[];
  interests: string[];
  experiences: import('../types').ExperienceItem[];
  skills: import('../types').SkillItem[];
  softSkills: { name: string; score: number }[];
  languages: import('../types').LanguageItem[];
  driverLicense: string;
  businessTrips: string;
  portfolioLinks: string[];
  priorities: string[];
  projects: string;
  achievements: string[];
  tests: import('../types').TestResult[];
  coverLetter: string;
  certificateName: string;
  certificateNumber: string;
  profileCompletion: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Organization / Business Account ───

export type OrganizationType = 'OOO' | 'IP' | 'AO' | 'ZAO' | 'NonProfit';

export interface Organization {
  createdBy?: string;
  city?: string;
  publicProfile?: { isPublished: boolean; tagline: string; benefits: string[]; values: string[]; teamSize: string; };
  id: string;
  name: string;
  type: OrganizationType;
  inn: string;
  kpp: string;
  ogrn: string;
  ogrnip: string;
  fullName: string;
  shortName: string;
  legalAddress: string;
  actualAddress: string;
  signatoryFullName: string;
  signatoryPosition: string;
  authorityType: string;
  contactEmail: string;
  contactPhone: string;
  accountingEmail: string;
  website: string;
  description: string;
  logo: string;
  industry: string;
  dataSource: 'dadata' | 'manual' | 'mixed';
  dataVerifiedAt: string | null;
  bankDetails: {
    bankName: string;
    bik: string;
    accountNumber: string;
    correspondentAccount: string;
  };
  createdAt: string;
  updatedAt: string;
}

// ─── Organization Membership ───
// Links accounts to organizations with specific roles.

export type OrganizationRole = 'owner' | 'administrator' | 'marketing_manager' | 'hr_manager' | 'accountant' | 'viewer';

export interface OrganizationMembership {
  id: string;
  organizationId: string;
  accountId: string;
  role: OrganizationRole;
  status: 'active' | 'invited' | 'revoked';
  createdAt: string;
}

// ─── Referral System ───

export type ReferralProgramType = 'business' | 'career';
export type ReferralStatus = 'pending' | 'attributed' | 'qualified' | 'cancelled';

export interface ReferralProgram {
  id: string;
  name: string;
  type: ReferralProgramType;
  description: string;
  attributionWindowDays: number;
  rewardCurrency: CurrencyType;
  baseRewardAmount: number;
  active: boolean;
  createdAt: string;
}

export interface ReferralLink {
  id: string;
  programId: string;
  referrerAccountId: string;
  code: string;
  url: string;
  createdAt: string;
  expiresAt: string | null;
}

export interface ReferralClick {
  id: string;
  linkId: string;
  visitorIp: string;
  userAgent: string;
  clickedAt: string;
  converted: boolean;
}

export interface ReferralAttribution {
  id: string;
  linkId: string;
  referrerAccountId: string;
  referredAccountId: string;
  programType: ReferralProgramType;
  status: ReferralStatus;
  attributedAt: string;
  qualifiedAt: string | null;
  expiresAt: string;
}

export interface ReferralEvent {
  id: string;
  attributionId: string;
  eventType: 'click' | 'registration' | 'qualification' | 'reward_earned' | 'reward_reversed' | 'fraud_flag';
  metadata: Record<string, unknown>;
  createdAt: string;
}

// ─── Reward System (Ledger-based) ───

export type CurrencyType = 'DIAMOND' | 'EMERALD';
export type OperationType = 'EARN' | 'SPEND' | 'REVERSE' | 'EXPIRE' | 'ADJUSTMENT';
export type TransactionStatus = 'PENDING' | 'AVAILABLE' | 'SPENT' | 'REVERSED' | 'EXPIRED';
export type SourceType = 'referral_business' | 'referral_career' | 'milestone' | 'redemption' | 'adjustment' | 'reversal';

export interface RewardWallet {
  id: string;
  accountId: string;
  currency: CurrencyType;
  cachedBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface RewardTransaction {
  id: string;
  walletId: string;
  currencyType: CurrencyType;
  operationType: OperationType;
  amount: number;
  status: TransactionStatus;
  sourceType: SourceType;
  sourceId: string;
  sourceEventId?: string | null;
  reversalOfId?: string | null;
  ruleVersion?: string | null;
  description: string;
  createdAt: string;
  availableAt: string;
  expiresAt: string | null;
}

export interface RewardRule {
  id: string;
  name: string;
  currency: CurrencyType;
  sourceType: SourceType;
  triggerEvent: string;
  amount: number;
  maxRedemptionPercent: number;
  active: boolean;
}

export interface RewardRedemption {
  id: string;
  walletId: string;
  amount: number;
  serviceType: string;
  discountApplied: number;
  status: 'pending' | 'completed' | 'reversed';
  createdAt: string;
}

// ─── Fraud Detection ───

export type FraudReason =
  | 'self_referral'
  | 'existing_account'
  | 'duplicate_vk_identity'
  | 'duplicate_account_identity'
  | 'duplicate_inn'
  | 'cancelled_order'
  | 'unpaid_order'
  | 'suspicious_pattern';

export type FraudSeverity = 'low' | 'medium' | 'high';

export interface FraudFlag {
  id: string;
  attributionId: string | null;
  accountId: string | null;
  reason: FraudReason;
  severity: FraudSeverity;
  description: string;
  status: 'FRAUD_REVIEW_REQUIRED' | 'cleared' | 'blocked';
  reviewedAt: string | null;
  reviewedBy: string | null;
  createdAt: string;
}

// ─── Vacancy (Business side) ───

export type VacancyStatus =
  | 'draft'
  | 'pending_moderation'
  | 'approved'
  | 'published'
  | 'paused'
  | 'rejected'
  | 'closed'
  | 'archived';

export type EmploymentType = 'Полная' | 'Частичная' | 'Стажировка' | 'Проектная';
export type WorkFormat = 'Офис' | 'Гибрид' | 'Удалённо';
export type Schedule = 'Полный день' | 'Сменный' | 'Гибкий' | 'Удалённая работа';
export type ExperienceLevel = 'none' | '0-1' | '1-3' | '3-6' | '6+';
export type SalaryCurrency = 'RUB' | 'USD' | 'EUR';

export interface VacancyPosting {
  id: string;
  organizationId: string;

  title: string;
  description: string;

  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];

  employmentType: EmploymentType;
  schedule: Schedule;
  workFormat: WorkFormat;

  location: string;
  city: string;

  salaryFrom: number | null;
  salaryTo: number | null;
  salaryCurrency: SalaryCurrency;
  salaryGross: boolean;

  experienceLevel: ExperienceLevel;

  skills: string[];

  suitableForMinors: boolean;
  minimumAge: number | null;

  contactPerson: string;
  contactEmail: string;

  status: VacancyStatus;

  moderationComment: string;
  moderatedBy: string | null;
  moderatedAt: string | null;

  publishedAt: string | null;
  closedAt: string | null;

  promotion?: {
    type: 'featured' | 'highlighted' | 'top';
    startsAt: string;
    endsAt: string;
    advertiserOrganizationId?: string;
    advertiserName?: string;
    erid?: string;
  };

  advertiserName?: string;
  advertiserInn?: string;
  erid?: string;
  ordProvider?: string;
  adLabelRequired?: boolean;

  createdBy: string;
  createdAt: string;
  updatedAt: string;

  views?: number;
  applicationsCount?: number;
}

export interface VacancyEvent {
  id: string;
  vacancyId: string;
  type: 'created' | 'edited' | 'submitted_for_moderation' | 'approved' | 'rejected' | 'published' | 'paused' | 'closed' | 'archived';
  actorAccountId: string;
  message: string;
  createdAt: string;
}

export interface JobApplication {
  id: string;
  vacancyId: string;
  candidateId: string;
  resumeId: string | null;
  coverLetter: string;
  readinessScore: number;
  status: 'draft' | 'sent' | 'viewed' | 'interview' | 'offer' | 'rejected' | 'withdrawn';
  sharedContacts: { email?: string; phone?: string };
  createdAt: string;
  updatedAt: string;
}

export type ApplicationEventType = 'sent' | 'viewed' | 'interview' | 'offer' | 'rejected' | 'withdrawn';

export interface ApplicationEvent {
  id: string;
  applicationId: string;
  type: ApplicationEventType;
  actorAccountId: string;
  message: string;
  createdAt: string;
}

// ─── Resume (Candidate can have multiple) ───

export interface Resume {
  desiredSalary?: number | null;
  employmentTypes?: string[];
  workFormats?: string[];
  experiences?: import('../types').ExperienceItem[];
  educationEntries?: import('../types').EducationInfo[];
  languages?: import('../types').LanguageItem[];
  portfolioLinks?: string[];
  id: string;
  candidateId: string;
  title: string;
  targetPosition: string;
  summary: string;
  experienceIds: string[];
  educationIncluded: boolean;
  skills: string[];
  isPublic: boolean;
  publicSlug: string;
  visibility: {
    showEmail: boolean;
    showPhone: boolean;
    showCity: boolean;
    showExperience: boolean;
  };
  moderationStatus?: 'pending' | 'approved' | 'rejected' | 'not_submitted';
  createdAt: string;
  updatedAt: string;
}

export interface PublicResume {
  id: string;
  publicSlug: string;
  title: string;
  targetPosition: string;
  summary: string;
  skills: string[];
  showCity: boolean;
  city?: string;
  educationIncluded: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MediaPlanItem {
  id: string;
  placementId: string;
  providerId: string;
  providerDisplayName: string;
  format: string;
  quantity: number;
  period: string;
  unitPriceKopecks: number;
  priceSnapshot: string;
  conditionsVersion: string;
}

export interface MediaPlan {
  id: string;
  accountId: string;
  organizationId: string;
  cityId: string;
  status: 'draft' | 'confirmed';
  items: MediaPlanItem[];
  quoteVersion: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Business Project ───

export type BusinessProjectType = 'advertising' | 'marketing' | 'design' | 'website' | 'ai' | 'hr' | 'other';

export type BusinessProjectStatus =
  | 'draft'
  | 'calculated'
  | 'documents'
  | 'payment_pending'
  | 'paid'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface BusinessProject {
  id: string;
  publicNumber: string;
  organizationId: string;
  type: BusinessProjectType;
  title: string;
  status: BusinessProjectStatus;
  providerAmountKopecks: number;
  platformFeeKopecks: number;
  totalAmountKopecks: number;
  pricingVersion: string | null;
  brief: BusinessProjectBrief;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessProjectBrief {
  description: string;
  city: string;
  deadline: string;
  budgetKopecks: number;
  comment: string;
  advertiserName: string;
  advertiserInn: string;
  erid: string;
  ordProvider: string;
  extra: Record<string, string>;
}

export interface BusinessProjectEvent {
  id: string;
  projectId: string;
  type: string;
  actorAccountId: string;
  message: string;
  createdAt: string;
}

// ─── Guardian Verification (for minors 14-17) ───

export type GuardianVerificationStatus = 'not_required' | 'required' | 'pending' | 'verified' | 'rejected';

export interface GuardianVerification {
  id: string;
  candidateId: string;
  guardianName: string;
  guardianRelation: string;
  guardianEmail: string;
  guardianPhone: string;
  status: GuardianVerificationStatus;
  verificationToken: string;
  consentVersion?: string;
  verificationMethod?: string | null;
  expiresAt?: string | null;
  consumedAt?: string | null;
  createdAt: string;
  sentAt: string | null;
  verifiedAt: string | null;
}

// ─── Admin Grant ───

export interface AdminGrant {
  id: string;
  vkUserId: string;
  displayName: string;
  isPrimary: boolean;
  grantedAt: string;
  grantedBy: string | null;
}

// ─── Organization Lookup (DaData) ───

export type OrganizationEntityType = 'LEGAL' | 'INDIVIDUAL';
export type OrganizationStatus = 'ACTIVE' | 'LIQUIDATING' | 'LIQUIDATED' | 'REORGANIZING' | 'BANKRUPT';

export interface OrganizationLookupResult {
  entityType: OrganizationEntityType;
  inn: string;
  kpp: string;
  ogrn: string;
  ogrnip: string;
  fullName: string;
  shortName: string;
  legalAddress: string;
  signatoryFullName: string;
  signatoryPosition: string;
  okved: string;
  organizationStatus: OrganizationStatus | null;
  branchType: string;
}

export interface BankLookupResult {
  bankName: string;
  bik: string;
  correspondentAccount: string;
  status: string | null;
}

// ─── VK ID Auth ───

export interface VkUserInfo {
  vkUserId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  phone: string;
  email: string;
}

export interface AuthSession {
  account: PlatformAccount;
  roles: PlatformRole[];
  token: string;
  expiresAt: string;
}

// ─── Partners ───

export type PartnerType = 'platform' | 'advertising' | 'career' | 'media' | 'education' | 'other';

export interface Partner {
  id: string;
  name: string;
  logoUrl?: string;
  websiteUrl: string;
  type: PartnerType;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

// ─── Organization Invitation ───

export type InvitationRole = 'administrator' | 'marketing_manager' | 'hr_manager' | 'accountant' | 'viewer';
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';

export interface OrganizationInvitation {
  id: string;
  organizationId: string;
  invitedBy: string;
  inviteeName: string;
  inviteeVkUrl: string;
  inviteeEmail: string;
  role: InvitationRole;
  status: InvitationStatus;
  inviteToken: string;
  createdAt: string;
  expiresAt: string;
}

// ─── Document ───

export type DocumentType = 'contract' | 'invoice' | 'act' | 'appendix' | 'commercial_offer' | 'brief';
export type DocumentStatus = 'draft' | 'ready' | 'signed' | 'cancelled';

export interface BusinessDocument {
  content?: string;
  id: string;
  organizationId: string;
  projectId: string | null;
  type: DocumentType;
  number: string;
  title: string;
  status: DocumentStatus;
  amount: number | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Advertising Placement ───

export type AdvertisingCategory =
  | 'outdoor'
  | 'mall_indoor'
  | 'business_centers'
  | 'transport'
  | 'elevators'
  | 'print'
  | 'promo'
  | 'internet'
  | 'vk'
  | 'telegram'
  | 'bloggers'
  | 'media'
  | 'radio'
  | 'events';

export interface AdvertisingPlacementMetrics {
  followers?: number;
  contentViews?: number;
  contentReach?: number;
  period: string;
}

export interface AdvertisingPlacement {
  id: string;
  name: string;
  category: AdvertisingCategory;
  city: string;
  format: string;
  basePrice: number;
  period: string;
  reach: number | null;
  description: string;
  imageUrl: string | null;
  providerName: string;
  providerId: string;
  requirements: string[];
  gallery: string[];
  isAvailable: boolean;
  sourceUrl?: string | null;
  audience?: string | null;
  metrics?: AdvertisingPlacementMetrics | null;
  priceNote?: string | null;
  isPilot?: boolean;
  operatorName?: string | null;
}

// ─── Service Offering ───

export type ServiceCategory =
  | 'marketing'
  | 'targeted_ads'
  | 'context_ads'
  | 'design'
  | 'branding'
  | 'websites'
  | 'seo'
  | 'content'
  | 'video'
  | 'ai_automation'
  | 'ai_agents'
  | 'hr_brand';

export interface ServiceOffering {
  id: string;
  name: string;
  category: ServiceCategory;
  shortDescription: string;
  format: string;
  estimatedCost: string;
  estimatedDuration: string;
  result: string;
  description: string;
  whatIsIncluded: string[];
  forWhom: string[];
  stages: { title: string; description: string }[];
  whatYouGet: string[];
  faq: { question: string; answer: string }[];
  sortOrder: number;
}

// ─── Favorite Vacancy ───

export interface FavoriteVacancy {
  id: string;
  accountId: string;
  vacancyId: string;
  createdAt: string;
}

// ─── Notification ───

export type NotificationType =
  | 'new_application'
  | 'vacancy_approved'
  | 'vacancy_rejected'
  | 'project_status_changed'
  | 'guardian_verified'
  | 'reward_available'
  | 'invitation_received'
  | 'document_ready';

export interface AppNotification {
  id: string;
  accountId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}

// ─── Career Test ───

export type CareerTestType = 'career_interests' | 'work_style' | 'career_priorities';

export interface CareerTest {
  id: string;
  type: CareerTestType;
  title: string;
  description: string;
  questions: { id: string; text: string; options: { id: string; text: string; scores: Record<string, number> }[] }[];
  results: { profile: string; description: string; strengths: string[]; environment: string[]; taskTypes: string[]; directions: string[]; recommendations: string[] }[];
}

export interface CareerTestResult {
  answers?: Record<string, string>;
  id: string;
  accountId: string;
  testType: CareerTestType;
  scores: Record<string, number>;
  profileName: string;
  scoringVersion: string;
  takenAt: string;
}

// ─── Consent (event-based model) ───

export type ConsentType =
  | 'personal_data'
  | 'user_terms'
  | 'public_distribution'
  | 'marketing'
  | 'business_terms'
  | 'vacancy_rules'
  | 'advertising_terms'
  | 'referral_rules';

export interface ConsentEvent {
  categories?: Record<string, boolean>;
  id: string;
  accountId: string;
  organizationId?: string | null;
  consentType: ConsentType;
  documentSlug: string;
  documentVersion: string;
  acceptedAt: string;
  withdrawnAt?: string | null;
  source: 'vk_registration' | 'business_creation' | 'vacancy_submit' | 'advertising_create' | 'resume_publish' | 'manual';
  ipAddress?: string | null;
  userAgent?: string | null;
}

// Kept for backward compatibility — aggregates active consent events
export interface ConsentRecord {
  id: string;
  accountId: string;
  acceptedAt: string;
  events: ConsentEvent[];
}

// ─── Revenue Share (процент от выручки) ───

export type RevenueShareStatus = 'proposed' | 'negotiating' | 'agreed' | 'rejected' | 'accrued' | 'settled';
export type RevenueShareTreatment = 'additional' | 'replacement_partial';
export type RevenueShareBase = 'all_revenue' | 'channel_revenue';
export type RevenueShareVatTreatment = 'vat_inclusive' | 'vat_exclusive';

export interface RevenueShareProposal {
  id: string;
  projectId: string;
  organizationId: string;
  proposedRateBps: number;
  status: RevenueShareStatus;
  treatment: RevenueShareTreatment;
  baseDefinition: RevenueShareBase;
  attributionRule: string;
  period: string;
  treatmentOfVat: RevenueShareVatTreatment;
  refundsPolicy: string;
  settlementDate: string | null;
  revenueSource: string;
  productDirection: string;
  comment: string;
  forecastRevenueKopecks: number | null;
  approvedRateBps: number | null;
  contractId: string | null;
  agreementVersion: string | null;
  proposedByAccountId: string;
  approvedByAccountId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RevenueShareAccrual {
  id: string;
  proposalId: string;
  periodStart: string;
  periodEnd: string;
  confirmedRevenueKopecks: number;
  accruedFeeKopecks: number;
  status: 'accrued' | 'settled';
  settledAt: string | null;
  createdAt: string;
}
