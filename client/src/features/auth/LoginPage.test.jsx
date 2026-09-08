import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import LoginPage from './LoginPage';

const login = vi.fn();
vi.mock('../../auth/AuthContext', () => ({ useAuth: () => ({ login }) }));
beforeEach(() => login.mockReset());
afterEach(cleanup);

function LocationProbe() { return <output data-testid="location">{useLocation().pathname}</output>; }

it('returns the user to the requested protected route after login', async () => {
  login.mockResolvedValueOnce({ role: 'Tiếp nhận' });
  render(<MemoryRouter initialEntries={[{ pathname: '/', state: { from: '/giahan' } }]}><LoginPage /><LocationProbe /></MemoryRouter>);
  await userEvent.type(screen.getByLabelText(/Mã nhân viên/), 'NV001');
  await userEvent.type(screen.getByLabelText(/Mật khẩu/), 'secret');
  await userEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/giahan'));
});

it('shows failed login inline without opening a dialog', async () => {
  login.mockRejectedValueOnce(new Error('Sai tài khoản hoặc mật khẩu'));
  render(<MemoryRouter><LoginPage /></MemoryRouter>);
  await userEvent.type(screen.getByLabelText(/Mã nhân viên/), 'NV001');
  await userEvent.type(screen.getByLabelText(/Mật khẩu/), 'wrong');
  await userEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Sai tài khoản hoặc mật khẩu');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('exposes the password visibility state while toggling the field', async () => {
  render(<MemoryRouter><LoginPage /></MemoryRouter>);
  const password = screen.getByLabelText(/Mật khẩu/);
  const toggle = screen.getByRole('button', { name: 'Hiện mật khẩu' });

  expect(password).toHaveAttribute('type', 'password');
  expect(toggle).toHaveAttribute('aria-pressed', 'false');

  await userEvent.click(toggle);

  expect(password).toHaveAttribute('type', 'text');
  expect(screen.getByRole('button', { name: 'Ẩn mật khẩu' })).toHaveAttribute('aria-pressed', 'true');
});
