import React, { useState, useEffect } from 'react';
import './HomePage.css';
import LogoutModal from '../components/LogoutModal';
import { useNavigate } from 'react-router-dom';

function HomePage() {
  const user = JSON.parse(localStorage.getItem('user'));

  const navigate = useNavigate(); // ✅ THÊM
  const [showLogout, setShowLogout] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'system');

  const confirmLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  useEffect(() => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (theme === 'dark' || (theme === 'system' && prefersDark)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
  };

  return (
    <>
      {/* Navbar */}
      <nav className="custom-navbar">
        <div className="navbar-left">ACCI CENTER</div>
        <div className="navbar-right">
        <span className="nav-item" onClick={() => navigate('/home')}> Trang chủ</span>
          <span className="nav-item" onClick={() => navigate('/register')}> Phiếu đăng ký</span> {/* ✅ SỬA */}
          <span className="nav-item"> Gia hạn</span>
          <span className="nav-item"> Kết quả</span>
          <button className="logout-btn" onClick={() => setShowLogout(true)}>⏻ Đăng xuất</button>
          <button className="theme-toggle" onClick={toggleTheme}>🌗</button>
        </div>
      </nav>

      {/* Nội dung */}
      <div className="homepage-container">
        <h2>Xin chào, <strong>{user.name}</strong>!</h2>
        <p>Bạn đang đăng nhập với vai trò <strong> Nhân viên {user.role}</strong>. Các chức năng phù hợp sẽ hiển thị bên dưới.</p>

        <div className="card-group">
          <div
            className="function-card"
            onClick={() => navigate('/register')} // ✅ THÊM
            style={{ cursor: 'pointer' }}         // ✅ THÊM
          >
            <svg className="icon" viewBox="0 0 24 24" fill="#7e7ea4" width="32" height="32">
              <path d="M4 4h16v2H4V4zm0 4h10v2H4V8zm0 4h16v2H4v-2zm0 4h10v2H4v-2z" />
            </svg>
            <div className="title">Lập phiếu đăng ký</div>
          </div>

          <div className="function-card">
            <svg className="icon" viewBox="0 0 24 24" fill="#7e7ea4" width="32" height="32">
              <path d="M12 4V1L8 5l4 4V6c3.3 0 6 2.7 6 6s-2.7 6-6 6a6 6 0 0 1-5.9-5H4a8 8 0 0 0 8 8c4.4 0 8-3.6 8-8s-3.6-8-8-8z" />
            </svg>
            <div className="title">Gia hạn chứng chỉ</div>
          </div>

          <div className="function-card">
            <svg className="icon" viewBox="0 0 24 24" fill="#7e7ea4" width="32" height="32">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v16l4-4h12c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
            </svg>
            <div className="title">Kết quả & chứng chỉ</div>
          </div>
        </div>
      </div>

      {showLogout && (
        <LogoutModal
          onConfirm={confirmLogout}
          onCancel={() => setShowLogout(false)}
        />
      )}
    </>
  );
}

export default HomePage;
