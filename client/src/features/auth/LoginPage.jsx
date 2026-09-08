import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { getLandingPath } from '../../app/routes';
import { Alert, BrandLogo, Button, FormField, IconButton, TextInput } from '../../ui';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login({ employeeId: employeeId.trim(), password });
      navigate(location.state?.from || getLandingPath(user.role), { replace: true });
    } catch (requestError) {
      setError(requestError.message || 'Sai tài khoản hoặc mật khẩu');
    } finally {
      setSubmitting(false);
    }
  }

  return <main className={styles.page}>
    <section className={styles.card}>
      <div className={styles.intro}>
        <BrandLogo monochrome />
        <p>Đăng nhập để quản lý hồ sơ chứng chỉ trong một không gian rõ ràng và an toàn.</p>
      </div>
      <form className={styles.form} onSubmit={submit}>
        {error && <Alert tone="danger" title="Không thể đăng nhập">{error}</Alert>}
        <FormField id="employee-id" label="Mã nhân viên" required>
          <TextInput autoComplete="username" value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} />
        </FormField>
        <div className={styles.passwordField}>
          <label htmlFor="employee-password">Mật khẩu <span aria-hidden="true">*</span></label>
          <span className={styles.password}>
            <TextInput
              id="employee-password"
              required
              type={visible ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <IconButton
              label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              aria-pressed={visible}
              className={styles.reveal}
              onClick={() => setVisible((current) => !current)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {visible ? <><path d="m3 3 18 18" /><path d="M10.6 10.7a3 3 0 0 0 4.2 4.2" /><path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5.5 0 9.2 5.5 9.2 8s-1.3 4.3-3.3 5.8" /><path d="M6.2 6.2C4.1 7.8 2.8 10 2.8 12c0 2.5 3.7 8 9.2 8 1.4 0 2.7-.4 3.8-.9" /></> : <><path d="M2.8 12S6.5 4 12 4s9.2 5.5 9.2 8-3.7 8-9.2 8-9.2-5.5-9.2-8Z" /><circle cx="12" cy="12" r="3" /></>}
              </svg>
            </IconButton>
          </span>
        </div>
        <Button type="submit" loading={submitting}>Đăng nhập</Button>
      </form>
    </section>
  </main>;
}
