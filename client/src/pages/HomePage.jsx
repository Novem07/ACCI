import React from 'react';
import './HomePage.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import AppShell from '../components/AppShell';

function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <AppShell>
      <main className="homepage-container">
        <h2>Xin chào, <strong>{user?.name}</strong>!</h2>
        <p>Bạn đang đăng nhập với vai trò <strong>Nhân viên {user?.role}</strong>. Các chức năng phù hợp sẽ hiển thị bên dưới.</p>

        <div className="card-group">
          <button type="button" className="function-card" onClick={() => navigate('/taophieu')}>
            <svg className="icon" viewBox="0 0 24 24" aria-hidden="true" width="32" height="32">
              <path d="M4 4h16v2H4V4zm0 4h10v2H4V8zm0 4h16v2H4v-2zm0 4h10v2H4v-2z" />
            </svg>
            <span className="title">Lập phiếu đăng ký</span>
          </button>

          <button type="button" className="function-card" onClick={() => navigate('/giahan')}>
            <svg className="icon" viewBox="0 0 24 24" aria-hidden="true" width="32" height="32">
              <path d="M12 4V1L8 5l4 4V6c3.3 0 6 2.7 6 6s-2.7 6-6 6a6 6 0 0 1-5.9-5H4a8 8 0 0 0 8 8c4.4 0 8-3.6 8-8s-3.6-8-8-8z" />
            </svg>
            <span className="title">Gia hạn chứng chỉ</span>
          </button>

          <button type="button" className="function-card" onClick={() => navigate('/phieuduthi')}>
            <svg className="icon" viewBox="0 0 24 24" aria-hidden="true" width="32" height="32">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v16l4-4h12c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
            </svg>
            <span className="title">Kết quả & chứng chỉ</span>
          </button>
        </div>
      </main>
    </AppShell>
  );
}

export default HomePage;
