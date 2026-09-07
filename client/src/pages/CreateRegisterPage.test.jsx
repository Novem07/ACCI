import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CreateRegisterPage from './CreateRegisterPage';

const mocks = vi.hoisted(() => ({
  api: { get: vi.fn(), post: vi.fn() },
  useAuth: vi.fn(() => ({ user: { name: 'Nhân viên', role: 'Tiếp nhận' }, logout: vi.fn() })),
}));

vi.mock('../api/client', () => ({
  api: mocks.api,
  getErrorMessage: (error, fallback) => error?.message || fallback,
}));
vi.mock('../auth/AuthContext', () => ({ useAuth: mocks.useAuth }));

describe('CreateRegisterPage', () => {
  beforeEach(() => {
    mocks.api.get.mockReset();
    mocks.api.post.mockReset();
    mocks.api.get.mockImplementation((path) => {
      if (path === '/customers') return Promise.resolve({ customers: [{ MaKhachHang: 'KH000001', HoTen: 'Khách hàng', DonVi: 'Không', SDT: '0901234567', Email: 'kh@example.com', DiaChi: 'Hà Nội' }] });
      if (path === '/catalog/certificates') return Promise.resolve({ certificates: [{ id: 'CC01', name: 'Chứng chỉ mẫu' }] });
      return Promise.resolve({});
    });
    mocks.api.post.mockResolvedValue({ registration: { id: 'PDK000001' } });
  });

  it('submits the canonical registration payload without client-owned identity fields', async () => {
    render(<MemoryRouter><CreateRegisterPage /></MemoryRouter>);
    await waitFor(() => expect(screen.getByRole('option', { name: /KH000001/ })).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('Khách hàng đã có'), { target: { value: 'KH000001' } });
    fireEvent.change(screen.getByPlaceholderText('Họ tên thí sinh'), { target: { value: 'Thí sinh mẫu' } });
    fireEvent.change(screen.getAllByPlaceholderText('CCCD')[1], { target: { value: '012345678901' } });
    fireEvent.change(screen.getAllByPlaceholderText('SĐT')[1], { target: { value: '0907654321' } });
    fireEvent.change(screen.getAllByPlaceholderText('Email')[1], { target: { value: 'ts@example.com' } });
    fireEvent.change(screen.getAllByPlaceholderText('Địa chỉ')[1], { target: { value: 'Đà Nẵng' } });
    fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: 'CC01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Thêm thí sinh' }));
    await waitFor(() => expect(screen.getByText(/Thí sinh mẫu/)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Tạo phiếu' }));
    await waitFor(() => expect(mocks.api.post).toHaveBeenCalledWith('/registrations', expect.objectContaining({
      customerId: 'KH000001',
      candidates: [expect.objectContaining({ fullName: 'Thí sinh mẫu', certificateId: 'CC01' })],
    })));

    const [, payload] = mocks.api.post.mock.calls.find(([path]) => path === '/registrations');
    expect(payload).not.toHaveProperty('NguoiTao');
    expect(payload).not.toHaveProperty('status');
  });
});
