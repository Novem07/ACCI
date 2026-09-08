import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import CandidateListPage from './CandidateListPage';
import { listCandidates } from './api';

vi.mock('./api', () => ({ listCandidates: vi.fn() }));

beforeEach(() => {
  listCandidates.mockResolvedValue({
    items: [{ id: 'TS000001', fullName: 'Nguyễn Minh An', citizenId: '079123456789', phone: '0901234567', email: 'an@example.com', address: 'TP.HCM' }],
    page: 1, pageSize: 20, totalItems: 1, totalPages: 1,
  });
});

it('preserves candidate search in the URL and sends it to the adapter', async () => {
  render(<MemoryRouter initialEntries={['/xemthisinh?query=Nguyen&page=1']}><CandidateListPage /></MemoryRouter>);

  await waitFor(() => expect(listCandidates).toHaveBeenCalledWith({ page: 1, pageSize: 20, query: 'Nguyen' }, expect.objectContaining({ signal: expect.any(AbortSignal) })));
  expect(await screen.findByRole('table', { name: 'Danh sách thí sinh' })).toBeInTheDocument();
  expect(screen.getByRole('searchbox', { name: 'Tìm thí sinh' })).toHaveValue('Nguyen');
});
