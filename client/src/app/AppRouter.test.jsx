import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import AppRouter from './AppRouter';

const authState = vi.hoisted(() => ({ role: 'Tiếp nhận' }));

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Nhân viên', role: authState.role },
    loading: false,
    logout: vi.fn().mockResolvedValue(undefined),
  }),
}));

afterEach(() => { authState.role = 'Tiếp nhận'; });

it('keeps the same shell node while navigating between authenticated pages', async () => {
  render(<AppRouter initialEntries={['/home']} />);

  const shell = screen.getByTestId('app-shell');
  await userEvent.click(screen.getByRole('link', { name: 'Phiếu đăng ký' }));

  expect(screen.getByTestId('app-shell')).toBe(shell);
});

it('shows an intentional unavailable state for an unfinished role module', async () => {
  authState.role = 'Nhập liệu';
  render(<AppRouter initialEntries={['/nhaplieu']} />);

  expect(await screen.findByRole('heading', { name: 'Nhập liệu' })).toBeInTheDocument();
  expect(screen.getByText(/quy trình nghiệp vụ được phê duyệt/)).toBeInTheDocument();
});
