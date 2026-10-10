import { repositoryAdapter } from './transport.js';
import { sessionRepository } from './sessionRepository.js';
import { projectNumberGenerator } from '../services/projectNumberGenerator.js';
// ─── Storage helpers (sessionStorage-backed for DEV persistence) ───
// DEVELOPMENT-ONLY: all data is in sessionStorage so it survives F5
// but is cleared when the tab closes. In production these become Supabase/backend calls.
const STORE_PREFIX = 'svyazka_dev_';
function loadStore(key) {
    try {
        const raw = sessionStorage.getItem(STORE_PREFIX + key);
        return raw ? JSON.parse(raw) : [];
    }
    catch {
        return [];
    }
}
function saveStore(key, data) {
    try {
        sessionStorage.setItem(STORE_PREFIX + key, JSON.stringify(data));
    }
    catch { /* dev-only */ }
}
// ─── Mock Account Repository (sessionStorage-backed) ───
class MockAccountRepository {
    get accounts() { return loadStore('accounts'); }
    set accounts(v) { saveStore('accounts', v); }
    get roleAssignments() { return loadStore('roles'); }
    set roleAssignments(v) { saveStore('roles', v); }
    async getCurrentAccount() {
        const session = sessionRepository.load();
        if (!session)
            return null;
        return this.accounts.find((a) => a.id === session.accountId) ?? null;
    }
    async getById(id) {
        return this.accounts.find((a) => a.id === id) ?? null;
    }
    async getAll() {
        return [...this.accounts];
    }
    async getRoles(accountId) {
        return this.roleAssignments.filter((r) => r.accountId === accountId).map((r) => r.role);
    }
    async assignRole(accountId, role) {
        const existing = this.roleAssignments.find((r) => r.accountId === accountId && r.role === role);
        if (!existing) {
            const assignments = this.roleAssignments;
            assignments.push({ id: crypto.randomUUID(), accountId, role, createdAt: new Date().toISOString() });
            this.roleAssignments = assignments;
            sessionRepository.updateRoles(await this.getRoles(accountId));
        }
    }
    async removeRole(accountId, role) {
        this.roleAssignments = this.roleAssignments.filter((r) => !(r.accountId === accountId && r.role === role));
        sessionRepository.updateRoles(await this.getRoles(accountId));
    }
    async findByVkUserId(vkUserId) {
        return this.accounts.find((a) => a.vkUserId === vkUserId) ?? null;
    }
    async createFromVk(vkInfo) {
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
        }
        else {
            const idx = accounts.findIndex((a) => a.id === acc.id);
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
    async updateAccount(account) {
        const accounts = this.accounts;
        const idx = accounts.findIndex((a) => a.id === account.id);
        if (idx >= 0)
            accounts[idx] = { ...account, updatedAt: new Date().toISOString() };
        this.accounts = accounts;
    }
    async logout() {
        // Session is cleared by sessionRepository in vkAuthService.logout()
        // Nothing extra needed here
    }
}
// ─── Mock Candidate Repository (localStorage adapter) ───
const JOURNEY_KEY = 'career-journey-v3';
function loadJourneyState() {
    try {
        const raw = localStorage.getItem(JOURNEY_KEY);
        return raw ? JSON.parse(raw) : null;
    }
    catch {
        return null;
    }
}
function saveJourneyState(state) {
    try {
        localStorage.setItem(JOURNEY_KEY, JSON.stringify(state));
    }
    catch { /* dev-only */ }
}
class MockCandidateRepository {
    async getProfile(accountId) {
        const state = loadJourneyState();
        if (state?.profile) {
            return { ...state.profile, accountId, id: state.profile.id || accountId };
        }
        return null;
    }
    async saveProfile(profile) {
        const state = loadJourneyState() || {};
        state.profile = profile;
        saveJourneyState(state);
    }
    async resetProfile(_accountId) {
        try {
            localStorage.removeItem(JOURNEY_KEY);
            localStorage.removeItem('career-journey-profile-id');
        }
        catch { /* dev-only */ }
    }
    getProfileCompletion(profile) {
        let filled = 0;
        const total = 12;
        if (profile.firstName)
            filled++;
        if (profile.lastName)
            filled++;
        if (profile.city)
            filled++;
        if (profile.email)
            filled++;
        if (profile.education.institution)
            filled++;
        if (profile.profession)
            filled++;
        if (profile.interests.length >= 2)
            filled++;
        if (profile.experiences.length >= 1)
            filled++;
        if (profile.skills.length >= 3)
            filled++;
        if (profile.softSkills.length >= 5)
            filled++;
        if (profile.languages.length >= 1)
            filled++;
        if (profile.priorities.length >= 3)
            filled++;
        return Math.round((filled / total) * 100);
    }
}
// ─── Mock Organization Repository (sessionStorage-backed) ───
class MockOrganizationRepository {
    get orgs() { return loadStore('orgs'); }
    set orgs(v) { saveStore('orgs', v); }
    membershipRepo = new MockOrganizationMembershipRepository();
    async getByAccountId(accountId) {
        const memberships = this.membershipRepo.getByAccount(accountId);
        const memberOrgIds = (await memberships).map((m) => m.organizationId);
        return this.orgs.filter((o) => memberOrgIds.includes(o.id));
    }
    async getById(id) {
        return this.orgs.find((o) => o.id === id) ?? null;
    }
    async getAll() {
        return [...this.orgs];
    }
    async create(org) {
        const now = new Date().toISOString();
        const full = { ...org, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
        const orgs = this.orgs;
        orgs.push(full);
        this.orgs = orgs;
        return full;
    }
    async update(org) {
        const orgs = this.orgs;
        const idx = orgs.findIndex((o) => o.id === org.id);
        if (idx >= 0)
            orgs[idx] = { ...org, updatedAt: new Date().toISOString() };
        this.orgs = orgs;
    }
    async getByInn(inn) {
        return this.orgs.find((o) => o.inn === inn) ?? null;
    }
}
// ─── Mock Organization Membership Repository (sessionStorage-backed) ───
class MockOrganizationMembershipRepository {
    get memberships() { return loadStore('memberships'); }
    set memberships(v) { saveStore('memberships', v); }
    async getByAccount(accountId) {
        return this.memberships.filter((m) => m.accountId === accountId && m.status === 'active');
    }
    async getByOrganization(orgId) {
        return this.memberships.filter((m) => m.organizationId === orgId);
    }
    async create(membership) {
        const full = { ...membership, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        const memberships = this.memberships;
        memberships.push(full);
        this.memberships = memberships;
        return full;
    }
    async updateRole(membershipId, role) {
        const memberships = this.memberships;
        const idx = memberships.findIndex((m) => m.id === membershipId);
        if (idx >= 0)
            memberships[idx] = { ...memberships[idx], role };
        this.memberships = memberships;
    }
    async remove(membershipId) {
        this.memberships = this.memberships.filter((m) => m.id !== membershipId);
    }
}
// ─── Mock Referral Repository (sessionStorage-backed) ───
class MockReferralRepository {
    get links() { return loadStore('ref_links'); }
    set links(v) { saveStore('ref_links', v); }
    get clicks() { return loadStore('ref_clicks'); }
    set clicks(v) { saveStore('ref_clicks', v); }
    get attributions() { return loadStore('ref_attributions'); }
    set attributions(v) { saveStore('ref_attributions', v); }
    get events() { return loadStore('ref_events'); }
    set events(v) { saveStore('ref_events', v); }
    async createLink(link) {
        const full = { ...link, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        const links = this.links;
        links.push(full);
        this.links = links;
        return full;
    }
    async getLinksByAccount(accountId) {
        return this.links.filter((l) => l.referrerAccountId === accountId);
    }
    async findByCode(code) {
        return this.links.find((l) => l.code === code) ?? null;
    }
    async recordClick(linkId, visitorIp, userAgent) {
        const clicks = this.clicks;
        clicks.push({ linkId, visitorIp, userAgent, clickedAt: new Date().toISOString() });
        this.clicks = clicks;
    }
    async getClicksByLink(linkId) {
        return this.clicks.filter((c) => c.linkId === linkId).length;
    }
    async createAttribution(attr) {
        const full = { ...attr, id: crypto.randomUUID(), attributedAt: new Date().toISOString() };
        const attributions = this.attributions;
        attributions.push(full);
        this.attributions = attributions;
        return full;
    }
    async getAttributionsByReferrer(accountId) {
        const linkIds = this.links.filter((l) => l.referrerAccountId === accountId).map((l) => l.id);
        return this.attributions.filter((a) => linkIds.includes(a.linkId));
    }
    async getPendingAttribution(referredAccountId) {
        return this.attributions.find((a) => a.referredAccountId === referredAccountId && a.status === 'pending') ?? null;
    }
    async recordEvent(event) {
        const full = { ...event, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        const events = this.events;
        events.push(full);
        this.events = events;
        return full;
    }
    async getEventsByAttribution(attributionId) {
        return this.events.filter((e) => e.attributionId === attributionId);
    }
}
// ─── Mock Reward Repository (Ledger-based, sessionStorage-backed) ───
class MockRewardRepository {
    get wallets() { return loadStore('reward_wallets'); }
    set wallets(v) { saveStore('reward_wallets', v); }
    get transactions() { return loadStore('reward_txs'); }
    set transactions(v) { saveStore('reward_txs', v); }
    get redemptions() { return loadStore('reward_redemptions'); }
    set redemptions(v) { saveStore('reward_redemptions', v); }
    async getWallets(accountId) {
        return this.wallets.filter((w) => w.accountId === accountId);
    }
    async getOrCreateWallet(accountId, currency) {
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
    async getTransactions(walletId) {
        return this.transactions.filter((t) => t.walletId === walletId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    async addTransaction(tx) {
        if (tx.sourceEventId) {
            const existing = this.transactions.find((t) => t.sourceEventId === tx.sourceEventId && t.operationType === tx.operationType && t.walletId === tx.walletId);
            if (existing)
                return existing;
        }
        if (tx.reversalOfId) {
            const reversed = this.transactions.find((t) => t.reversalOfId === tx.reversalOfId && t.operationType === 'REVERSE');
            if (reversed)
                return reversed;
        }
        const full = { ...tx, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        const transactions = this.transactions;
        transactions.push(full);
        this.transactions = transactions;
        const wallet = this.wallets.find((w) => w.id === tx.walletId);
        if (wallet) {
            const wallets = this.wallets;
            const idx = wallets.findIndex((w) => w.id === tx.walletId);
            if (tx.operationType === 'EARN' && tx.status === 'AVAILABLE')
                wallet.cachedBalance += tx.amount;
            else if (tx.operationType === 'SPEND' && tx.status === 'SPENT')
                wallet.cachedBalance -= tx.amount;
            else if (tx.operationType === 'REVERSE' || tx.operationType === 'EXPIRE')
                wallet.cachedBalance -= tx.amount;
            else if (tx.operationType === 'ADJUSTMENT')
                wallet.cachedBalance += tx.amount;
            wallet.updatedAt = new Date().toISOString();
            wallets[idx] = wallet;
            this.wallets = wallets;
        }
        return full;
    }
    async computeBalance(walletId) {
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
    async createRedemption(redemption) {
        const full = { ...redemption, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        const redemptions = this.redemptions;
        redemptions.push(full);
        this.redemptions = redemptions;
        return full;
    }
    async getRedemptions(walletId) {
        return this.redemptions.filter((r) => r.walletId === walletId);
    }
}
// ─── Mock Fraud Repository (sessionStorage-backed) ───
class MockFraudRepository {
    get flags() { return loadStore('fraud_flags'); }
    set flags(v) { saveStore('fraud_flags', v); }
    async createFlag(flag) {
        const full = { ...flag, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        const flags = this.flags;
        flags.push(full);
        this.flags = flags;
        return full;
    }
    async getFlagsByAccount(accountId) {
        return this.flags.filter((f) => f.accountId === accountId);
    }
    async getFlagsByAttribution(attributionId) {
        return this.flags.filter((f) => f.attributionId === attributionId);
    }
}
// ─── Mock Vacancy Repository (sessionStorage-backed) ───
class MockVacancyRepository {
    get vacancies() { return loadStore('vacancies'); }
    set vacancies(v) { saveStore('vacancies', v); }
    async getByOrganization(orgId) {
        return this.vacancies.filter((v) => v.organizationId === orgId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    async getPublished() {
        return this.vacancies.filter((v) => v.status === 'published');
    }
    async getById(id) {
        return this.vacancies.find((v) => v.id === id) ?? null;
    }
    async getAll() {
        return [...this.vacancies].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    async getPendingModeration() {
        return this.vacancies.filter((v) => v.status === 'pending_moderation');
    }
    async getByStatus(status) {
        return this.vacancies.filter((v) => v.status === status);
    }
    async create(vacancy) {
        const now = new Date().toISOString();
        const full = { ...vacancy, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
        const vacancies = this.vacancies;
        vacancies.push(full);
        this.vacancies = vacancies;
        return full;
    }
    async update(vacancy) {
        const vacancies = this.vacancies;
        const idx = vacancies.findIndex((v) => v.id === vacancy.id);
        if (idx >= 0)
            vacancies[idx] = { ...vacancy, updatedAt: new Date().toISOString() };
        this.vacancies = vacancies;
    }
    async submitForModeration(id) {
        const items = this.vacancies;
        const v = items.find((v) => v.id === id);
        if (v) {
            v.status = 'pending_moderation';
            v.moderationComment = '';
            v.updatedAt = new Date().toISOString();
            this.vacancies = items;
        }
    }
    async approve(id, adminId) {
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
    async reject(id, adminId, comment) {
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
    async publish(id) {
        const items = this.vacancies;
        const v = items.find((v) => v.id === id);
        if (v) {
            v.status = 'published';
            v.publishedAt = new Date().toISOString();
            v.updatedAt = new Date().toISOString();
            this.vacancies = items;
        }
    }
    async pause(id) {
        const items = this.vacancies;
        const v = items.find((v) => v.id === id);
        if (v) {
            v.status = 'paused';
            v.updatedAt = new Date().toISOString();
            this.vacancies = items;
        }
    }
    async close(id) {
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
class MockVacancyEventRepository {
    get events() { return loadStore('vacancy_events'); }
    set events(v) { saveStore('vacancy_events', v); }
    async getByVacancy(vacancyId) {
        return this.events.filter((e) => e.vacancyId === vacancyId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }
    async create(event) {
        const full = { ...event, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        const events = this.events;
        events.push(full);
        this.events = events;
        return full;
    }
}
// ─── Mock Application Repository (sessionStorage-backed) ───
class MockApplicationRepository {
    get apps() { return loadStore('applications'); }
    set apps(v) { saveStore('applications', v); }
    async getByCandidate(candidateId) {
        return this.apps.filter((a) => a.candidateId === candidateId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    async getById(id) {
        return this.apps.find((a) => a.id === id) ?? null;
    }
    async create(app) {
        const now = new Date().toISOString();
        const full = { ...app, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
        const apps = this.apps;
        apps.push(full);
        this.apps = apps;
        return full;
    }
    async update(app) {
        const apps = this.apps;
        const idx = apps.findIndex((a) => a.id === app.id);
        if (idx >= 0)
            apps[idx] = { ...app, updatedAt: new Date().toISOString() };
        this.apps = apps;
    }
    async getByVacancy(vacancyId) {
        return this.apps.filter((a) => a.vacancyId === vacancyId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    async getByOrganization(orgId) {
        const vacancyIds = vacancyRepository.getByOrganization(orgId).then((vs) => vs.map((v) => v.id));
        const ids = await vacancyIds;
        return this.apps.filter((a) => ids.includes(a.vacancyId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
}
// ─── Mock Resume Repository (sessionStorage-backed) ───
class MockResumeRepository {
    get resumes() { return loadStore('resumes'); }
    set resumes(v) { saveStore('resumes', v); }
    async getByCandidate(candidateId) {
        return this.resumes.filter((r) => r.candidateId === candidateId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }
    async getById(id) {
        return this.resumes.find((r) => r.id === id) ?? null;
    }
    async create(resume) {
        const now = new Date().toISOString();
        const full = { ...resume, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
        const resumes = this.resumes;
        resumes.push(full);
        this.resumes = resumes;
        return full;
    }
    async update(resume) {
        const resumes = this.resumes;
        const idx = resumes.findIndex((r) => r.id === resume.id);
        if (idx >= 0)
            resumes[idx] = { ...resume, updatedAt: new Date().toISOString() };
        this.resumes = resumes;
    }
    async delete(id) {
        this.resumes = this.resumes.filter((r) => r.id !== id);
    }
    async duplicate(id) {
        const orig = await this.getById(id);
        if (!orig)
            return null;
        const now = new Date().toISOString();
        const copy = {
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
class MockBusinessProjectRepository {
    get projects() { return loadStore('business_projects'); }
    set projects(v) { saveStore('business_projects', v); }
    membershipRepo = new MockOrganizationMembershipRepository();
    async getByOrganization(orgId) {
        return this.projects.filter((p) => p.organizationId === orgId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    async getAll() {
        return [...this.projects].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    async getByAccountOrganizations(accountId) {
        const memberships = await this.membershipRepo.getByAccount(accountId);
        const orgIds = memberships.map((m) => m.organizationId);
        return this.projects.filter((p) => orgIds.includes(p.organizationId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    async getById(id) {
        return this.projects.find((p) => p.id === id) ?? null;
    }
    async create(project) {
        const now = new Date().toISOString();
        const existing = this.projects;
        const seq = existing.length + 1;
        const publicNumber = projectNumberGenerator.generate(existing.length);
        const full = { ...project, publicNumber, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
        const projects = this.projects;
        projects.push(full);
        this.projects = projects;
        return full;
    }
    async update(project) {
        const projects = this.projects;
        const idx = projects.findIndex((p) => p.id === project.id);
        if (idx >= 0)
            projects[idx] = { ...project, updatedAt: new Date().toISOString() };
        this.projects = projects;
    }
}
// ─── Mock Project Event Repository (sessionStorage-backed) ───
class MockProjectEventRepository {
    get events() { return loadStore('project_events'); }
    set events(v) { saveStore('project_events', v); }
    async getByProject(projectId) {
        return this.events.filter((e) => e.projectId === projectId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }
    async create(event) {
        const full = { ...event, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        const events = this.events;
        events.push(full);
        this.events = events;
        return full;
    }
}
// ─── Mock Application Event Repository (sessionStorage-backed) ───
class MockApplicationEventRepository {
    get events() { return loadStore('application_events'); }
    set events(v) { saveStore('application_events', v); }
    async getByApplication(applicationId) {
        return this.events.filter((e) => e.applicationId === applicationId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }
    async create(event) {
        const full = { ...event, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        const events = this.events;
        events.push(full);
        this.events = events;
        return full;
    }
}
// ─── Mock Guardian Verification Repository (sessionStorage-backed) ───
class MockGuardianVerificationRepository {
    get records() { return loadStore('guardian_verifications'); }
    set records(v) { saveStore('guardian_verifications', v); }
    async getByCandidate(candidateId) {
        return this.records.filter((r) => r.candidateId === candidateId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
    }
    async getByToken(token) {
        const record = this.records.find((r) => r.verificationToken === token);
        if (!record)
            return null;
        if (record.expiresAt && new Date(record.expiresAt) < new Date()) {
            if (record.status === 'pending') {
                await this.updateStatus(record.id, 'rejected');
            }
            return null;
        }
        if (record.consumedAt)
            return null;
        return record;
    }
    async create(verification) {
        const expiresAt = verification.expiresAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        const full = { ...verification, expiresAt, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        const records = this.records;
        records.push(full);
        this.records = records;
        return full;
    }
    async updateStatus(id, status, verifiedAt) {
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
const INITIAL_ADMIN_VK_IDS = [];
class MockAdminGrantRepository {
    get grants() { return loadStore('admin_grants'); }
    set grants(v) { saveStore('admin_grants', v); }
    async getAll() {
        const stored = this.grants;
        // Merge DEV fallback for primary admin if not already in store
        const hasPrimary = stored.some((g) => g.vkUserId === INITIAL_ADMIN_VK_IDS[0]);
        if (!hasPrimary && INITIAL_ADMIN_VK_IDS[0]) {
            const devGrant = {
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
    async getByVkUserId(vkUserId) {
        const all = await this.getAll();
        return all.find((g) => g.vkUserId === vkUserId) ?? null;
    }
    async grant(vkUserId, displayName, grantedBy) {
        const existing = await this.getByVkUserId(vkUserId);
        if (existing)
            return existing;
        const full = {
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
    async revoke(id) {
        const grants = this.grants;
        const target = grants.find((g) => g.id === id);
        if (target?.isPrimary)
            return;
        this.grants = grants.filter((g) => g.id !== id);
    }
    getPrimaryAdminVkIds() {
        return [...INITIAL_ADMIN_VK_IDS];
    }
}
// ─── Seed demo vacancies (DEV-only, call explicitly) ───
export function seedDemoVacancies() {
    const existing = loadStore('vacancies');
    if (existing.length > 0)
        return;
    const now = new Date().toISOString();
    const demo = [
        { id: crypto.randomUUID(), organizationId: 'demo-org-1', title: 'Стажёр-аналитик данных', description: 'Аналитика данных, работа с Python и SQL', responsibilities: ['Сбор и анализ данных', 'Подготовка отчётов'], requirements: ['Python', 'SQL', 'Excel'], niceToHave: ['Pandas', 'BI-инструменты'], employmentType: 'Стажировка', schedule: 'Полный день', workFormat: 'Гибрид', location: 'Москва', city: 'Москва', salaryFrom: 45000, salaryTo: 60000, salaryCurrency: 'RUB', salaryGross: false, experienceLevel: 'none', skills: ['Python', 'SQL', 'Excel'], suitableForMinors: false, minimumAge: null, contactPerson: 'HR отдел', contactEmail: 'hr@demo.ru', status: 'published', moderationComment: '', moderatedBy: null, moderatedAt: null, publishedAt: now, closedAt: null, createdBy: 'demo', createdAt: now, updatedAt: now },
        { id: crypto.randomUUID(), organizationId: 'demo-org-1', title: 'Junior frontend-разработчик', description: 'Разработка на React, TypeScript', responsibilities: ['Разработка UI-компонентов', 'Интеграция с API'], requirements: ['JavaScript', 'React', 'HTML/CSS'], niceToHave: ['TypeScript', 'Next.js'], employmentType: 'Полная', schedule: 'Полный день', workFormat: 'Удалённо', location: 'Удалённо', city: 'Москва', salaryFrom: 60000, salaryTo: 90000, salaryCurrency: 'RUB', salaryGross: false, experienceLevel: '0-1', skills: ['JavaScript', 'React', 'HTML/CSS'], suitableForMinors: false, minimumAge: null, contactPerson: 'HR отдел', contactEmail: 'hr@demo.ru', status: 'published', moderationComment: '', moderatedBy: null, moderatedAt: null, publishedAt: now, closedAt: null, createdBy: 'demo', createdAt: now, updatedAt: now },
        { id: crypto.randomUUID(), organizationId: 'demo-org-1', title: 'Ассистент маркетолога', description: 'Помощь маркетинговой команде', responsibilities: ['SMM', 'Контент-план', 'Аналитика'], requirements: ['SMM', 'Копирайтинг', 'Аналитика'], niceToHave: ['Tilda', 'Figma'], employmentType: 'Стажировка', schedule: 'Полный день', workFormat: 'Офис', location: 'Москва', city: 'Москва', salaryFrom: 40000, salaryTo: 50000, salaryCurrency: 'RUB', salaryGross: false, experienceLevel: 'none', skills: ['SMM', 'Копирайтинг', 'Аналитика'], suitableForMinors: true, minimumAge: 16, contactPerson: 'HR отдел', contactEmail: 'hr@demo.ru', status: 'published', moderationComment: '', moderatedBy: null, moderatedAt: null, publishedAt: now, closedAt: null, createdBy: 'demo', createdAt: now, updatedAt: now },
        { id: crypto.randomUUID(), organizationId: 'demo-org-1', title: 'Младший продуктовый дизайнер', description: 'UI/UX дизайн в Figma', responsibilities: ['Прототипирование', 'Дизайн интерфейсов'], requirements: ['Figma', 'UI/UX', 'Прототипирование'], niceToHave: ['Motion-дизайн'], employmentType: 'Стажировка', schedule: 'Гибкий', workFormat: 'Удалённо', location: 'Удалённо', city: 'Санкт-Петербург', salaryFrom: 50000, salaryTo: 70000, salaryCurrency: 'RUB', salaryGross: false, experienceLevel: '0-1', skills: ['Figma', 'UI/UX', 'Прототипирование'], suitableForMinors: false, minimumAge: null, contactPerson: 'HR отдел', contactEmail: 'hr@demo.ru', status: 'published', moderationComment: '', moderatedBy: null, moderatedAt: null, publishedAt: now, closedAt: null, createdBy: 'demo', createdAt: now, updatedAt: now },
        { id: crypto.randomUUID(), organizationId: 'demo-org-1', title: 'Помощник HR-менеджера', description: 'Рекрутинг и onboarding', responsibilities: ['Скрининг резюме', 'Организация собеседований'], requirements: ['Коммуникация', 'Excel'], niceToHave: ['ATS-системы'], employmentType: 'Частичная', schedule: 'Гибкий', workFormat: 'Гибрид', location: 'Москва', city: 'Москва', salaryFrom: 42000, salaryTo: 55000, salaryCurrency: 'RUB', salaryGross: false, experienceLevel: 'none', skills: ['Коммуникация', 'Excel'], suitableForMinors: true, minimumAge: 18, contactPerson: 'HR отдел', contactEmail: 'hr@demo.ru', status: 'published', moderationComment: '', moderatedBy: null, moderatedAt: null, publishedAt: now, closedAt: null, createdBy: 'demo', createdAt: now, updatedAt: now },
    ];
    saveStore('vacancies', demo);
}
// ─── Export singletons ───
export const accountRepository = repositoryAdapter("account", new MockAccountRepository());
export const candidateRepository = repositoryAdapter("candidate", new MockCandidateRepository());
export const organizationRepository = repositoryAdapter("organization", new MockOrganizationRepository());
export const organizationMembershipRepository = repositoryAdapter("organizationMembership", new MockOrganizationMembershipRepository());
export const referralRepository = repositoryAdapter("referral", new MockReferralRepository());
export const rewardRepository = repositoryAdapter("reward", new MockRewardRepository());
export const fraudRepository = repositoryAdapter("fraud", new MockFraudRepository());
export const vacancyRepository = repositoryAdapter("vacancy", new MockVacancyRepository());
export const vacancyEventRepository = repositoryAdapter("vacancyEvent", new MockVacancyEventRepository());
export const applicationRepository = repositoryAdapter("application", new MockApplicationRepository());
export const resumeRepository = repositoryAdapter("resume", new MockResumeRepository());
export const businessProjectRepository = repositoryAdapter("businessProject", new MockBusinessProjectRepository());
export const projectEventRepository = repositoryAdapter("projectEvent", new MockProjectEventRepository());
export const applicationEventRepository = repositoryAdapter("applicationEvent", new MockApplicationEventRepository());
export const guardianVerificationRepository = repositoryAdapter("guardianVerification", new MockGuardianVerificationRepository());
export const adminGrantRepository = repositoryAdapter("adminGrant", new MockAdminGrantRepository());
