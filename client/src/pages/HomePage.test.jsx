import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import HomePage from './HomePage';

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Nguyễn Văn A', role: 'Tiếp nhận' },
    logout: vi.fn(),
  }),
}));

afterEach(cleanup);

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="pathname">{location.pathname}</output>;
}

it.each([
  ['Lập phiếu đăng ký', '/taophieu'],
  ['Gia hạn chứng chỉ', '/giahan'],
  ['Phiếu dự thi', '/phieuduthi'],
])('navigates the %s card to %s', (label, path) => {
  render(
    <MemoryRouter initialEntries={['/home']}>
      <HomePage />
      <LocationProbe />
    </MemoryRouter>
  );

  fireEvent.click(within(screen.getByRole('main')).getByRole('button', { name: label }));

  expect(screen.getByTestId('pathname')).toHaveTextContent(path);
});
