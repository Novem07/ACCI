import React, { useState } from 'react';
import './LoginPage.css';
import { useNavigate } from 'react-router-dom';
import WarningModal from '../components/WarningModal';
import { useAuth } from '../auth/AuthContext';

function LoginPage() {
  const [maNhanVien, setMaNhanVien] = useState('');
  const [matKhau, setMatKhau] = useState('');  
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showWrongModal, setShowWrongModal] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      const user = await login({ employeeId: maNhanVien, password: matKhau });

      // Điều hướng theo vai trò
      switch (user.role) {
        case 'Tiếp nhận':
          navigate('/tiepnhan');
          break;
        case 'Kế Toán':
          navigate('/ketoan');
          break;
        case 'Tổ chức thi':
          navigate('/tochucthi');
          break;
        case 'Nhập liệu':
          navigate('/nhaplieu');
          break;
        case 'Coi thi':
          navigate('/coithi');
          break;
        default:
          navigate('/home');
          break;
      }
    } catch {
      setShowWrongModal(true);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-box">
          <h1 className="logo-text">ACCI Center</h1>
          <p className="subtext">Đăng nhập vào hệ thống quản lý chứng chỉ</p>

          <form onSubmit={handleLogin}>
          <div className="form-group">
          <label htmlFor="employee-id">Mã nhân viên</label>
          <input
            id="employee-id"
            type="text"
            placeholder="Nhập mã nhân viên"
            value={maNhanVien}
            onChange={(e) => setMaNhanVien(e.target.value.trim())}
          />
          </div>

          <div className="form-group password-group">
            <label htmlFor="employee-password">Mật khẩu</label>
            <div className="password-wrapper">
              <input
                id="employee-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Nhập mật khẩu"
                value={matKhau}
                onChange={(e) => setMatKhau(e.target.value)}
              />
              <button type="button" className="toggle-password" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  // 👁️ Mắt mở
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#777" viewBox="0 0 24 24">
                    <path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 
                    12c-2.76 0-5-2.24-5-5s2.24-5 5-5 
                    5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 
                    0-3 1.34-3 3s1.34 3 3 3 
                    3-1.34 3-3-1.34-3-3-3z"/>
                  </svg>
                ) : (
                  // 🙈 Mắt nhắm
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#bbb" viewBox="0 0 24 24">
                    <path d="M12 6a9.77 9.77 0 0 1 8.94 6A9.77 9.77 0 0 1 12 18a9.77 
                    9.77 0 0 1-8.94-6A9.77 9.77 0 0 1 12 6m0-2C5 
                    4 1 12 1 12s4 8 11 8 11-8 
                    11-8-4-8-11-8zm0 5a3 3 0 0 
                    0-3 3c0 .38.07.74.2 1.08l4.88-4.88A3 3 0 0 
                    0 12 9zM4.27 3L3 4.27l4.1 
                    4.1A5.98 5.98 0 0 0 6 12c0 
                    3.31 2.69 6 6 6 1.46 0 
                    2.79-.54 3.8-1.42l4.73 
                    4.73L21 20.73 4.27 3z"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
          <button className="login-btn" type="submit">
            Đăng nhập
          </button>
          </form>
        </div>

        <div className="logo-side">
          <img src="/LogoACCI.png" alt="Logo ACCI" className="logo-image" />
        </div>
      </div>
      {showWrongModal && (
        <WarningModal
          message="Sai tài khoản hoặc mật khẩu!"
          onClose={() => setShowWrongModal(false)}
        />
      )}
    </div>
  );
}

export default LoginPage;
