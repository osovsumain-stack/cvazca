import type {
  PlatformAccount,
  PlatformRole,
  AccountRoleAssignment,
  CandidateProfile,
  Organization,
  OrganizationMembership,
  OrganizationRole,
  ReferralLink,
  ReferralAttribution,
  ReferralEvent,
  RewardWallet,
  RewardTransaction,
  RewardRedemption,
  FraudFlag,
  VacancyPosting,
  VacancyEvent,
  JobApplication,
  ApplicationEvent,
  Resume,
  BusinessProject,
  BusinessProjectEvent,
  GuardianVerification,
  AdminGrant,
  VkUserInfo,
  Partner,
  OrganizationInvitation,
  BusinessDocument,
  AdvertisingPlacement,
  ServiceOffering,
  FavoriteVacancy,
  AppNotification,
  CareerTest,
  CareerTestResult,
  ConsentRecord,
  ConsentEvent,
  ConsentType,
} from '@/types/platform';

// ─── Repository Interfaces ───

export interface IAccountRepository {
  getCurrentAccount(): Promise<PlatformAccount | null>;
  getById(id: string): Promise<PlatformAccount | null>;
  getAll(): Promise<PlatformAccount[]>;
  getRoles(accountId: string): Promise<PlatformRole[]>;
  assignRole(accountId: string, role: PlatformRole): Promise<void>;
  removeRole(accountId: string, role: PlatformRole): Promise<void>;
  findByVkUserId(vkUserId: string): Promise<PlatformAccount | null>;
  createFromVk(vkInfo: VkUserInfo): Promise<PlatformAccount>;
  updateAccount(account: PlatformAccount): Promise<void>;
  logout(): Promise<void>;
}

export interface ICandidateRepository {
  getProfile(accountId: string): Promise<CandidateProfile | null>;
  saveProfile(profile: CandidateProfile): Promise<void>;
  getProfileCompletion(profile: CandidateProfile): number;
  resetProfile(accountId: string): Promise<void>;
}

export interface IOrganizationRepository {
  getByAccountId(accountId: string): Promise<Organization[]>;
  getById(id: string): Promise<Organization | null>;
  getAll(): Promise<Organization[]>;
  create(org: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>): Promise<Organization>;
  update(org: Organization): Promise<void>;
  getByInn(inn: string): Promise<Organization | null>;
}

export interface IOrganizationMembershipRepository {
  getByAccount(accountId: string): Promise<OrganizationMembership[]>;
  getByOrganization(orgId: string): Promise<OrganizationMembership[]>;
  create(membership: Omit<OrganizationMembership, 'id' | 'createdAt'>): Promise<OrganizationMembership>;
  updateRole(membershipId: string, role: OrganizationRole): Promise<void>;
  remove(membershipId: string): Promise<void>;
}

export interface IReferralRepository {
  createLink(link: Omit<ReferralLink, 'id' | 'createdAt'>): Promise<ReferralLink>;
  getLinksByAccount(accountId: string): Promise<ReferralLink[]>;
  findByCode(code: string): Promise<ReferralLink | null>;
  recordClick(linkId: string, visitorIp: string, userAgent: string): Promise<void>;
  getClicksByLink(linkId: string): Promise<number>;
  createAttribution(attr: Omit<ReferralAttribution, 'id' | 'attributedAt'>): Promise<ReferralAttribution>;
  getAttributionsByReferrer(accountId: string): Promise<ReferralAttribution[]>;
  getPendingAttribution(referredAccountId: string): Promise<ReferralAttribution | null>;
  recordEvent(event: Omit<ReferralEvent, 'id' | 'createdAt'>): Promise<ReferralEvent>;
  getEventsByAttribution(attributionId: string): Promise<ReferralEvent[]>;
}

