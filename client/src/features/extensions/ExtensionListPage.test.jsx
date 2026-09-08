import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import ExtensionListPage from './ExtensionListPage';
import { listExamForms } from '../exam-forms/api';

vi.mock('../exam-forms/api', () => ({ listExamForms: vi.fn() }));

beforeEach(() => {
  listExamForms.mockImplementation(({ page }) => Promise.resolve({
    items: [{
      examFormId: page === 2 ? 'PDT000002' : 'PDT000001',
      candidateId: 'TS000001',
      examDate: '2030-05-12',
      remainingAttempts: 1,
    }],
    page,
    pageSize: 20,
    totalItems: 21,
    totalPages: 2,
  }));
});

it('loads the selected URL page when the user goes to the next extension page', async () => {
  render(<MemoryRouter initialEntries={['/giahan?page=1']}><ExtensionListPage /></MemoryRouter>);

  expect(await screen.findByText('PDT000001')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Trang sau' }));

  await waitFor(() => expect(listExamForms).toHaveBeenLastCalledWith(
    expect.objectContaining({ page: 2, pageSize: 20 }),
    expect.objectContaining({ signal: expect.any(AbortSignal) }),
  ));
  expect(await screen.findByText('PDT000002')).toBeInTheDocument();
});
