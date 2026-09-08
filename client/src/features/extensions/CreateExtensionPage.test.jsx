import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import CreateExtensionPage from './CreateExtensionPage';
import { createExtension, getExtensionOptions } from './api';

vi.mock('./api', () => ({
  createExtension: vi.fn(),
  getExtensionOptions: vi.fn(),
}));

function renderPage() {
  render(<MemoryRouter initialEntries={['/giahan/create/PDT000001']}>
    <Routes><Route path="/giahan/create/:maPhieu" element={<CreateExtensionPage />} /></Routes>
  </MemoryRouter>);
}

beforeEach(() => {
  getExtensionOptions.mockResolvedValue({
    currentSchedule: { scheduleId: 'LT001' },
    schedules: [
      { scheduleId: 'LT002', examDate: '2030-05-12', examTime: '08:00', remainingSeats: 0, eligibility: { allowed: false, reason: 'SCHEDULE_FULL' } },
      { scheduleId: 'LT003', examDate: '2030-05-10', examTime: '12:00', remainingSeats: 3, eligibility: { allowed: false, reason: 'EXTENSION_WINDOW_CLOSED' } },
      { scheduleId: 'LT004', examDate: '2030-05-13', examTime: '08:00', remainingSeats: 3, eligibility: { allowed: true } },
    ],
  });
  createExtension.mockResolvedValue({ extension: { id: 'PGH000001' } });
});

it('explains why unavailable schedules cannot be selected', async () => {
  renderPage();

  expect(await screen.findByText(/Đã hết chỗ/)).toBeInTheDocument();
  expect(getExtensionOptions).toHaveBeenCalledWith('PDT000001', expect.objectContaining({ signal: expect.any(AbortSignal) }));
  expect(screen.getByRole('radio', { name: /LT002/ })).toBeDisabled();
  expect(screen.getByText(/Còn dưới 24 giờ/)).toBeInTheDocument();
});

it('submits the selected eligible schedule through the extension adapter', async () => {
  renderPage();

  await userEvent.click(await screen.findByRole('radio', { name: /LT004/ }));
  await userEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu gia hạn' }));

  await waitFor(() => expect(createExtension).toHaveBeenCalledWith({
    examFormId: 'PDT000001',
    caseType: 'Thường',
    newScheduleId: 'LT004',
  }));
});
