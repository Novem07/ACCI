import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProcessRegister from './ProcessRegister';

const mocks = vi.hoisted(() => ({
  api: { get: vi.fn(), post: vi.fn() },
  useAuth: vi.fn(() => ({ user: { name: 'Kế toán', role: 'Kế Toán' }, logout: vi.fn() })),
}));

vi.mock('../api/client', () => ({
  api: mocks.api,
  getErrorMessage: (error, fallback) => error?.message || fallback,
}));
vi.mock('../auth/AuthContext', () => ({ useAuth: mocks.useAuth }));

describe('ProcessRegister', () => {
  beforeEach(() => {
    mocks.api.get.mockReset();
    mocks.api.post.mockReset();
    mocks.api.get.mockImplementation((path) => {
      if (path === '/payments/PDK000001') return Promise.resolve({ payment: { registrationId: 'PDK000001', customerName: 'Khách hàng' } });
      if (path === '/payments/PDK000001/quote') return Promise.resolve({ quote: { registrationId: 'PDK000001', customerName: 'Khách hàng', customerPhone: '0901234567', candidateCount: 1, baseAmount: 100000, discountRate: 0, discountAmount: 0, totalAmount: 100000 } });
      return Promise.resolve({});
    });
    mocks.api.post.mockResolvedValue({ invoice: { invoiceId: 'HD000001' } });
  });

  it('creates an invoice with the canonical payment endpoint', async () => {
    render(
      <MemoryRouter initialEntries={['/ketoan/xuly/PDK000001']}>
        <Routes><Route path="/ketoan/xuly/:maPDK" element={<ProcessRegister />} /></Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('PDK000001')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Phương thức thanh toán'), { target: { value: 'Chuyển khoản' } });
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận thanh toán' }));

    await waitFor(() => expect(mocks.api.post).toHaveBeenCalledWith('/payments/PDK000001/invoices', expect.objectContaining({ paymentMethod: 'Chuyển khoản' })));
  });
});
