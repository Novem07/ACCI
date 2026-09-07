import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Icon from '../components/Icon';
import { navigationByRole } from '../app/routes';
import './HomePage.css';

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const links = navigationByRole[user?.role] || [];
  return <main className="homepage-container">
    <section className="welcome-panel"><p className="eyebrow">ACCI / KHÔNG GIAN LÀM VIỆC</p><h1>Xin chào, {user?.name}.</h1><p>Mọi công việc, trong một không gian rõ ràng.</p><span className="role-badge">{user?.role}</span></section>
    <div className="section-heading"><h2>Bắt đầu công việc</h2><p>Chọn chức năng bạn cần thực hiện.</p></div>
    <div className="card-group">{links.map((link) => <button aria-label={link.label} key={link.to} type="button" className="function-card" onClick={() => navigate(link.to)}><span className="card-icon"><Icon name={link.icon} /></span><strong>{link.label}</strong><span className="card-description">{link.description}</span><span className="card-arrow"><Icon name="arrow" /></span></button>)}</div>
  </main>;
}
