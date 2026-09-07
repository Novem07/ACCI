import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import RegisterForm from './pages/RegisterFormPage';
import ViewRegisterPage from './pages/ViewRegisterPage';
import CreateRegisterPage from './pages/CreateRegisterPage';
import ViewStudentListPage from './pages/ViewStudentListPage';
import ViewExamForms from './pages/ViewExamForms';
import ExamFormDetail from './pages/ExamFormDetail';
import ExtendRegisterPage from './pages/ExtendRegisterPage';
import RenewRegisterPage from './pages/RenewRegisterPage';
import AccountantPage from './pages/AccountantPage';
import ProcessRegister from './pages/ProcessRegister';
import ViewTempThisinh from './pages/ViewTempThisinh';
import ExtendFormPage from './pages/ExtendFormPage';

// Dummy pages cho các vai trò
//const TiepNhanPage = () => <h2>Trang Tiếp nhận</h2>;
//const KeToanPage = () => <h2>Trang Kế toán</h2>;
const ToChucThiPage = () => <h2>Trang Tổ chức thi</h2>;
const NhapLieuPage = () => <h2>Trang Nhập liệu</h2>;
const CoiThiPage = () => <h2>Trang Coi thi</h2>;

// Hàm kiểm tra đăng nhập
const RequireAuth = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  return user ? children : <Navigate to="/" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/home" element={<RequireAuth><HomePage /></RequireAuth>} />
        <Route path="/register" element={<RegisterForm />} />

        {/* Route chia theo vai trò */}
        <Route path="/tiepnhan" element={<RequireAuth><ViewRegisterPage /></RequireAuth>} />
        <Route path="/ketoan" element={<RequireAuth><AccountantPage /></RequireAuth>} />
        <Route path="/tochucthi" element={<RequireAuth><ToChucThiPage /></RequireAuth>} />
        <Route path="/nhaplieu" element={<RequireAuth><NhapLieuPage /></RequireAuth>} />
        <Route path="/coithi" element={<RequireAuth><CoiThiPage /></RequireAuth>} />

        <Route path="/taophieu" element={<CreateRegisterPage />} />
        <Route path="/xemthisinh" element={<ViewStudentListPage />} />
        <Route path="/phieuduthi" element={<ViewExamForms />} />
        <Route path="/phieuduthi/:id" element={<ExamFormDetail />} />
        <Route path="/ketoan/xuly/:maPDK" element={<RequireAuth><ProcessRegister /></RequireAuth>} />
        <Route path="/giahan" element={<ExtendRegisterPage />} />
        <Route path="/giahan/:maPhieu" element={<RenewRegisterPage />} />
        <Route path="/xemthisinh" element={<ViewTempThisinh />} />
        <Route path="/giahan/create/:maPhieu" element={<RequireAuth><ExtendFormPage /></RequireAuth>} />
        {/* Nếu route không khớp, về trang login */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