export interface IRewardRepository {
  getWallets(accountId: string): Promise<RewardWallet[]>;
  getOrCreateWallet(accountId: string, currency: 'DIAMOND' | 'EMERALD'): Promise<RewardWallet>;
  getTransactions(walletId: string): Promise<RewardTransaction[]>;
  addTransaction(tx: Omit<RewardTransaction, 'id' | 'createdAt'>): Promise<RewardTransaction>;
  computeBalance(walletId: string): Promise<number>;
  createRedemption(redemption: Omit<RewardRedemption, 'id' | 'createdAt'>): Promise<RewardRedemption>;
  getRedemptions(walletId: string): Promise<RewardRedemption[]>;
}

export interface IFraudRepository {
  createFlag(flag: Omit<FraudFlag, 'id' | 'createdAt'>): Promise<FraudFlag>;
  getFlagsByAccount(accountId: string): Promise<FraudFlag[]>;
  getFlagsByAttribution(attributionId: string): Promise<FraudFlag[]>;
}

export interface IVacancyRepository {
  getByOrganization(orgId: string): Promise<VacancyPosting[]>;
  getPublished(): Promise<VacancyPosting[]>;
  getById(id: string): Promise<VacancyPosting | null>;
  create(vacancy: Omit<VacancyPosting, 'id' | 'createdAt' | 'updatedAt'>): Promise<VacancyPosting>;
  update(vacancy: VacancyPosting): Promise<void>;
  submitForModeration(id: string): Promise<void>;
  approve(id: string, adminId: string): Promise<void>;
  reject(id: string, adminId: string, comment: string): Promise<void>;
  publish(id: string): Promise<void>;
  pause(id: string): Promise<void>;
  close(id: string): Promise<void>;
  getAll(): Promise<VacancyPosting[]>;
  getPendingModeration(): Promise<VacancyPosting[]>;
  getByStatus(status: VacancyPosting['status']): Promise<VacancyPosting[]>;
}

export interface IVacancyEventRepository {
  getByVacancy(vacancyId: string): Promise<VacancyEvent[]>;
  create(event: Omit<VacancyEvent, 'id' | 'createdAt'>): Promise<VacancyEvent>;
}

