import { CompaniesPage, CompanyPage } from '@/pages/CompaniesPage';
import { PublicResumePage } from '@/pages/PublicResumePage';
import { ApiNotice } from '@/components/ApiNotice';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { AuthProvider } from '@/services/authContext';
import { OrgScopeProvider } from '@/services/orgScopeContext';
import { RequireAuth, RequireOrganizationMembership, RequirePlatformRole, RequireVacancyManager } from '@/services/authGuards';
import { captureReferralFromUrl } from '@/services/referralCapture';
import { PlatformLayout } from '@/layouts/PlatformLayout';
import { BusinessLayout } from '@/layouts/BusinessLayout';
import { CareerLayout } from '@/layouts/CareerLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { HomePage } from '@/pages/HomePage';
import { AuthPage } from '@/pages/AuthPage';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageLoader } from '@/components/PageLoader';

const VkCallbackPage = lazy(() => import('@/pages/VkCallbackPage').then(m => ({ default: m.VkCallbackPage })));
const AdvertisingCatalogPage = lazy(() => import('@/pages/AdvertisingCatalogPage').then(m => ({ default: m.AdvertisingCatalogPage })));
const AdvertisingDetailPage = lazy(() => import('@/pages/AdvertisingDetailPage').then(m => ({ default: m.AdvertisingDetailPage })));
const ServicesCatalogPage = lazy(() => import('@/pages/ServicesCatalogPage').then(m => ({ default: m.ServicesCatalogPage })));
const ServiceDetailPage = lazy(() => import('@/pages/ServiceDetailPage').then(m => ({ default: m.ServiceDetailPage })));
const LegalPage = lazy(() => import('@/pages/LegalPage').then(m => ({ default: m.LegalPage })));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const NotFoundPage = lazy(() => import('@/pages/ErrorPages').then(m => ({ default: m.NotFoundPage })));
const ForbiddenPage = lazy(() => import('@/pages/ErrorPages').then(m => ({ default: m.ForbiddenPage })));
const ServerErrorPage = lazy(() => import('@/pages/ErrorPages').then(m => ({ default: m.ServerErrorPage })));
const AdminVacanciesPage = lazy(() => import('@/pages/admin/AdminVacanciesPage').then(m => ({ default: m.AdminVacanciesPage })));
const AdminProjectsPage = lazy(() => import('@/pages/admin/AdminProjectsPage').then(m => ({ default: m.AdminProjectsPage })));
const AdminProjectDetailPage = lazy(() => import('@/pages/admin/AdminProjectDetailPage').then(m => ({ default: m.AdminProjectDetailPage })));
const AdminAdminsPage = lazy(() => import('@/pages/admin/AdminAdminsPage').then(m => ({ default: m.AdminAdminsPage })));
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage').then(m => ({ default: m.AdminUsersPage })));
const AdminOrganizationsPage = lazy(() => import('@/pages/admin/AdminOrganizationsPage').then(m => ({ default: m.AdminOrganizationsPage })));
const AdminPartnersPage = lazy(() => import('@/pages/admin/AdminPartnersPage').then(m => ({ default: m.AdminPartnersPage })));

