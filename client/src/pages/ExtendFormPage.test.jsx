import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ExtendFormPage from './ExtendFormPage';

const mocks = vi.hoisted(() => ({
  api: { get: vi.fn(), post: vi.fn() },
  useAuth: vi.fn(() => ({ user: { name: 'Tiếp nhận', role: 'Tiếp nhận' }, logout: vi.fn() })),
}));

vi.mock('../api/client', () => ({
  api: mocks.api,
  getErrorMessage: (error, fallback) => error?.message || fallback,
}));
vi.mock('../auth/AuthContext', () => ({ useAuth: mocks.useAuth }));

describe('ExtendFormPage', () => {
  beforeEach(() => {
    mocks.api.get.mockResolvedValue({ schedules: [{ scheduleId: 'LT000001', examDate: '2030-01-01', examTime: '08:00:00', remainingSeats: 10 }] });
    mocks.api.post.mockResolvedValue({ extension: { id: 'PDGH000001' } });
  });

  it('sends only server-owned extension input', async () => {
    render(
      <MemoryRouter initialEntries={['/giahan/create/PDT000001']}>
        <Routes><Route path="/giahan/create/:maPhieu" element={<ExtendFormPage />} /></Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByRole('option', { name: /LT000001/ })).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText('Thường'));
    fireEvent.change(screen.getByLabelText('Chọn lịch thi mới'), { target: { value: 'LT000001' } });
    fireEvent.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }));

    await waitFor(() => expect(mocks.api.post).toHaveBeenCalledWith('/extensions', {
      examFormId: 'PDT000001',
      caseType: 'Thường',
      newScheduleId: 'LT000001',
    }));
  });
});
