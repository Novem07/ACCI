import React from 'react';
import { Button } from '../../../ui';
import styles from '../CreateRegistrationPage.module.css';

export default function RegistrationSummary({ customer, candidateCount, submitting, onSubmit, onCancel }) {
  return <aside className={styles.summary} aria-label="Tóm tắt phiếu đăng ký">
    <div><strong>{customer ? `${customer.id} — ${customer.fullName}` : 'Chưa chọn khách hàng'}</strong><span>{candidateCount} thí sinh</span></div>
    <div className="inlineActions"><Button type="button" variant="quiet" onClick={onCancel}>Hủy</Button><Button type="button" loading={submitting} onClick={onSubmit}>Tạo phiếu đăng ký</Button></div>
  </aside>;
}