export interface IApplicationRepository {
  getByCandidate(candidateId: string): Promise<JobApplication[]>;
  create(app: Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt'>): Promise<JobApplication>;
  update(app: JobApplication): Promise<void>;
  getByVacancy(vacancyId: string): Promise<JobApplication[]>;
  getByOrganization(orgId: string): Promise<JobApplication[]>;
  getById(id: string): Promise<JobApplication | null>;
}

export interface IApplicationEventRepository {
  getByApplication(applicationId: string): Promise<ApplicationEvent[]>;
  create(event: Omit<ApplicationEvent, 'id' | 'createdAt'>): Promise<ApplicationEvent>;
}

export interface IResumeRepository {
  getByCandidate(candidateId: string): Promise<Resume[]>;
  getById(id: string): Promise<Resume | null>;
  create(resume: Omit<Resume, 'id' | 'createdAt' | 'updatedAt'>): Promise<Resume>;
  update(resume: Resume): Promise<void>;
  delete(id: string): Promise<void>;
  duplicate(id: string): Promise<Resume | null>;
}

export interface IBusinessProjectRepository {
  getByOrganization(orgId: string): Promise<BusinessProject[]>;
  getByAccountOrganizations(accountId: string): Promise<BusinessProject[]>;
  getAll(): Promise<BusinessProject[]>;
  getById(id: string): Promise<BusinessProject | null>;
  create(project: Omit<BusinessProject, 'id' | 'createdAt' | 'updatedAt' | 'publicNumber'>): Promise<BusinessProject>;
  update(project: BusinessProject): Promise<void>;
}

export interface IProjectEventRepository {
  getByProject(projectId: string): Promise<BusinessProjectEvent[]>;
  create(event: Omit<BusinessProjectEvent, 'id' | 'createdAt'>): Promise<BusinessProjectEvent>;
}

export interface IGuardianVerificationRepository {
  getByCandidate(candidateId: string): Promise<GuardianVerification | null>;
  getByToken(token: string): Promise<GuardianVerification | null>;
  create(verification: Omit<GuardianVerification, 'id' | 'createdAt'>): Promise<GuardianVerification>;
  updateStatus(id: string, status: GuardianVerification['status'], verifiedAt?: string): Promise<void>;
}

export interface IAdminGrantRepository {
  getAll(): Promise<AdminGrant[]>;
  getByVkUserId(vkUserId: string): Promise<AdminGrant | null>;
  grant(vkUserId: string, displayName: string, grantedBy: string | null): Promise<AdminGrant>;
  revoke(id: string): Promise<void>;
  getPrimaryAdminVkIds(): string[];
}

export interface IPartnerRepository {
  getAll(): Promise<Partner[]>;
  getActive(): Promise<Partner[]>;
  create(partner: Omit<Partner, 'id'>): Promise<Partner>;
  update(partner: Partner): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface IOrganizationInvitationRepository {
  getByOrganization(orgId: string): Promise<OrganizationInvitation[]>;
  getByAccount(accountId: string): Promise<OrganizationInvitation[]>;
  create(invitation: Omit<OrganizationInvitation, 'id' | 'createdAt' | 'inviteToken' | 'expiresAt'>): Promise<OrganizationInvitation>;
  updateStatus(id: string, status: OrganizationInvitation['status']): Promise<void>;
  getByToken(token: string): Promise<OrganizationInvitation | null>;
}

export interface IDocumentRepository {
  getByOrganization(orgId: string): Promise<BusinessDocument[]>;
  getByProject(projectId: string): Promise<BusinessDocument[]>;
  getById(id: string): Promise<BusinessDocument | null>;
  create(doc: Omit<BusinessDocument, 'id' | 'createdAt' | 'updatedAt'>): Promise<BusinessDocument>;
  update(doc: BusinessDocument): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface IAdvertisingRepository {
  getAll(): Promise<AdvertisingPlacement[]>;
  getById(id: string): Promise<AdvertisingPlacement | null>;
  getByCategory(category: AdvertisingPlacement['category']): Promise<AdvertisingPlacement[]>;
}

export interface IServiceOfferingRepository {
  getAll(): Promise<ServiceOffering[]>;
  getById(id: string): Promise<ServiceOffering | null>;
  getByCategory(category: ServiceOffering['category']): Promise<ServiceOffering[]>;
}

export interface IFavoriteVacancyRepository {
  getByAccount(accountId: string): Promise<FavoriteVacancy[]>;
  toggle(accountId: string, vacancyId: string): Promise<boolean>;
  isFavorite(accountId: string, vacancyId: string): Promise<boolean>;
  remove(accountId: string, vacancyId: string): Promise<void>;
}

export interface INotificationRepository {
  getByAccount(accountId: string): Promise<AppNotification[]>;
  getUnreadCount(accountId: string): Promise<number>;
  create(notification: Omit<AppNotification, 'id' | 'createdAt'>): Promise<AppNotification>;
  markRead(id: string): Promise<void>;
  markAllRead(accountId: string): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface ICareerTestRepository {
  getAll(): Promise<CareerTest[]>;
  getByType(type: CareerTest['type']): Promise<CareerTest | null>;
  getResult(accountId: string, testType: CareerTest['type']): Promise<CareerTestResult | null>;
  canRetake(accountId: string, testType: CareerTest['type']): Promise<{ allowed: boolean; daysLeft: number }>;
  saveResult(result: Omit<CareerTestResult, 'id' | 'takenAt'>): Promise<CareerTestResult>;
}

export interface IConsentRepository {
  getEvents(accountId: string): Promise<ConsentEvent[]>;
  getActiveByType(accountId: string, consentType: ConsentType): Promise<ConsentEvent | null>;
  hasAccepted(accountId: string, consentType: ConsentType): Promise<boolean>;
  recordAcceptance(params: {
    accountId: string;
    consentType: ConsentType;
    documentSlug: string;
    documentVersion: string;
    categories?: Record<string, boolean>;
    organizationId?: string | null;
    source: ConsentEvent['source'];
  }): Promise<ConsentEvent>;
  withdraw(accountId: string, consentType: ConsentType): Promise<void>;
  getByOrganization(orgId: string): Promise<ConsentEvent[]>;
}
