import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, Page } from '../../ui';
import { useAuth } from '../../auth/AuthContext';
import { navigationByRole } from '../../app/routes';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const links = navigationByRole[user?.role] || [];

  return <Page
    title={`Xin chào, ${user?.name || 'bạn'}`}
    description="Mọi công việc, trong một không gian rõ ràng."
  >
    <section className={styles.overview} aria-labelledby="workspace-actions">
      <div className={styles.summary}>
        <p>KHÔNG GIAN LÀM VIỆC</p>
        <span>{user?.role}</span>
      </div>
      <div className={styles.heading}>
        <div>
          <h2 id="workspace-actions">Bắt đầu công việc</h2>
          <p>Chọn chức năng bạn cần thực hiện.</p>
        </div>
      </div>
      <div className={styles.actions}>
        {links.map((link) => <button
          key={link.to}
          type="button"
          className={styles.actionCard}
          aria-label={link.label}
          onClick={() => navigate(link.to)}
        >
          <span className={styles.icon}><Icon name={link.icon} /></span>
          <span className={styles.actionContent}>
            <strong>{link.label}</strong>
            <small>{link.description}</small>
          </span>
          <Icon name="arrow" size={18} />
        </button>)}
      </div>
    </section>
  </Page>;
}
