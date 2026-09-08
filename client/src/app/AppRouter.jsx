import React from 'react';
import { BrowserRouter, MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../auth/ProtectedRoute';
import RoleRoute from '../auth/RoleRoute';
import ExamFormDetailPage from '../features/exam-forms/ExamFormDetailPage';
import CreateExtensionPage from '../features/extensions/CreateExtensionPage';
import ExtensionListPage from '../features/extensions/ExtensionListPage';
import DashboardPage from '../features/dashboard/DashboardPage';
import LoginPage from '../features/auth/LoginPage';
import PaymentCheckoutPage from '../features/payments/PaymentCheckoutPage';
import ExamFormListPage from '../features/exam-forms/ExamFormListPage';
import RegistrationListPage from '../features/registrations/RegistrationListPage';
import CreateRegistrationPage from '../features/registrations/CreateRegistrationPage';
import CandidateListPage from '../features/candidates/CandidateListPage';
import PaymentQueuePage from '../features/payments/PaymentQueuePage';
import ViewTempThisinh from '../pages/ViewTempThisinh';
import AppShellLayout from './AppShellLayout';
import { PATHS, ROLES } from './routes';
import { UnavailableModule } from '../ui';

function AppRoutes() {
  return <Routes>
    <Route path={PATHS.login} element={<LoginPage />} />
    <Route path="/login" element={<Navigate to={PATHS.login} replace />} />
    <Route path="/register" element={<Navigate to={PATHS.registrationCreate} replace />} />
    <Route element={<ProtectedRoute />}>
      <Route element={<AppShellLayout />}>
        <Route path={PATHS.home} element={<DashboardPage />} />
        <Route element={<RoleRoute roles={[ROLES.reception]} />}>
          <Route path={PATHS.registrations} element={<RegistrationListPage />} />
          <Route path={PATHS.registrationCreate} element={<CreateRegistrationPage />} />
          <Route path={PATHS.extensions} element={<ExtensionListPage />} />
          <Route path={PATHS.extensionCreate} element={<CreateExtensionPage />} />
          <Route path={PATHS.temporaryCandidates} element={<ViewTempThisinh />} />
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
    <Route path="*" element={<Navigate to={PATHS.login} replace />} />
  </Routes>;
}

export default function AppRouter({ initialEntries }) {
  if (initialEntries) return <MemoryRouter initialEntries={initialEntries}><AppRoutes /></MemoryRouter>;
  return <BrowserRouter><AppRoutes /></BrowserRouter>;
}
