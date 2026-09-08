import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { BrandLogo, Icon } from '../ui';
import { PATHS, navigationByRole } from './routes';
import { UnsavedChangesProvider, useUnsavedChanges } from './UnsavedChangesContext';
import styles from './AppShellLayout.module.css';

function getInitialTheme() {
  try { return localStorage.getItem('theme') || document.documentElement.dataset.theme || 'light'; } catch { return 'light'; }
}

export function AppShellFrame({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isDirty } = useUnsavedChanges();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(getInitialTheme);
  const menuButton = useRef(null);
  const links = navigationByRole[user?.role] || [];
  const page = [...links].reverse().find((item) => pathname === item.to || pathname.startsWith(`${item.to}/`));

  useEffect(() => { document.documentElement.dataset.theme = theme; try { localStorage.setItem('theme', theme); } catch { /* persistence is optional */ } }, [theme]);
  useEffect(() => {
    if (!open) return undefined;
    const menuButtonElement = menuButton.current;
    const onKeyDown = (event) => { if (event.key === 'Escape') setOpen(false); };
    const previousOverflow = document.body.style.overflow;
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKeyDown); document.body.style.overflow = previousOverflow; menuButtonElement?.focus(); };
  }, [open]);

  const closeMenu = () => setOpen(false);
  const guardNavigation = (event) => {
    if (isDirty && !window.confirm('Các thay đổi chưa lưu sẽ bị mất. Bạn muốn rời trang?')) {
      event.preventDefault();
      return;
    }
    closeMenu();
  };
  const handleLogout = async () => { await logout().catch(() => undefined); navigate(PATHS.login); };
  return <div className={styles.shell} data-testid="app-shell">
    <button className={`${styles.scrim} ${open ? styles.scrimVisible : ''}`} type="button" tabIndex={open ? 0 : -1} aria-label="Đóng điều hướng" onClick={closeMenu} />
    <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ''}`} aria-label="Không gian làm việc">
      <NavLink className={styles.brand} to={PATHS.home} onClick={guardNavigation} aria-label="ACCI Center, về tổng quan"><BrandLogo compact decorative /><span>ACCI<small>CENTER</small></span></NavLink>
      <p className={styles.caption}>KHÔNG GIAN LÀM VIỆC</p>
      <nav className={styles.navigation} aria-label="Điều hướng chính">
        <NavLink end to={PATHS.home} onClick={guardNavigation}><Icon name="grid" /><span>Tổng quan</span></NavLink>
        {links.map((link) => <NavLink end key={link.to} to={link.to} onClick={guardNavigation}><Icon name={link.icon} /><span>{link.label}</span></NavLink>)}
      </nav>
      <div className={styles.roleNote}><span className={styles.roleDot} />{user?.role}<small>Hệ thống quản lý chứng chỉ</small></div>
    </aside>
    <div className={styles.workspace}>
      <header className={styles.header}>
        <button ref={menuButton} className={styles.iconButton} type="button" aria-label="Mở điều hướng" aria-expanded={open} onClick={() => setOpen((current) => !current)}><Icon name="menu" /></button>
        <div className={styles.pageContext}><span>Không gian làm việc</span><strong>{page?.label || 'Tổng quan'}</strong></div>
        <div className={styles.actions}><button className={styles.iconButton} type="button" onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))} aria-label="Đổi giao diện"><Icon name="moon" /></button><span className={styles.avatar} aria-hidden="true">{user?.name?.slice(0, 1) || 'A'}</span><span className={styles.user}><strong>{user?.name}</strong><small>{user?.role}</small></span><button className={styles.logoutButton} type="button" onClick={handleLogout}>Đăng xuất</button></div>
      </header>
      <div className={styles.content} data-testid="app-content">{children}</div>
      <footer className={styles.footer}>ACCI Center <span>Quản lý tập trung. Làm việc hiệu quả.</span></footer>
    </div>
  </div>;
}

export default function AppShellLayout() {
  return <UnsavedChangesProvider><AppShellFrame><Outlet /></AppShellFrame></UnsavedChangesProvider>;
}
