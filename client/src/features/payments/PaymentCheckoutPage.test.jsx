import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import PaymentCheckoutPage from './PaymentCheckoutPage';
import { createInvoice, getCheckout } from './api';

vi.mock('./api', () => ({ listPayments: vi.fn(), getCheckout: vi.fn(), createInvoice: vi.fn() }));

beforeEach(() => {
  getCheckout.mockResolvedValue({ payment: { registrationId: 'PDK000001', customerName: 'Nguyễn Văn A', status: 'unpaid', invoiceId: null, registrationDate: '2030-05-06' }, quote: { currency: 'VND', baseAmount: 1000000, discountAmount: 100000, totalAmount: 900000 } });
  createInvoice.mockResolvedValue({ invoiceId: 'HD000001', paymentStatus: 'Đã thanh toán' });
});

it('shows the server quote and becomes a read-only receipt after payment', async () => {
  render(<MemoryRouter initialEntries={['/ketoan/xuly/PDK000001']}><Routes><Route path="/ketoan/xuly/:maPDK" element={<PaymentCheckoutPage />} /></Routes></MemoryRouter>);
  expect(await screen.findByText(/900\.000/)).toBeInTheDocument();
  await userEvent.selectOptions(screen.getByLabelText(/Phương thức thanh toán/), 'Chuyển khoản');
  await userEvent.click(screen.getByRole('button', { name: 'Xác nhận thanh toán' }));
  await waitFor(() => expect(createInvoice).toHaveBeenCalledWith('PDK000001', expect.objectContaining({ paymentMethod: 'Chuyển khoản' })));
  expect(await screen.findByRole('status')).toHaveTextContent('Thanh toán thành công');
  expect(screen.getByRole('button', { name: 'Đã thanh toán' })).toBeDisabled();
});
