import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import AppRouter from './AppRouter';

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Nhân viên', role: 'Tiếp nhận' },
    loading: false,
    logout: vi.fn().mockResolvedValue(undefined),
  }),
}));

it('keeps the same shell node while navigating between authenticated pages', async () => {
  render(<AppRouter initialEntries={['/home']} />);

  const shell = screen.getByTestId('app-shell');
  await userEvent.click(screen.getByRole('link', { name: 'Phiếu đăng ký' }));

  expect(screen.getByTestId('app-shell')).toBe(shell);
});
