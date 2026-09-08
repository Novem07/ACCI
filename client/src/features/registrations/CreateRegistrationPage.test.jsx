import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import CreateRegistrationPage from './CreateRegistrationPage';
import { createRegistration, listCertificates } from './api';
import { createCustomer, listCustomers } from '../customers/api';

vi.mock('./api', () => ({ createRegistration: vi.fn(), listCertificates: vi.fn() }));
vi.mock('../customers/api', () => ({ createCustomer: vi.fn(), listCustomers: vi.fn() }));

function renderPage() {
  return render(<MemoryRouter><CreateRegistrationPage /></MemoryRouter>);
}

beforeEach(() => {
  vi.clearAllMocks();
  listCustomers.mockResolvedValue({ items: [{ id: 'KH000001', fullName: 'Nguyễn Văn A' }] });
  listCertificates.mockResolvedValue([{ id: 'CC001', name: 'Chứng chỉ mẫu' }]);
  createCustomer.mockResolvedValue({ id: 'KH000002', fullName: 'Khách hàng mới' });
  createRegistration.mockResolvedValue({ id: 'PDK000001' });
});

it('selects a customer, adds a candidate, and submits only server-accepted fields', async () => {
  renderPage();

  await screen.findByRole('option', { name: 'KH000001 — Nguyễn Văn A' });
  await userEvent.selectOptions(screen.getByLabelText(/Chọn khách hàng/), 'KH000001');
  await userEvent.type(screen.getByLabelText(/Họ tên thí sinh/), 'Trần Minh An');
  await userEvent.selectOptions(screen.getByLabelText(/Chứng chỉ/), 'CC001');
  await userEvent.type(screen.getByLabelText(/CCCD thí sinh/), '079123456789');
  await userEvent.type(screen.getByLabelText(/SĐT thí sinh/), '0901234567');
  await userEvent.type(screen.getByLabelText(/Email thí sinh/), 'an@example.com');
  await userEvent.type(screen.getByLabelText(/Địa chỉ thí sinh/), 'TP.HCM');
  await userEvent.click(screen.getByRole('button', { name: 'Thêm thí sinh' }));

  await screen.findByText('Trần Minh An');
  await userEvent.click(screen.getByRole('button', { name: 'Tạo phiếu đăng ký' }));
  await waitFor(() => expect(createRegistration).toHaveBeenCalledWith({
    customerId: 'KH000001',
    candidates: [expect.objectContaining({ fullName: 'Trần Minh An', certificateId: 'CC001' })],
  }));

  const [payload] = createRegistration.mock.calls[0];
  expect(payload).not.toHaveProperty('registrationDate');
  expect(payload.candidates[0]).not.toHaveProperty('clientId');
});
