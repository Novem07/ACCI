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
        <BrandLogo />
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
              className={styles.reveal}
              onClick={() => setVisible((current) => !current)}
            >
              {visible ? '◉' : '○'}
            </IconButton>
          </span>
        </div>
        <Button type="submit" loading={submitting}>Đăng nhập</Button>
      </form>
    </section>
  </main>;
}
