import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import DashboardPage from './DashboardPage';

vi.mock('../../auth/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Nguyễn Văn A', role: 'Tiếp nhận' } }),
}));

function LocationProbe() {
  return <output data-testid="pathname">{useLocation().pathname}</output>;
}

it('shows only the signed-in role actions and opens the selected workspace', () => {
  render(<MemoryRouter initialEntries={['/home']}><DashboardPage /><LocationProbe /></MemoryRouter>);

  expect(screen.getByRole('heading', { name: /Xin chào, Nguyễn Văn A/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Lập phiếu đăng ký' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Thanh toán' })).not.toBeInTheDocument();

  fireEvent.click(within(screen.getByRole('main')).getByRole('button', { name: 'Gia hạn chứng chỉ' }));
  expect(screen.getByTestId('pathname')).toHaveTextContent('/giahan');
});
