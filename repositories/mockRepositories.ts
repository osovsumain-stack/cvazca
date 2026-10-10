import { repositoryAdapter } from './transport';
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
} from '@/types/platform';
import type {
  IAccountRepository,
  ICandidateRepository,
  IOrganizationRepository,
  IOrganizationMembershipRepository,
  IReferralRepository,
  IRewardRepository,
  IFraudRepository,
  IVacancyRepository,
  IVacancyEventRepository,
  IApplicationRepository,
  IApplicationEventRepository,
  IResumeRepository,
  IBusinessProjectRepository,
  IProjectEventRepository,
  IGuardianVerificationRepository,
  IAdminGrantRepository,
} from './interfaces';
import { sessionRepository } from './sessionRepository';
import { projectNumberGenerator } from '@/services/projectNumberGenerator';

// ─── Storage helpers (sessionStorage-backed for DEV persistence) ───
// DEVELOPMENT-ONLY: all data is in sessionStorage so it survives F5
// but is cleared when the tab closes. In production these become Supabase/backend calls.

const STORE_PREFIX = 'svyazka_dev_';

function loadStore<T>(key: string): T[] {
  try {
    const raw = sessionStorage.getItem(STORE_PREFIX + key);
    return raw ? JSON.parse(raw) as T[] : [];
  } catch {
    return [];
  }
}

function saveStore<T>(key: string, data: T[]): void {
  try {
    sessionStorage.setItem(STORE_PREFIX + key, JSON.stringify(data));
  } catch { /* dev-only */ }
}

// ─── Mock Account Repository (sessionStorage-backed) ───

class MockAccountRepository implements IAccountRepository {
  private get accounts(): PlatformAccount[] { return loadStore<PlatformAccount>('accounts'); }
  private set accounts(v: PlatformAccount[]) { saveStore('accounts', v); }
  private get roleAssignments(): AccountRoleAssignment[] { return loadStore<AccountRoleAssignment>('roles'); }
  private set roleAssignments(v: AccountRoleAssignment[]) { saveStore('roles', v); }

  async getCurrentAccount(): Promise<PlatformAccount | null> {
    const session = sessionRepository.load();
    if (!session) return null;
    return this.accounts.find((a) => a.id === session.accountId) ?? null;
  }

  async getById(id: string): Promise<PlatformAccount | null> {
    return this.accounts.find((a) => a.id === id) ?? null;
  }

  async getAll(): Promise<PlatformAccount[]> {
    return [...this.accounts];
  }

  async getRoles(accountId: string): Promise<PlatformRole[]> {
    return this.roleAssignments.filter((r) => r.accountId === accountId).map((r) => r.role);
  }

  async assignRole(accountId: string, role: PlatformRole): Promise<void> {
    const existing = this.roleAssignments.find((r) => r.accountId === accountId && r.role === role);
    if (!existing) {
      const assignments = this.roleAssignments;
      assignments.push({ id: crypto.randomUUID(), accountId, role, createdAt: new Date().toISOString() });
      this.roleAssignments = assignments;
      sessionRepository.updateRoles(await this.getRoles(accountId));
    }
  }

  async removeRole(accountId: string, role: PlatformRole): Promise<void> {
    this.roleAssignments = this.roleAssignments.filter((r) => !(r.accountId === accountId && r.role === role));
    sessionRepository.updateRoles(await this.getRoles(accountId));
  }

  async findByVkUserId(vkUserId: string): Promise<PlatformAccount | null> {
    return this.accounts.find((a) => a.vkUserId === vkUserId) ?? null;
  }

