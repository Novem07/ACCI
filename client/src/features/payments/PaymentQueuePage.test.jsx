import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import PaymentQueuePage from './PaymentQueuePage';
import { listPayments } from './api';

vi.mock('./api', () => ({ listPayments: vi.fn() }));

beforeEach(() => {
  listPayments.mockResolvedValue({
    items: [
      { registrationId: 'PDK000001', customerId: 'KH000001', customerName: 'Nguyễn Văn A', organization: 'Không', registrationDate: '2030-05-06', invoiceId: null, status: 'unpaid' },
      { registrationId: 'PDK000002', customerId: 'KH000002', customerName: 'Trần B', organization: 'ACCI', registrationDate: '2030-05-05', invoiceId: 'HD000001', status: 'paid' },
    ],
    page: 1, pageSize: 20, totalItems: 2, totalPages: 1,
  });
});

it('shows unpaid rows as actionable and paid rows as receipts', async () => {
  render(<MemoryRouter initialEntries={['/ketoan']}><PaymentQueuePage /></MemoryRouter>);

  expect(await screen.findByRole('link', { name: 'Xử lý PDK000001' })).toBeInTheDocument();
  expect(screen.getByText('Đã thanh toán', { selector: 'span' })).toBeInTheDocument();
  expect(screen.getByText('HD000001')).toBeInTheDocument();
});