const BusinessIndexPage = lazy(() => import('@/pages/business/BusinessIndexPage').then(m => ({ default: m.BusinessIndexPage })));
const BusinessLoginPage = lazy(() => import('@/pages/business/BusinessLoginPage').then(m => ({ default: m.BusinessLoginPage })));
const BusinessRegisterPage = lazy(() => import('@/pages/business/BusinessRegisterPage').then(m => ({ default: m.BusinessRegisterPage })));
const BusinessDashboardPage = lazy(() => import('@/pages/business/BusinessDashboardPage').then(m => ({ default: m.BusinessDashboardPage })));
const BusinessPartnershipPage = lazy(() => import('@/pages/business/BusinessPartnershipPage').then(m => ({ default: m.BusinessPartnershipPage })));
const BusinessOrganizationNewPage = lazy(() => import('@/pages/business/BusinessOrganizationNewPage').then(m => ({ default: m.BusinessOrganizationNewPage })));
const BusinessOrganizationsPage = lazy(() => import('@/pages/business/BusinessOrganizationsPage').then(m => ({ default: m.BusinessOrganizationsPage })));
const BusinessOrganizationDetailPage = lazy(() => import('@/pages/business/BusinessOrganizationDetailPage').then(m => ({ default: m.BusinessOrganizationDetailPage })));
const BusinessApplicationsPage = lazy(() => import('@/pages/business/BusinessApplicationsPage').then(m => ({ default: m.BusinessApplicationsPage })));
const BusinessDocumentsPage = lazy(() => import('@/pages/business/BusinessDocumentsPage').then(m => ({ default: m.BusinessDocumentsPage })));
const BusinessProjectsPage = lazy(() => import('@/pages/business/BusinessProjectsPage').then(m => ({ default: m.BusinessProjectsPage })));
const BusinessProjectDetailPage = lazy(() => import('@/pages/business/BusinessProjectDetailPage').then(m => ({ default: m.BusinessProjectDetailPage })));
const BusinessProjectCreateWizard = lazy(() => import('@/pages/business/BusinessProjectCreateWizard').then(m => ({ default: m.BusinessProjectCreateWizard })));
const BusinessBudgetCalculatorPage = lazy(() => import('@/pages/business/BusinessBudgetCalculatorPage').then(m => ({ default: m.BusinessBudgetCalculatorPage })));

const BusinessTeamPage = lazy(() => import('@/pages/business/BusinessTeamPage').then(m => ({ default: m.BusinessTeamPage })));
const VacancyCreateWizard = lazy(() => import('@/pages/business/VacancyCreateWizard').then(m => ({ default: m.VacancyCreateWizard })));
const BusinessInvitePage = lazy(() => import('@/pages/business/BusinessInvitePage').then(m => ({ default: m.BusinessInvitePage })));
const BusinessMediaPlanPage = lazy(() => import('@/pages/business/BusinessMediaPlanPage').then(m => ({ default: m.BusinessMediaPlanPage })));

const CareerIndexPage = lazy(() => import('@/pages/career/CareerIndexPage').then(m => ({ default: m.CareerIndexPage })));
const CareerLoginPage = lazy(() => import('@/pages/career/CareerLoginPage').then(m => ({ default: m.CareerLoginPage })));
const CareerPartnershipPage = lazy(() => import('@/pages/career/CareerPartnershipPage').then(m => ({ default: m.CareerPartnershipPage })));
const CareerProfilePage = lazy(() => import('@/pages/career/CareerProfilePage').then(m => ({ default: m.CareerProfilePage })));
const CareerResumesPage = lazy(() => import('@/pages/career/CareerResumesPage').then(m => ({ default: m.CareerResumesPage })));
const ResumeEditorPage = lazy(() => import('@/pages/career/ResumeEditorPage').then(m => ({ default: m.ResumeEditorPage })));
const CareerVacanciesPage = lazy(() => import('@/pages/career/CareerVacanciesPage').then(m => ({ default: m.CareerVacanciesPage })));
const CareerApplicationsPage = lazy(() => import('@/pages/career/CareerApplicationsPage').then(m => ({ default: m.CareerApplicationsPage })));
const CareerTestsPage = lazy(() => import('@/pages/career/CareerTestsPage').then(m => ({ default: m.CareerTestsPage })));
const CareerFavoritesPage = lazy(() => import('@/pages/career/CareerFavoritesPage').then(m => ({ default: m.CareerFavoritesPage })));
const CareerVacancyDetailPage = lazy(() => import('@/pages/career/CareerVacancyDetailPage').then(m => ({ default: m.CareerVacancyDetailPage })));

const CareerOnboarding = lazy(() => import('@/features/career/CareerOnboarding').then(m => ({ default: m.CareerOnboarding })));
const GuardianVerifyPage = lazy(() => import('@/pages/GuardianVerifyPage').then(m => ({ default: m.GuardianVerifyPage })));

