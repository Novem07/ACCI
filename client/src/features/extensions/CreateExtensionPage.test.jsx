import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import CreateExtensionPage from './CreateExtensionPage';

vi.mock('../../api/client', () => ({ api: { get: vi.fn().mockResolvedValue({ currentSchedule: { scheduleId: 'LT001' }, schedules: [{ scheduleId: 'LT002', examDate: '2030-05-12', examTime: '08:00', remainingSeats: 0, eligibility: { allowed: false, reason: 'SCHEDULE_FULL' } }, { scheduleId: 'LT003', examDate: '2030-05-10', examTime: '12:00', remainingSeats: 3, eligibility: { allowed: false, reason: 'EXTENSION_WINDOW_CLOSED' } }] }), post: vi.fn() }, getErrorMessage: (error) => error.message }));

it('explains why unavailable schedules cannot be selected', async () => {
  render(<MemoryRouter initialEntries={['/giahan/create/PDT000001']}><Routes><Route path="/giahan/create/:maPhieu" element={<CreateExtensionPage />} /></Routes></MemoryRouter>);
  expect(await screen.findByText(/Đã hết chỗ/)).toBeInTheDocument();
  expect(screen.getByRole('radio', { name: /LT002/ })).toBeDisabled();
  expect(screen.getByText(/Còn dưới 24 giờ/)).toBeInTheDocument();
});
