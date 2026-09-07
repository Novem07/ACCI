import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import RoleRoute from './auth/RoleRoute';
import AppShell from './components/AppShell';

import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import ViewRegisterPage from './pages/ViewRegisterPage';
import CreateRegisterPage from './pages/CreateRegisterPage';
import ViewStudentListPage from './pages/ViewStudentListPage';
import ViewExamForms from './pages/ViewExamForms';
import ExamFormDetail from './pages/ExamFormDetail';
import ExtendRegisterPage from './pages/ExtendRegisterPage';
import AccountantPage from './pages/AccountantPage';
import ProcessRegister from './pages/ProcessRegister';
import ViewTempThisinh from './pages/ViewTempThisinh';
import ExtendFormPage from './pages/ExtendFormPage';

const ToChucThiPage = () => <AppShell><main><h2>Trang Tổ chức thi</h2></main></AppShell>;
const NhapLieuPage = () => <AppShell><main><h2>Trang Nhập liệu</h2></main></AppShell>;
const CoiThiPage = () => <AppShell><main><h2>Trang Coi thi</h2></main></AppShell>;

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/register" element={<Navigate to="/taophieu" replace />} />
          <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/tiepnhan" element={<RoleRoute roles={['Tiếp nhận']}><ViewRegisterPage /></RoleRoute>} />
          <Route path="/ketoan" element={<RoleRoute roles={['Kế Toán']}><AccountantPage /></RoleRoute>} />
          <Route path="/tochucthi" element={<RoleRoute roles={['Tổ chức thi']}><ToChucThiPage /></RoleRoute>} />
          <Route path="/nhaplieu" element={<RoleRoute roles={['Nhập liệu']}><NhapLieuPage /></RoleRoute>} />
          <Route path="/coithi" element={<RoleRoute roles={['Coi thi']}><CoiThiPage /></RoleRoute>} />
          <Route path="/taophieu" element={<RoleRoute roles={['Tiếp nhận']}><CreateRegisterPage /></RoleRoute>} />
          <Route path="/xemthisinh" element={<RoleRoute roles={['Tiếp nhận', 'Kế Toán', 'Tổ chức thi']}><ViewStudentListPage /></RoleRoute>} />
          <Route path="/xemtempthisinh" element={<RoleRoute roles={['Tiếp nhận']}><ViewTempThisinh /></RoleRoute>} />
          <Route path="/phieuduthi" element={<RoleRoute roles={['Tiếp nhận', 'Kế Toán', 'Tổ chức thi']}><ViewExamForms /></RoleRoute>} />
          <Route path="/phieuduthi/:id" element={<RoleRoute roles={['Tiếp nhận', 'Kế Toán', 'Tổ chức thi']}><ExamFormDetail /></RoleRoute>} />
          <Route path="/ketoan/xuly/:maPDK" element={<RoleRoute roles={['Kế Toán']}><ProcessRegister /></RoleRoute>} />
          <Route path="/giahan" element={<RoleRoute roles={['Tiếp nhận']}><ExtendRegisterPage /></RoleRoute>} />
          <Route path="/giahan/create/:maPhieu" element={<RoleRoute roles={['Tiếp nhận']}><ExtendFormPage /></RoleRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