  async createFromVk(vkInfo: VkUserInfo): Promise<PlatformAccount> {
    const accounts = this.accounts;
    let acc = accounts.find((a) => a.vkUserId === vkInfo.vkUserId);
    if (!acc) {
      acc = {
        id: crypto.randomUUID(),
        vkUserId: vkInfo.vkUserId,
        displayName: `${vkInfo.firstName} ${vkInfo.lastName}`.trim() || 'Пользователь VK',
        avatarUrl: vkInfo.avatarUrl,
        email: vkInfo.email,
        phone: vkInfo.phone,
        firstName: vkInfo.firstName,
        lastName: vkInfo.lastName,
        roles: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      accounts.push(acc);
      this.accounts = accounts;
    } else {
      const idx = accounts.findIndex((a) => a.id === acc!.id);
      acc = {
        ...acc,
        avatarUrl: vkInfo.avatarUrl || acc.avatarUrl,
        email: vkInfo.email || acc.email,
        phone: vkInfo.phone || acc.phone,
        firstName: vkInfo.firstName || acc.firstName,
        lastName: vkInfo.lastName || acc.lastName,
        updatedAt: new Date().toISOString(),
      };
      accounts[idx] = acc;
      this.accounts = accounts;
    }
    return acc;
  }

  async updateAccount(account: PlatformAccount): Promise<void> {
    const accounts = this.accounts;
    const idx = accounts.findIndex((a) => a.id === account.id);
    if (idx >= 0) accounts[idx] = { ...account, updatedAt: new Date().toISOString() };
    this.accounts = accounts;
  }

  async logout(): Promise<void> {
    // Session is cleared by sessionRepository in vkAuthService.logout()
    // Nothing extra needed here
  }
}

// ─── Mock Candidate Repository (localStorage adapter) ───

const JOURNEY_KEY = 'career-journey-v3';

function loadJourneyState(): any | null {
  try {
    const raw = localStorage.getItem(JOURNEY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveJourneyState(state: any): void {
  try {
    localStorage.setItem(JOURNEY_KEY, JSON.stringify(state));
  } catch { /* dev-only */ }
}

class MockCandidateRepository implements ICandidateRepository {
  async getProfile(accountId: string): Promise<CandidateProfile | null> {
    const state = loadJourneyState();
    if (state?.profile) {
      return { ...state.profile, accountId, id: state.profile.id || accountId };
    }
    return null;
  }

  async saveProfile(profile: CandidateProfile): Promise<void> {
    const state = loadJourneyState() || {};
    state.profile = profile;
    saveJourneyState(state);
  }

  async resetProfile(_accountId: string): Promise<void> {
    try {
      localStorage.removeItem(JOURNEY_KEY);
      localStorage.removeItem('career-journey-profile-id');
    } catch { /* dev-only */ }
  }

  getProfileCompletion(profile: CandidateProfile): number {
    let filled = 0;
    const total = 12;
    if (profile.firstName) filled++;
    if (profile.lastName) filled++;
    if (profile.city) filled++;
    if (profile.email) filled++;
    if (profile.education.institution) filled++;
    if (profile.profession) filled++;
    if (profile.interests.length >= 2) filled++;
    if (profile.experiences.length >= 1) filled++;
    if (profile.skills.length >= 3) filled++;
    if (profile.softSkills.length >= 5) filled++;
    if (profile.languages.length >= 1) filled++;
    if (profile.priorities.length >= 3) filled++;
    return Math.round((filled / total) * 100);
  }
}

// ─── Mock Organization Repository (sessionStorage-backed) ───

class MockOrganizationRepository implements IOrganizationRepository {
  private get orgs(): Organization[] { return loadStore<Organization>('orgs'); }
  private set orgs(v: Organization[]) { saveStore('orgs', v); }
  private membershipRepo = new MockOrganizationMembershipRepository();

  async getByAccountId(accountId: string): Promise<Organization[]> {
    const memberships = this.membershipRepo.getByAccount(accountId);
    const memberOrgIds = (await memberships).map((m) => m.organizationId);
    return this.orgs.filter((o) => memberOrgIds.includes(o.id));
  }

  async getById(id: string): Promise<Organization | null> {
    return this.orgs.find((o) => o.id === id) ?? null;
  }

  async getAll(): Promise<Organization[]> {
    return [...this.orgs];
  }

  async create(org: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>): Promise<Organization> {
    const now = new Date().toISOString();
    const full: Organization = { ...org, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
    const orgs = this.orgs;
    orgs.push(full);
    this.orgs = orgs;
    return full;
  }

  async update(org: Organization): Promise<void> {
    const orgs = this.orgs;
    const idx = orgs.findIndex((o) => o.id === org.id);
    if (idx >= 0) orgs[idx] = { ...org, updatedAt: new Date().toISOString() };
    this.orgs = orgs;
  }

  async getByInn(inn: string): Promise<Organization | null> {
    return this.orgs.find((o) => o.inn === inn) ?? null;
  }
}

// ─── Mock Organization Membership Repository (sessionStorage-backed) ───

class MockOrganizationMembershipRepository implements IOrganizationMembershipRepository {
  private get memberships(): OrganizationMembership[] { return loadStore<OrganizationMembership>('memberships'); }
  private set memberships(v: OrganizationMembership[]) { saveStore('memberships', v); }

  async getByAccount(accountId: string): Promise<OrganizationMembership[]> {
    return this.memberships.filter((m) => m.accountId === accountId && m.status === 'active');
  }

  async getByOrganization(orgId: string): Promise<OrganizationMembership[]> {
    return this.memberships.filter((m) => m.organizationId === orgId);
  }

  async create(membership: Omit<OrganizationMembership, 'id' | 'createdAt'>): Promise<OrganizationMembership> {
    const full: OrganizationMembership = { ...membership, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    const memberships = this.memberships;
    memberships.push(full);
    this.memberships = memberships;
    return full;
  }

  async updateRole(membershipId: string, role: OrganizationRole): Promise<void> {
    const memberships = this.memberships;
    const idx = memberships.findIndex((m) => m.id === membershipId);
    if (idx >= 0) memberships[idx] = { ...memberships[idx], role };
    this.memberships = memberships;
  }

  async remove(membershipId: string): Promise<void> {
    this.memberships = this.memberships.filter((m) => m.id !== membershipId);
  }
}

// ─── Mock Referral Repository (sessionStorage-backed) ───

class MockReferralRepository implements IReferralRepository {
  get links(): ReferralLink[] { return loadStore<ReferralLink>('ref_links'); }
  set links(v: ReferralLink[]) { saveStore('ref_links', v); }
  private get clicks(): { linkId: string; visitorIp: string; userAgent: string; clickedAt: string }[] { return loadStore('ref_clicks'); }
  private set clicks(v: { linkId: string; visitorIp: string; userAgent: string; clickedAt: string }[]) { saveStore('ref_clicks', v); }
  private get attributions(): ReferralAttribution[] { return loadStore<ReferralAttribution>('ref_attributions'); }
  private set attributions(v: ReferralAttribution[]) { saveStore('ref_attributions', v); }
  private get events(): ReferralEvent[] { return loadStore<ReferralEvent>('ref_events'); }
  private set events(v: ReferralEvent[]) { saveStore('ref_events', v); }

  async createLink(link: Omit<ReferralLink, 'id' | 'createdAt'>): Promise<ReferralLink> {
    const full: ReferralLink = { ...link, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    const links = this.links;
    links.push(full);
    this.links = links;
    return full;
  }

  async getLinksByAccount(accountId: string): Promise<ReferralLink[]> {
    return this.links.filter((l) => l.referrerAccountId === accountId);
  }

  async findByCode(code: string): Promise<ReferralLink | null> {
    return this.links.find((l) => l.code === code) ?? null;
  }

  async recordClick(linkId: string, visitorIp: string, userAgent: string): Promise<void> {
    const clicks = this.clicks;
    clicks.push({ linkId, visitorIp, userAgent, clickedAt: new Date().toISOString() });
    this.clicks = clicks;
  }

  async getClicksByLink(linkId: string): Promise<number> {
    return this.clicks.filter((c) => c.linkId === linkId).length;
  }

  async createAttribution(attr: Omit<ReferralAttribution, 'id' | 'attributedAt'>): Promise<ReferralAttribution> {
    const full: ReferralAttribution = { ...attr, id: crypto.randomUUID(), attributedAt: new Date().toISOString() };
    const attributions = this.attributions;
    attributions.push(full);
    this.attributions = attributions;
    return full;
  }

  async getAttributionsByReferrer(accountId: string): Promise<ReferralAttribution[]> {
    const linkIds = this.links.filter((l) => l.referrerAccountId === accountId).map((l) => l.id);
    return this.attributions.filter((a) => linkIds.includes(a.linkId));
  }

  async getPendingAttribution(referredAccountId: string): Promise<ReferralAttribution | null> {
    return this.attributions.find((a) => a.referredAccountId === referredAccountId && a.status === 'pending') ?? null;
  }

  async recordEvent(event: Omit<ReferralEvent, 'id' | 'createdAt'>): Promise<ReferralEvent> {
    const full: ReferralEvent = { ...event, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    const events = this.events;
    events.push(full);
    this.events = events;
    return full;
  }

  async getEventsByAttribution(attributionId: string): Promise<ReferralEvent[]> {
    return this.events.filter((e) => e.attributionId === attributionId);
  }
}

// ─── Mock Reward Repository (Ledger-based, sessionStorage-backed) ───

class MockRewardRepository implements IRewardRepository {
  private get wallets(): RewardWallet[] { return loadStore<RewardWallet>('reward_wallets'); }
  private set wallets(v: RewardWallet[]) { saveStore('reward_wallets', v); }
  private get transactions(): RewardTransaction[] { return loadStore<RewardTransaction>('reward_txs'); }
  private set transactions(v: RewardTransaction[]) { saveStore('reward_txs', v); }
  private get redemptions(): RewardRedemption[] { return loadStore<RewardRedemption>('reward_redemptions'); }
  private set redemptions(v: RewardRedemption[]) { saveStore('reward_redemptions', v); }

  async getWallets(accountId: string): Promise<RewardWallet[]> {
    return this.wallets.filter((w) => w.accountId === accountId);
  }

  async getOrCreateWallet(accountId: string, currency: 'DIAMOND' | 'EMERALD'): Promise<RewardWallet> {
    let wallet = this.wallets.find((w) => w.accountId === accountId && w.currency === currency);
    if (!wallet) {
      wallet = {
        id: crypto.randomUUID(),
        accountId,
        currency,
        cachedBalance: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const wallets = this.wallets;
      wallets.push(wallet);
      this.wallets = wallets;
    }
    return wallet;
  }

  async getTransactions(walletId: string): Promise<RewardTransaction[]> {
    return this.transactions.filter((t) => t.walletId === walletId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async addTransaction(tx: Omit<RewardTransaction, 'id' | 'createdAt'>): Promise<RewardTransaction> {
    if (tx.sourceEventId) {
      const existing = this.transactions.find(
        (t) => t.sourceEventId === tx.sourceEventId && t.operationType === tx.operationType && t.walletId === tx.walletId,
      );
      if (existing) return existing;
    }
    if (tx.reversalOfId) {
      const reversed = this.transactions.find(
        (t) => t.reversalOfId === tx.reversalOfId && t.operationType === 'REVERSE',
      );
      if (reversed) return reversed;
    }
    const full: RewardTransaction = { ...tx, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    const transactions = this.transactions;
    transactions.push(full);
    this.transactions = transactions;
    const wallet = this.wallets.find((w) => w.id === tx.walletId);
    if (wallet) {
      const wallets = this.wallets;
      const idx = wallets.findIndex((w) => w.id === tx.walletId);
      if (tx.operationType === 'EARN' && tx.status === 'AVAILABLE') wallet.cachedBalance += tx.amount;
      else if (tx.operationType === 'SPEND' && tx.status === 'SPENT') wallet.cachedBalance -= tx.amount;
      else if (tx.operationType === 'REVERSE' || tx.operationType === 'EXPIRE') wallet.cachedBalance -= tx.amount;
      else if (tx.operationType === 'ADJUSTMENT') wallet.cachedBalance += tx.amount;
      wallet.updatedAt = new Date().toISOString();
      wallets[idx] = wallet;
      this.wallets = wallets;
    }
    return full;
  }

  async computeBalance(walletId: string): Promise<number> {
    return this.transactions
      .filter((t) => t.walletId === walletId)
      .reduce((sum, t) => {
        if (t.operationType === 'EARN' || t.operationType === 'ADJUSTMENT') {
          return t.status === 'AVAILABLE' ? sum + t.amount : sum;
        }
        if (t.operationType === 'SPEND' || t.operationType === 'REVERSE' || t.operationType === 'EXPIRE') {
          return sum - t.amount;
        }
        return sum;
      }, 0);
  }

  async createRedemption(redemption: Omit<RewardRedemption, 'id' | 'createdAt'>): Promise<RewardRedemption> {
    const full: RewardRedemption = { ...redemption, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    const redemptions = this.redemptions;
    redemptions.push(full);
    this.redemptions = redemptions;
    return full;
  }

  async getRedemptions(walletId: string): Promise<RewardRedemption[]> {
    return this.redemptions.filter((r) => r.walletId === walletId);
  }
}

// ─── Mock Fraud Repository (sessionStorage-backed) ───

class MockFraudRepository implements IFraudRepository {
  private get flags(): FraudFlag[] { return loadStore<FraudFlag>('fraud_flags'); }
  private set flags(v: FraudFlag[]) { saveStore('fraud_flags', v); }

  async createFlag(flag: Omit<FraudFlag, 'id' | 'createdAt'>): Promise<FraudFlag> {
    const full: FraudFlag = { ...flag, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    const flags = this.flags;
    flags.push(full);
    this.flags = flags;
    return full;
  }

  async getFlagsByAccount(accountId: string): Promise<FraudFlag[]> {
    return this.flags.filter((f) => f.accountId === accountId);
  }

  async getFlagsByAttribution(attributionId: string): Promise<FraudFlag[]> {
    return this.flags.filter((f) => f.attributionId === attributionId);
  }
}

// ─── Mock Vacancy Repository (sessionStorage-backed) ───

class MockVacancyRepository implements IVacancyRepository {
  private get vacancies(): VacancyPosting[] { return loadStore<VacancyPosting>('vacancies'); }
  private set vacancies(v: VacancyPosting[]) { saveStore('vacancies', v); }

  async getByOrganization(orgId: string): Promise<VacancyPosting[]> {
    return this.vacancies.filter((v) => v.organizationId === orgId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getPublished(): Promise<VacancyPosting[]> {
    return this.vacancies.filter((v) => v.status === 'published');
  }

  async getById(id: string): Promise<VacancyPosting | null> {
    return this.vacancies.find((v) => v.id === id) ?? null;
  }

  async getAll(): Promise<VacancyPosting[]> {
    return [...this.vacancies].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getPendingModeration(): Promise<VacancyPosting[]> {
    return this.vacancies.filter((v) => v.status === 'pending_moderation');
  }

  async getByStatus(status: VacancyPosting['status']): Promise<VacancyPosting[]> {
    return this.vacancies.filter((v) => v.status === status);
  }

  async create(vacancy: Omit<VacancyPosting, 'id' | 'createdAt' | 'updatedAt'>): Promise<VacancyPosting> {
    const now = new Date().toISOString();
    const full: VacancyPosting = { ...vacancy, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
    const vacancies = this.vacancies;
    vacancies.push(full);
    this.vacancies = vacancies;
    return full;
  }

  async update(vacancy: VacancyPosting): Promise<void> {
    const vacancies = this.vacancies;
    const idx = vacancies.findIndex((v) => v.id === vacancy.id);
    if (idx >= 0) vacancies[idx] = { ...vacancy, updatedAt: new Date().toISOString() };
    this.vacancies = vacancies;
  }

  async submitForModeration(id: string): Promise<void> {
    const items = this.vacancies;
    const v = items.find((v) => v.id === id);
    if (v) {
      v.status = 'pending_moderation';
      v.moderationComment = '';
      v.updatedAt = new Date().toISOString();
      this.vacancies = items;
    }
  }

  async approve(id: string, adminId: string): Promise<void> {
    const items = this.vacancies;
    const v = items.find((v) => v.id === id);
    if (v) {
      v.status = 'approved';
      v.moderatedBy = adminId;
      v.moderatedAt = new Date().toISOString();
      v.updatedAt = new Date().toISOString();
      this.vacancies = items;
    }
  }

  async reject(id: string, adminId: string, comment: string): Promise<void> {
    const items = this.vacancies;
    const v = items.find((v) => v.id === id);
    if (v) {
      v.status = 'rejected';
      v.moderationComment = comment;
      v.moderatedBy = adminId;
      v.moderatedAt = new Date().toISOString();
      v.updatedAt = new Date().toISOString();
      this.vacancies = items;
    }
  }

  async publish(id: string): Promise<void> {
    const items = this.vacancies;
    const v = items.find((v) => v.id === id);
    if (v) {
      v.status = 'published';
      v.publishedAt = new Date().toISOString();
      v.updatedAt = new Date().toISOString();
      this.vacancies = items;
    }
  }

  async pause(id: string): Promise<void> {
    const items = this.vacancies;
    const v = items.find((v) => v.id === id);
    if (v) {
      v.status = 'paused';
      v.updatedAt = new Date().toISOString();
      this.vacancies = items;
    }
  }

  async close(id: string): Promise<void> {
    const items = this.vacancies;
    const v = items.find((v) => v.id === id);
    if (v) {
      v.status = 'closed';
      v.closedAt = new Date().toISOString();
      v.updatedAt = new Date().toISOString();
      this.vacancies = items;
    }
  }
}

// ─── Mock Vacancy Event Repository (sessionStorage-backed) ───

class MockVacancyEventRepository implements IVacancyEventRepository {
  private get events(): VacancyEvent[] { return loadStore<VacancyEvent>('vacancy_events'); }
  private set events(v: VacancyEvent[]) { saveStore('vacancy_events', v); }

  async getByVacancy(vacancyId: string): Promise<VacancyEvent[]> {
    return this.events.filter((e) => e.vacancyId === vacancyId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async create(event: Omit<VacancyEvent, 'id' | 'createdAt'>): Promise<VacancyEvent> {
    const full: VacancyEvent = { ...event, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    const events = this.events;
    events.push(full);
    this.events = events;
    return full;
  }
}

// ─── Mock Application Repository (sessionStorage-backed) ───

class MockApplicationRepository implements IApplicationRepository {
  private get apps(): JobApplication[] { return loadStore<JobApplication>('applications'); }
  private set apps(v: JobApplication[]) { saveStore('applications', v); }

  async getByCandidate(candidateId: string): Promise<JobApplication[]> {
    return this.apps.filter((a) => a.candidateId === candidateId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getById(id: string): Promise<JobApplication | null> {
    return this.apps.find((a) => a.id === id) ?? null;
  }

  async create(app: Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt'>): Promise<JobApplication> {
    const now = new Date().toISOString();
    const full: JobApplication = { ...app, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
    const apps = this.apps;
    apps.push(full);
    this.apps = apps;
    return full;
  }

  async update(app: JobApplication): Promise<void> {
    const apps = this.apps;
    const idx = apps.findIndex((a) => a.id === app.id);
    if (idx >= 0) apps[idx] = { ...app, updatedAt: new Date().toISOString() };
    this.apps = apps;
  }

  async getByVacancy(vacancyId: string): Promise<JobApplication[]> {
    return this.apps.filter((a) => a.vacancyId === vacancyId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getByOrganization(orgId: string): Promise<JobApplication[]> {
    const vacancyIds = vacancyRepository.getByOrganization(orgId).then((vs) => vs.map((v) => v.id));
    const ids = await vacancyIds;
    return this.apps.filter((a) => ids.includes(a.vacancyId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

// ─── Mock Resume Repository (sessionStorage-backed) ───

class MockResumeRepository implements IResumeRepository {
  private get resumes(): Resume[] { return loadStore<Resume>('resumes'); }
  private set resumes(v: Resume[]) { saveStore('resumes', v); }

  async getByCandidate(candidateId: string): Promise<Resume[]> {
    return this.resumes.filter((r) => r.candidateId === candidateId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getById(id: string): Promise<Resume | null> {
    return this.resumes.find((r) => r.id === id) ?? null;
  }

  async create(resume: Omit<Resume, 'id' | 'createdAt' | 'updatedAt'>): Promise<Resume> {
    const now = new Date().toISOString();
    const full: Resume = { ...resume, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
    const resumes = this.resumes;
    resumes.push(full);
    this.resumes = resumes;
    return full;
  }

  async update(resume: Resume): Promise<void> {
    const resumes = this.resumes;
    const idx = resumes.findIndex((r) => r.id === resume.id);
    if (idx >= 0) resumes[idx] = { ...resume, updatedAt: new Date().toISOString() };
    this.resumes = resumes;
  }

  async delete(id: string): Promise<void> {
    this.resumes = this.resumes.filter((r) => r.id !== id);
  }

  async duplicate(id: string): Promise<Resume | null> {
    const orig = await this.getById(id);
    if (!orig) return null;
    const now = new Date().toISOString();
    const copy: Resume = {
      ...orig,
      id: crypto.randomUUID(),
      title: `${orig.title} (копия)`,
      isPublic: false,
      publicSlug: '',
      createdAt: now,
      updatedAt: now,
    };
    const resumes = this.resumes;
    resumes.push(copy);
    this.resumes = resumes;
    return copy;
  }
}

// ─── Mock Business Project Repository (sessionStorage-backed) ───

class MockBusinessProjectRepository implements IBusinessProjectRepository {
  private get projects(): BusinessProject[] { return loadStore<BusinessProject>('business_projects'); }
  private set projects(v: BusinessProject[]) { saveStore('business_projects', v); }
  private membershipRepo = new MockOrganizationMembershipRepository();

  async getByOrganization(orgId: string): Promise<BusinessProject[]> {
    return this.projects.filter((p) => p.organizationId === orgId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getAll(): Promise<BusinessProject[]> {
    return [...this.projects].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getByAccountOrganizations(accountId: string): Promise<BusinessProject[]> {
    const memberships = await this.membershipRepo.getByAccount(accountId);
    const orgIds = memberships.map((m) => m.organizationId);
    return this.projects.filter((p) => orgIds.includes(p.organizationId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getById(id: string): Promise<BusinessProject | null> {
    return this.projects.find((p) => p.id === id) ?? null;
  }

  async create(project: Omit<BusinessProject, 'id' | 'createdAt' | 'updatedAt' | 'publicNumber'>): Promise<BusinessProject> {
    const now = new Date().toISOString();
    const existing = this.projects;
    const seq = existing.length + 1;
    const publicNumber = projectNumberGenerator.generate(existing.length);
    const full: BusinessProject = { ...project, publicNumber, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
    const projects = this.projects;
    projects.push(full);
    this.projects = projects;
    return full;
  }

  async update(project: BusinessProject): Promise<void> {
    const projects = this.projects;
    const idx = projects.findIndex((p) => p.id === project.id);
    if (idx >= 0) projects[idx] = { ...project, updatedAt: new Date().toISOString() };
    this.projects = projects;
  }
}

// ─── Mock Project Event Repository (sessionStorage-backed) ───

class MockProjectEventRepository implements IProjectEventRepository {
  private get events(): BusinessProjectEvent[] { return loadStore<BusinessProjectEvent>('project_events'); }
  private set events(v: BusinessProjectEvent[]) { saveStore('project_events', v); }

  async getByProject(projectId: string): Promise<BusinessProjectEvent[]> {
    return this.events.filter((e) => e.projectId === projectId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async create(event: Omit<BusinessProjectEvent, 'id' | 'createdAt'>): Promise<BusinessProjectEvent> {
    const full: BusinessProjectEvent = { ...event, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    const events = this.events;
    events.push(full);
    this.events = events;
    return full;
  }
}

// ─── Mock Application Event Repository (sessionStorage-backed) ───

class MockApplicationEventRepository implements IApplicationEventRepository {
  private get events(): ApplicationEvent[] { return loadStore<ApplicationEvent>('application_events'); }
  private set events(v: ApplicationEvent[]) { saveStore('application_events', v); }

  async getByApplication(applicationId: string): Promise<ApplicationEvent[]> {
    return this.events.filter((e) => e.applicationId === applicationId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async create(event: Omit<ApplicationEvent, 'id' | 'createdAt'>): Promise<ApplicationEvent> {
    const full: ApplicationEvent = { ...event, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    const events = this.events;
    events.push(full);
    this.events = events;
    return full;
  }
}

// ─── Mock Guardian Verification Repository (sessionStorage-backed) ───

class MockGuardianVerificationRepository implements IGuardianVerificationRepository {
  private get records(): GuardianVerification[] { return loadStore<GuardianVerification>('guardian_verifications'); }
  private set records(v: GuardianVerification[]) { saveStore('guardian_verifications', v); }

  async getByCandidate(candidateId: string): Promise<GuardianVerification | null> {
    return this.records.filter((r) => r.candidateId === candidateId).sort((a,b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
  }

  async getByToken(token: string): Promise<GuardianVerification | null> {
    const record = this.records.find((r) => r.verificationToken === token);
    if (!record) return null;
    if (record.expiresAt && new Date(record.expiresAt) < new Date()) {
      if (record.status === 'pending') {
        await this.updateStatus(record.id, 'rejected');
      }
      return null;
    }
    if (record.consumedAt) return null;
    return record;
  }

  async create(verification: Omit<GuardianVerification, 'id' | 'createdAt'>): Promise<GuardianVerification> {
    const expiresAt = verification.expiresAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const full: GuardianVerification = { ...verification, expiresAt, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    const records = this.records;
    records.push(full);
    this.records = records;
    return full;
  }

  async updateStatus(id: string, status: GuardianVerification['status'], verifiedAt?: string): Promise<void> {
    const records = this.records;
    const idx = records.findIndex((r) => r.id === id);
    if (idx >= 0) {
      const consumedAt = status === 'verified' || status === 'rejected' ? new Date().toISOString() : records[idx].consumedAt ?? null;
      records[idx] = { ...records[idx], status, verifiedAt: verifiedAt ?? (status === 'verified' ? new Date().toISOString() : null), consumedAt };
      this.records = records;
    }
  }
}

// ─── Mock Admin Grant Repository (DEV fallback) ───
// DEVELOPMENT-ONLY: The INITIAL_ADMIN_VK_IDS allowlist is a DEV convenience
// and is NOT secure for production. In production, admin roles are assigned
// server-side via Supabase RLS / SECURITY DEFINER functions.

const INITIAL_ADMIN_VK_IDS: string[] = [];

class MockAdminGrantRepository implements IAdminGrantRepository {
  private get grants(): AdminGrant[] { return loadStore<AdminGrant>('admin_grants'); }
  private set grants(v: AdminGrant[]) { saveStore('admin_grants', v); }

  async getAll(): Promise<AdminGrant[]> {
    const stored = this.grants;
    // Merge DEV fallback for primary admin if not already in store
    const hasPrimary = stored.some((g) => g.vkUserId === INITIAL_ADMIN_VK_IDS[0]);
    if (!hasPrimary && INITIAL_ADMIN_VK_IDS[0]) {
      const devGrant: AdminGrant = {
        id: crypto.randomUUID(),
        vkUserId: INITIAL_ADMIN_VK_IDS[0],
        displayName: 'Primary Admin (DEV)',
        isPrimary: true,
        grantedAt: new Date().toISOString(),
        grantedBy: null,
      };
      const all = [...stored, devGrant];
      this.grants = all;
      return all;
    }
    return stored;
  }

  async getByVkUserId(vkUserId: string): Promise<AdminGrant | null> {
    const all = await this.getAll();
    return all.find((g) => g.vkUserId === vkUserId) ?? null;
  }

  async grant(vkUserId: string, displayName: string, grantedBy: string | null): Promise<AdminGrant> {
    const existing = await this.getByVkUserId(vkUserId);
    if (existing) return existing;
    const full: AdminGrant = {
      id: crypto.randomUUID(),
      vkUserId,
      displayName,
      isPrimary: false,
      grantedAt: new Date().toISOString(),
      grantedBy,
    };
    const grants = this.grants;
    grants.push(full);
    this.grants = grants;
    return full;
  }

  async revoke(id: string): Promise<void> {
    const grants = this.grants;
    const target = grants.find((g) => g.id === id);
    if (target?.isPrimary) return;
    this.grants = grants.filter((g) => g.id !== id);
  }

  getPrimaryAdminVkIds(): string[] {
    return [...INITIAL_ADMIN_VK_IDS];
  }
}

// ─── Seed demo vacancies (DEV-only, call explicitly) ───

export function seedDemoVacancies(): void {
  const existing = loadStore<VacancyPosting>('vacancies');
  if (existing.length > 0) return;
  const now = new Date().toISOString();
  const demo: VacancyPosting[] = [
    { id: crypto.randomUUID(), organizationId: 'demo-org-1', title: 'Стажёр-аналитик данных', description: 'Аналитика данных, работа с Python и SQL', responsibilities: ['Сбор и анализ данных', 'Подготовка отчётов'], requirements: ['Python', 'SQL', 'Excel'], niceToHave: ['Pandas', 'BI-инструменты'], employmentType: 'Стажировка', schedule: 'Полный день', workFormat: 'Гибрид', location: 'Москва', city: 'Москва', salaryFrom: 45000, salaryTo: 60000, salaryCurrency: 'RUB', salaryGross: false, experienceLevel: 'none', skills: ['Python', 'SQL', 'Excel'], suitableForMinors: false, minimumAge: null, contactPerson: 'HR отдел', contactEmail: 'hr@demo.ru', status: 'published', moderationComment: '', moderatedBy: null, moderatedAt: null, publishedAt: now, closedAt: null, createdBy: 'demo', createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), organizationId: 'demo-org-1', title: 'Junior frontend-разработчик', description: 'Разработка на React, TypeScript', responsibilities: ['Разработка UI-компонентов', 'Интеграция с API'], requirements: ['JavaScript', 'React', 'HTML/CSS'], niceToHave: ['TypeScript', 'Next.js'], employmentType: 'Полная', schedule: 'Полный день', workFormat: 'Удалённо', location: 'Удалённо', city: 'Москва', salaryFrom: 60000, salaryTo: 90000, salaryCurrency: 'RUB', salaryGross: false, experienceLevel: '0-1', skills: ['JavaScript', 'React', 'HTML/CSS'], suitableForMinors: false, minimumAge: null, contactPerson: 'HR отдел', contactEmail: 'hr@demo.ru', status: 'published', moderationComment: '', moderatedBy: null, moderatedAt: null, publishedAt: now, closedAt: null, createdBy: 'demo', createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), organizationId: 'demo-org-1', title: 'Ассистент маркетолога', description: 'Помощь маркетинговой команде', responsibilities: ['SMM', 'Контент-план', 'Аналитика'], requirements: ['SMM', 'Копирайтинг', 'Аналитика'], niceToHave: ['Tilda', 'Figma'], employmentType: 'Стажировка', schedule: 'Полный день', workFormat: 'Офис', location: 'Москва', city: 'Москва', salaryFrom: 40000, salaryTo: 50000, salaryCurrency: 'RUB', salaryGross: false, experienceLevel: 'none', skills: ['SMM', 'Копирайтинг', 'Аналитика'], suitableForMinors: true, minimumAge: 16, contactPerson: 'HR отдел', contactEmail: 'hr@demo.ru', status: 'published', moderationComment: '', moderatedBy: null, moderatedAt: null, publishedAt: now, closedAt: null, createdBy: 'demo', createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), organizationId: 'demo-org-1', title: 'Младший продуктовый дизайнер', description: 'UI/UX дизайн в Figma', responsibilities: ['Прототипирование', 'Дизайн интерфейсов'], requirements: ['Figma', 'UI/UX', 'Прототипирование'], niceToHave: ['Motion-дизайн'], employmentType: 'Стажировка', schedule: 'Гибкий', workFormat: 'Удалённо', location: 'Удалённо', city: 'Санкт-Петербург', salaryFrom: 50000, salaryTo: 70000, salaryCurrency: 'RUB', salaryGross: false, experienceLevel: '0-1', skills: ['Figma', 'UI/UX', 'Прототипирование'], suitableForMinors: false, minimumAge: null, contactPerson: 'HR отдел', contactEmail: 'hr@demo.ru', status: 'published', moderationComment: '', moderatedBy: null, moderatedAt: null, publishedAt: now, closedAt: null, createdBy: 'demo', createdAt: now, updatedAt: now },
    { id: crypto.randomUUID(), organizationId: 'demo-org-1', title: 'Помощник HR-менеджера', description: 'Рекрутинг и onboarding', responsibilities: ['Скрининг резюме', 'Организация собеседований'], requirements: ['Коммуникация', 'Excel'], niceToHave: ['ATS-системы'], employmentType: 'Частичная', schedule: 'Гибкий', workFormat: 'Гибрид', location: 'Москва', city: 'Москва', salaryFrom: 42000, salaryTo: 55000, salaryCurrency: 'RUB', salaryGross: false, experienceLevel: 'none', skills: ['Коммуникация', 'Excel'], suitableForMinors: true, minimumAge: 18, contactPerson: 'HR отдел', contactEmail: 'hr@demo.ru', status: 'published', moderationComment: '', moderatedBy: null, moderatedAt: null, publishedAt: now, closedAt: null, createdBy: 'demo', createdAt: now, updatedAt: now },
  ];
  saveStore('vacancies', demo);
}

// ─── Export singletons ───

export const accountRepository: IAccountRepository = repositoryAdapter("account", new MockAccountRepository());
export const candidateRepository: ICandidateRepository = repositoryAdapter("candidate", new MockCandidateRepository());
export const organizationRepository: IOrganizationRepository = repositoryAdapter("organization", new MockOrganizationRepository());
export const organizationMembershipRepository: IOrganizationMembershipRepository = repositoryAdapter("organizationMembership", new MockOrganizationMembershipRepository());
export const referralRepository: IReferralRepository = repositoryAdapter("referral", new MockReferralRepository());
export const rewardRepository: IRewardRepository = repositoryAdapter("reward", new MockRewardRepository());
export const fraudRepository: IFraudRepository = repositoryAdapter("fraud", new MockFraudRepository());
export const vacancyRepository: IVacancyRepository = repositoryAdapter("vacancy", new MockVacancyRepository());
export const vacancyEventRepository: IVacancyEventRepository = repositoryAdapter("vacancyEvent", new MockVacancyEventRepository());
export const applicationRepository: IApplicationRepository = repositoryAdapter("application", new MockApplicationRepository());
export const resumeRepository: IResumeRepository = repositoryAdapter("resume", new MockResumeRepository());
export const businessProjectRepository: IBusinessProjectRepository = repositoryAdapter("businessProject", new MockBusinessProjectRepository());
export const projectEventRepository: IProjectEventRepository = repositoryAdapter("projectEvent", new MockProjectEventRepository());
export const applicationEventRepository: IApplicationEventRepository = repositoryAdapter("applicationEvent", new MockApplicationEventRepository());
export const guardianVerificationRepository: IGuardianVerificationRepository = repositoryAdapter("guardianVerification", new MockGuardianVerificationRepository());
export const adminGrantRepository: IAdminGrantRepository = repositoryAdapter("adminGrant", new MockAdminGrantRepository());