function CapturedReferral() {
  const location = useLocation();
  useEffect(() => {
    captureReferralFromUrl(`${location.pathname}${location.search}`);
  }, [location]);
  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <OrgScopeProvider>
        <BrowserRouter>
          <CapturedReferral /><ApiNotice />
          <Routes>
            {/* Home */}
            <Route path="/" element={<PlatformLayout><HomePage /></PlatformLayout>} />

            {/* Auth */}
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/auth/vk/callback" element={<Suspense fallback={<PageLoader />}><VkCallbackPage /></Suspense>} />

            {/* Public pages */}
            <Route path="/companies" element={<PlatformLayout><CompaniesPage /></PlatformLayout>} />
            <Route path="/companies/:id" element={<PlatformLayout><CompanyPage /></PlatformLayout>} />
            <Route path="/r/:slug" element={<PlatformLayout><PublicResumePage /></PlatformLayout>} />
            <Route path="/vacancies" element={<PlatformLayout><Suspense fallback={<PageLoader />}><CareerVacanciesPage /></Suspense></PlatformLayout>} />
            <Route path="/vacancies/:id" element={<PlatformLayout><Suspense fallback={<PageLoader />}><CareerVacancyDetailPage /></Suspense></PlatformLayout>} />
            <Route path="/advertising" element={<Suspense fallback={<PageLoader />}><AdvertisingCatalogPage /></Suspense>} />
            <Route path="/advertising/:id" element={<Suspense fallback={<PageLoader />}><AdvertisingDetailPage /></Suspense>} />
            <Route path="/services" element={<Suspense fallback={<PageLoader />}><ServicesCatalogPage /></Suspense>} />
            <Route path="/services/:id" element={<Suspense fallback={<PageLoader />}><ServiceDetailPage /></Suspense>} />
            <Route path="/legal" element={<Suspense fallback={<PageLoader />}><LegalPage /></Suspense>} />
            <Route path="/legal/:slug" element={<Suspense fallback={<PageLoader />}><LegalPage /></Suspense>} />
            <Route path="/notifications" element={<RequireAuth><Suspense fallback={<PageLoader />}><NotificationsPage /></Suspense></RequireAuth>} />

            {/* Guardian */}
            <Route path="/guardian/verify/:token" element={<Suspense fallback={<PageLoader />}><GuardianVerifyPage /></Suspense>} />

            {/* Admin */}
            <Route path="/admin" element={<RequireAuth><RequirePlatformRole role="admin"><AdminLayout><Suspense fallback={<PageLoader />}><AdminVacanciesPage /></Suspense></AdminLayout></RequirePlatformRole></RequireAuth>} />
            <Route path="/admin/vacancies" element={<RequireAuth><RequirePlatformRole role="admin"><AdminLayout><Suspense fallback={<PageLoader />}><AdminVacanciesPage /></Suspense></AdminLayout></RequirePlatformRole></RequireAuth>} />
            <Route path="/admin/projects" element={<RequireAuth><RequirePlatformRole role="admin"><AdminLayout><Suspense fallback={<PageLoader />}><AdminProjectsPage /></Suspense></AdminLayout></RequirePlatformRole></RequireAuth>} />
            <Route path="/admin/projects/:id" element={<RequireAuth><RequirePlatformRole role="admin"><AdminLayout><Suspense fallback={<PageLoader />}><AdminProjectDetailPage /></Suspense></AdminLayout></RequirePlatformRole></RequireAuth>} />
            <Route path="/admin/admins" element={<RequireAuth><RequirePlatformRole role="admin"><AdminLayout><Suspense fallback={<PageLoader />}><AdminAdminsPage /></Suspense></AdminLayout></RequirePlatformRole></RequireAuth>} />
            <Route path="/admin/users" element={<RequireAuth><RequirePlatformRole role="admin"><AdminLayout><Suspense fallback={<PageLoader />}><AdminUsersPage /></Suspense></AdminLayout></RequirePlatformRole></RequireAuth>} />
            <Route path="/admin/organizations" element={<RequireAuth><RequirePlatformRole role="admin"><AdminLayout><Suspense fallback={<PageLoader />}><AdminOrganizationsPage /></Suspense></AdminLayout></RequirePlatformRole></RequireAuth>} />
            <Route path="/admin/partners" element={<RequireAuth><RequirePlatformRole role="admin"><AdminLayout><Suspense fallback={<PageLoader />}><AdminPartnersPage /></Suspense></AdminLayout></RequirePlatformRole></RequireAuth>} />

            {/* Business */}
            <Route path="/business" element={<BusinessLayout><Suspense fallback={<PageLoader />}><BusinessIndexPage /></Suspense></BusinessLayout>} />
            <Route path="/business/login" element={<Suspense fallback={<PageLoader />}><BusinessLoginPage /></Suspense>} />
            <Route path="/business/register" element={<Suspense fallback={<PageLoader />}><BusinessRegisterPage /></Suspense>} />
            <Route path="/business/onboarding" element={<RequireAuth><Suspense fallback={<PageLoader />}><BusinessOrganizationNewPage /></Suspense></RequireAuth>} />
            <Route path="/business/dashboard" element={<RequireAuth><RequireOrganizationMembership><BusinessLayout><Suspense fallback={<PageLoader />}><BusinessDashboardPage /></Suspense></BusinessLayout></RequireOrganizationMembership></RequireAuth>} />
            <Route path="/business/organizations/new" element={<RequireAuth><Suspense fallback={<PageLoader />}><BusinessOrganizationNewPage /></Suspense></RequireAuth>} />
            <Route path="/business/organizations" element={<RequireAuth><RequireOrganizationMembership><BusinessLayout><Suspense fallback={<PageLoader />}><BusinessOrganizationsPage /></Suspense></BusinessLayout></RequireOrganizationMembership></RequireAuth>} />
            <Route path="/business/organizations/:id" element={<RequireAuth><RequireOrganizationMembership><BusinessLayout><Suspense fallback={<PageLoader />}><BusinessOrganizationDetailPage /></Suspense></BusinessLayout></RequireOrganizationMembership></RequireAuth>} />
            <Route path="/business/applications" element={<RequireAuth><RequireOrganizationMembership><BusinessLayout><Suspense fallback={<PageLoader />}><BusinessApplicationsPage /></Suspense></BusinessLayout></RequireOrganizationMembership></RequireAuth>} />
            <Route path="/business/documents" element={<RequireAuth><RequireOrganizationMembership><BusinessLayout><Suspense fallback={<PageLoader />}><BusinessDocumentsPage /></Suspense></BusinessLayout></RequireOrganizationMembership></RequireAuth>} />
            <Route path="/business/projects" element={<RequireAuth><RequireOrganizationMembership><BusinessLayout><Suspense fallback={<PageLoader />}><BusinessProjectsPage /></Suspense></BusinessLayout></RequireOrganizationMembership></RequireAuth>} />
            <Route path="/business/projects/new" element={<RequireAuth><RequireOrganizationMembership><BusinessLayout><Suspense fallback={<PageLoader />}><BusinessProjectCreateWizard /></Suspense></BusinessLayout></RequireOrganizationMembership></RequireAuth>} />
            <Route path="/business/calculator" element={<RequireAuth><RequireOrganizationMembership><BusinessLayout><Suspense fallback={<PageLoader />}><BusinessBudgetCalculatorPage /></Suspense></BusinessLayout></RequireOrganizationMembership></RequireAuth>} />
            <Route path="/business/projects/:id" element={<RequireAuth><RequireOrganizationMembership><BusinessLayout><Suspense fallback={<PageLoader />}><BusinessProjectDetailPage /></Suspense></BusinessLayout></RequireOrganizationMembership></RequireAuth>} />

            <Route path="/business/advertising" element={<RequireAuth><RequireOrganizationMembership><BusinessLayout><Suspense fallback={<PageLoader />}><AdvertisingCatalogPage layout="none" /></Suspense></BusinessLayout></RequireOrganizationMembership></RequireAuth>} />
            <Route path="/business/advertising/plan" element={<RequireAuth><RequireOrganizationMembership><BusinessLayout><Suspense fallback={<PageLoader />}><BusinessMediaPlanPage /></Suspense></BusinessLayout></RequireOrganizationMembership></RequireAuth>} />
            <Route path="/business/advertising/:id" element={<RequireAuth><RequireOrganizationMembership><BusinessLayout><Suspense fallback={<PageLoader />}><AdvertisingDetailPage layout="none" /></Suspense></BusinessLayout></RequireOrganizationMembership></RequireAuth>} />
            <Route path="/business/services" element={<RequireAuth><RequireOrganizationMembership><BusinessLayout><Suspense fallback={<PageLoader />}><ServicesCatalogPage layout="none" /></Suspense></BusinessLayout></RequireOrganizationMembership></RequireAuth>} />
            <Route path="/business/services/:id" element={<RequireAuth><RequireOrganizationMembership><BusinessLayout><Suspense fallback={<PageLoader />}><ServiceDetailPage layout="none" /></Suspense></BusinessLayout></RequireOrganizationMembership></RequireAuth>} />
            <Route path="/business/team" element={<RequireAuth><RequireOrganizationMembership><BusinessLayout><Suspense fallback={<PageLoader />}><BusinessTeamPage /></Suspense></BusinessLayout></RequireOrganizationMembership></RequireAuth>} />
            <Route path="/business/team/vacancies/new" element={<RequireAuth><RequireVacancyManager><BusinessLayout><Suspense fallback={<PageLoader />}><VacancyCreateWizard /></Suspense></BusinessLayout></RequireVacancyManager></RequireAuth>} />
            <Route path="/business/partnership" element={<RequireAuth><RequireOrganizationMembership><BusinessLayout><Suspense fallback={<PageLoader />}><BusinessPartnershipPage /></Suspense></BusinessLayout></RequireOrganizationMembership></RequireAuth>} />
            <Route path="/business/invite/:token" element={<Suspense fallback={<PageLoader />}><BusinessInvitePage /></Suspense>} />
            <Route path="/business/notifications" element={<RequireAuth><RequireOrganizationMembership><BusinessLayout><Suspense fallback={<PageLoader />}><NotificationsPage /></Suspense></BusinessLayout></RequireOrganizationMembership></RequireAuth>} />

            {/* Career */}
            <Route path="/career" element={<CareerLayout><Suspense fallback={<PageLoader />}><CareerIndexPage /></Suspense></CareerLayout>} />
            <Route path="/career/login" element={<Suspense fallback={<PageLoader />}><CareerLoginPage /></Suspense>} />
            <Route path="/career/onboarding" element={<RequireAuth><Suspense fallback={<PageLoader />}><CareerOnboarding /></Suspense></RequireAuth>} />
            <Route path="/career/profile" element={<RequireAuth><CareerLayout><Suspense fallback={<PageLoader />}><CareerProfilePage /></Suspense></CareerLayout></RequireAuth>} />
            <Route path="/career/resumes" element={<RequireAuth><CareerLayout><Suspense fallback={<PageLoader />}><CareerResumesPage /></Suspense></CareerLayout></RequireAuth>} />
            <Route path="/career/resumes/:id" element={<RequireAuth><CareerLayout><Suspense fallback={<PageLoader />}><ResumeEditorPage /></Suspense></CareerLayout></RequireAuth>} />
            <Route path="/career/vacancies" element={<RequireAuth><CareerLayout><Suspense fallback={<PageLoader />}><CareerVacanciesPage /></Suspense></CareerLayout></RequireAuth>} />
            <Route path="/career/vacancies/:id" element={<RequireAuth><CareerLayout><Suspense fallback={<PageLoader />}><CareerVacancyDetailPage /></Suspense></CareerLayout></RequireAuth>} />
            <Route path="/career/applications" element={<RequireAuth><CareerLayout><Suspense fallback={<PageLoader />}><CareerApplicationsPage /></Suspense></CareerLayout></RequireAuth>} />
            <Route path="/career/tests" element={<RequireAuth><CareerLayout><Suspense fallback={<PageLoader />}><CareerTestsPage /></Suspense></CareerLayout></RequireAuth>} />
            <Route path="/career/favorites" element={<RequireAuth><CareerLayout><Suspense fallback={<PageLoader />}><CareerFavoritesPage /></Suspense></CareerLayout></RequireAuth>} />
            <Route path="/career/partnership" element={<RequireAuth><CareerLayout><Suspense fallback={<PageLoader />}><CareerPartnershipPage /></Suspense></CareerLayout></RequireAuth>} />
            <Route path="/career/notifications" element={<RequireAuth><CareerLayout><Suspense fallback={<PageLoader />}><NotificationsPage /></Suspense></CareerLayout></RequireAuth>} />

            {/* Fallback */}
            <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFoundPage /></Suspense>} />
          </Routes>
        </BrowserRouter>
        </OrgScopeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
