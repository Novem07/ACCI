import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './AppShell.css';

const roleLinks = {
  'Tiếp nhận': [
    { to: '/tiepnhan', label: 'Phiếu đăng ký' },
    { to: '/taophieu', label: 'Tạo phiếu' },
    { to: '/giahan', label: 'Gia hạn' },
    { to: '/xemthisinh', label: 'Thí sinh' },
    { to: '/phieuduthi', label: 'Phiếu dự thi' },
  ],
  'Kế Toán': [
    { to: '/ketoan', label: 'Thanh toán' },
    { to: '/xemthisinh', label: 'Thí sinh' },
    { to: '/phieuduthi', label: 'Phiếu dự thi' },
  ],
  'Tổ chức thi': [
    { to: '/tochucthi', label: 'Tổ chức thi' },
    { to: '/phieuduthi', label: 'Phiếu dự thi' },
    { to: '/xemthisinh', label: 'Thí sinh' },
  ],
};

function AppShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system');
  const links = useMemo(() => roleLinks[user?.role] || [], [user?.role]);

  useEffect(() => {
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', theme === 'dark' || (theme === 'system' && prefersDark));
  }, [theme]);

  const handleLogout = async () => {
    await logout().catch(() => undefined);
    navigate('/');
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <NavLink className="app-brand" to="/home">ACCI CENTER</NavLink>
        <nav className="app-nav" aria-label="Điều hướng chính">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => (isActive ? 'active' : undefined)}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="app-actions">
          <span className="app-user">👤 {user?.name}</span>
          <button type="button" onClick={toggleTheme} aria-label="Đổi giao diện">◐</button>
          <button type="button" onClick={handleLogout}>Đăng xuất</button>
        </div>
      </header>
      <div className="app-content">{children}</div>
    </div>
  );
}

export default AppShell;
