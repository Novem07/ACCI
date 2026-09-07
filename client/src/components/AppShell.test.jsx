import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import AppShell from './AppShell';

const logout = vi.fn().mockResolvedValue(undefined);
vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Nhân viên', role: 'Tiếp nhận' }, logout }),
}));

it('renders semantic navigation and a real logout button', () => {
  render(<MemoryRouter initialEntries={['/tiepnhan']}><AppShell><form><label htmlFor="sample">Mẫu</label><input id="sample" /></form></AppShell></MemoryRouter>);

  expect(screen.getByRole('navigation', { name: 'Điều hướng chính' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Đăng xuất' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Phiếu đăng ký' })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByLabelText('Mẫu')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Đăng xuất' }));
  expect(logout).toHaveBeenCalledTimes(1);
});
