import React, { lazy, Suspense } from 'react';
import { BrowserRouter, MemoryRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../auth/ProtectedRoute';
import RoleRoute from '../auth/RoleRoute';
import AppShellLayout from './AppShellLayout';
import { PATHS, ROLES } from './routes';
import { LoadingState, Page, UnavailableModule } from '../ui';

const LoginPage = lazy(() => import('../features/auth/LoginPage'));
const DashboardPage = lazy(() => import('../features/dashboard/DashboardPage'));
const RegistrationListPage = lazy(() => import('../features/registrations/RegistrationListPage'));
const CreateRegistrationPage = lazy(() => import('../features/registrations/CreateRegistrationPage'));
const CandidateListPage = lazy(() => import('../features/candidates/CandidateListPage'));
const PaymentQueuePage = lazy(() => import('../features/payments/PaymentQueuePage'));
const PaymentCheckoutPage = lazy(() => import('../features/payments/PaymentCheckoutPage'));
const ExamFormListPage = lazy(() => import('../features/exam-forms/ExamFormListPage'));
const ExamFormDetailPage = lazy(() => import('../features/exam-forms/ExamFormDetailPage'));
const ExtensionListPage = lazy(() => import('../features/extensions/ExtensionListPage'));
const CreateExtensionPage = lazy(() => import('../features/extensions/CreateExtensionPage'));

function RouteFallback() {
  return <Page title="Đang tải"><LoadingState label="Đang chuẩn bị không gian làm việc…" /></Page>;
}

function LazyOutlet() {
  return <Suspense fallback={<RouteFallback />}><Outlet /></Suspense>;
}

function AppRoutes() {
  return <Routes>
    <Route path={PATHS.login} element={<Suspense fallback={<RouteFallback />}><LoginPage /></Suspense>} />
    <Route path="/login" element={<Navigate to={PATHS.login} replace />} />
    <Route path="/register" element={<Navigate to={PATHS.registrationCreate} replace />} />
    <Route element={<ProtectedRoute />}>
      <Route element={<AppShellLayout />}>
        <Route element={<LazyOutlet />}>
          <Route path={PATHS.home} element={<DashboardPage />} />
          <Route element={<RoleRoute roles={[ROLES.reception]} />}>
            <Route path={PATHS.registrations} element={<RegistrationListPage />} />
            <Route path={PATHS.registrationCreate} element={<CreateRegistrationPage />} />
            <Route path={PATHS.extensions} element={<ExtensionListPage />} />
            <Route path={PATHS.extensionCreate} element={<CreateExtensionPage />} />
            <Route path={PATHS.temporaryCandidates} element={<Navigate to={PATHS.candidates} replace />} />
          </Route>
          <Route element={<RoleRoute roles={[ROLES.accounting]} />}>
            <Route path={PATHS.accounting} element={<PaymentQueuePage />} />
            <Route path={PATHS.accountingProcess} element={<PaymentCheckoutPage />} />
          </Route>
          <Route element={<RoleRoute roles={[ROLES.reception, ROLES.accounting, ROLES.examOrganization]} />}>
            <Route path={PATHS.candidates} element={<CandidateListPage />} />
            <Route path={PATHS.examForms} element={<ExamFormListPage />} />
            <Route path={PATHS.examFormDetail} element={<ExamFormDetailPage />} />
          </Route>
          <Route element={<RoleRoute roles={[ROLES.examOrganization]} />}><Route path={PATHS.examOrganization} element={<UnavailableModule title="Tổ chức thi" description="Chức năng điều phối kỳ thi sẽ được mở khi quy trình nghiệp vụ được phê duyệt." />} /></Route>
          <Route element={<RoleRoute roles={[ROLES.dataEntry]} />}><Route path={PATHS.dataEntry} element={<UnavailableModule title="Nhập liệu" description="Chức năng nhập liệu sẽ được mở khi quy trình nghiệp vụ được phê duyệt." />} /></Route>
          <Route element={<RoleRoute roles={[ROLES.proctor]} />}><Route path={PATHS.proctor} element={<UnavailableModule title="Coi thi" description="Chức năng coi thi sẽ được mở khi quy trình nghiệp vụ được phê duyệt." />} /></Route>
        </Route>
      </Route>
    </Route>
    <Route path="*" element={<Navigate to={PATHS.login} replace />} />
  </Routes>;
}

export default function AppRouter({ initialEntries }) {
  if (initialEntries) return <MemoryRouter initialEntries={initialEntries}><AppRoutes /></MemoryRouter>;
  return <BrowserRouter><AppRoutes /></BrowserRouter>;
}
