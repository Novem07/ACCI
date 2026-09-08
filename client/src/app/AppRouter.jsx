import React from 'react';
import { BrowserRouter, MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../auth/ProtectedRoute';
import RoleRoute from '../auth/RoleRoute';
import AccountantPage from '../pages/AccountantPage';
import ExamFormDetail from '../pages/ExamFormDetail';
import ExtendFormPage from '../pages/ExtendFormPage';
import ExtendRegisterPage from '../pages/ExtendRegisterPage';
import HomePage from '../pages/HomePage';
import LoginPage from '../features/auth/LoginPage';
import ProcessRegister from '../pages/ProcessRegister';
import ViewExamForms from '../pages/ViewExamForms';
import RegistrationListPage from '../features/registrations/RegistrationListPage';
import CreateRegistrationPage from '../features/registrations/CreateRegistrationPage';
import CandidateListPage from '../features/candidates/CandidateListPage';
import ViewTempThisinh from '../pages/ViewTempThisinh';
import AppShellLayout from './AppShellLayout';
import { PATHS, ROLES } from './routes';

function UnavailablePage({ title }) {
  return <main className="page-wrapper"><h1>{title}</h1><p>Chức năng này đang được hoàn thiện và chưa sẵn sàng để sử dụng.</p></main>;
}

function AppRoutes() {
  return <Routes>
    <Route path={PATHS.login} element={<LoginPage />} />
    <Route path="/login" element={<Navigate to={PATHS.login} replace />} />
    <Route path="/register" element={<Navigate to={PATHS.registrationCreate} replace />} />
    <Route element={<ProtectedRoute />}>
      <Route element={<AppShellLayout />}>
        <Route path={PATHS.home} element={<HomePage />} />
        <Route element={<RoleRoute roles={[ROLES.reception]} />}>
          <Route path={PATHS.registrations} element={<RegistrationListPage />} />
          <Route path={PATHS.registrationCreate} element={<CreateRegistrationPage />} />
          <Route path={PATHS.extensions} element={<ExtendRegisterPage />} />
          <Route path={PATHS.extensionCreate} element={<ExtendFormPage />} />
          <Route path={PATHS.temporaryCandidates} element={<ViewTempThisinh />} />
        </Route>
        <Route element={<RoleRoute roles={[ROLES.accounting]} />}>
          <Route path={PATHS.accounting} element={<AccountantPage />} />
          <Route path={PATHS.accountingProcess} element={<ProcessRegister />} />
        </Route>
        <Route element={<RoleRoute roles={[ROLES.reception, ROLES.accounting, ROLES.examOrganization]} />}>
          <Route path={PATHS.candidates} element={<CandidateListPage />} />
          <Route path={PATHS.examForms} element={<ViewExamForms />} />
          <Route path={PATHS.examFormDetail} element={<ExamFormDetail />} />
        </Route>
        <Route element={<RoleRoute roles={[ROLES.examOrganization]} />}><Route path={PATHS.examOrganization} element={<UnavailablePage title="Tổ chức thi" />} /></Route>
        <Route element={<RoleRoute roles={[ROLES.dataEntry]} />}><Route path={PATHS.dataEntry} element={<UnavailablePage title="Nhập liệu" />} /></Route>
        <Route element={<RoleRoute roles={[ROLES.proctor]} />}><Route path={PATHS.proctor} element={<UnavailablePage title="Coi thi" />} /></Route>
      </Route>
    </Route>
    <Route path="*" element={<Navigate to={PATHS.login} replace />} />
  </Routes>;
}

export default function AppRouter({ initialEntries }) {
  if (initialEntries) return <MemoryRouter initialEntries={initialEntries}><AppRoutes /></MemoryRouter>;
  return <BrowserRouter><AppRoutes /></BrowserRouter>;
}
