import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Icon from './Icon';
import { navigation } from './navigation';
import './AppShell.css';

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const links = navigation[user?.role] || [];
  const page = [...links].reverse().find((item) => pathname === item.to || pathname.startsWith(`${item.to}/`));

  useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark'); }, [theme]);
  const toggleTheme = () => { const next = theme === 'dark' ? 'light' : 'dark'; setTheme(next); localStorage.setItem('theme', next); };
  const handleLogout = async () => { await logout().catch(() => undefined); navigate('/'); };

  return <div className="app-shell">
    <aside className={`app-sidebar ${open ? 'is-open' : ''}`}>
      <NavLink className="app-brand" to="/home"><span className="brand-mark">A</span><span>ACCI <small>CENTER</small></span></NavLink>
      <p className="nav-caption">KHÔNG GIAN LÀM VIỆC</p>
      <nav id="workspace-navigation" className="app-nav" aria-label="Điều hướng chính">
        {[{ to: '/home', label: 'Tổng quan', icon: 'grid' }, ...links].map((link) => <NavLink end key={link.to} to={link.to} onClick={() => setOpen(false)}><Icon name={link.icon} /><span>{link.label}</span></NavLink>)}
      </nav>
      <div className="sidebar-note"><span className="role-dot" />{user?.role}<small>Hệ thống quản lý chứng chỉ</small></div>
    </aside>
    <div className="app-workspace">
      <header className="app-header">
        <button className="mobile-menu icon-button" type="button" aria-label="Mở điều hướng" aria-expanded={open} aria-controls="workspace-navigation" onClick={() => setOpen(!open)}><Icon name="menu" /></button>
        <div className="page-context"><span>Không gian làm việc</span><strong>{page?.label || 'Tổng quan'}</strong></div>
        <div className="app-actions"><button className="icon-button" type="button" onClick={toggleTheme} aria-label="Đổi giao diện"><Icon name="moon" /></button><span className="user-avatar" aria-hidden="true">{user?.name?.slice(0, 1) || 'A'}</span><span className="app-user">{user?.name}<small>{user?.role}</small></span><button type="button" onClick={handleLogout}>Đăng xuất</button></div>
      </header>
      <div className="app-content">{children}</div>
      <footer className="app-footer">ACCI Center <span>Quản lý tập trung. Làm việc hiệu quả.</span></footer>
    </div>
  </div>;
}
