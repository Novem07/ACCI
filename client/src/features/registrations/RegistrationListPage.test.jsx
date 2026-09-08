import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import RegistrationListPage from './RegistrationListPage';
import { listRegistrations } from './api';

vi.mock('./api', () => ({ listRegistrations: vi.fn() }));

function renderPage(initialEntry = '/tiepnhan') {
  return render(<MemoryRouter initialEntries={[initialEntry]}><RegistrationListPage /></MemoryRouter>);
}

beforeEach(() => {
  vi.clearAllMocks();
  listRegistrations.mockResolvedValue({
    items: [{
      id: 'PDK000001', customerId: 'KH000001', candidateCount: 2,
      registrationDate: '2030-05-06', status: 'Chờ phát hành',
    }],
    page: 2, pageSize: 20, totalItems: 21, totalPages: 2,
  });
});

it('restores queue filters from the URL and sends them to the adapter', async () => {
  renderPage('/tiepnhan?page=2&query=PDK&status=Ch%E1%BB%9D%20ph%C3%A1t%20h%C3%A0nh');

  await waitFor(() => expect(listRegistrations).toHaveBeenCalledWith({
    page: 2, pageSize: 20, query: 'PDK', status: 'Chờ phát hành',
  }, expect.objectContaining({ signal: expect.any(AbortSignal) })));

  expect(screen.getByRole('heading', { name: 'Phiếu đăng ký' })).toBeInTheDocument();
  expect(screen.getByRole('searchbox', { name: 'Tìm phiếu đăng ký' })).toHaveValue('PDK');
  expect(screen.getByRole('table', { name: 'Danh sách phiếu đăng ký' })).toBeInTheDocument();
});

it('renders an empty and an error state without a stale table', async () => {
  listRegistrations.mockResolvedValueOnce({ items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 0 });
  const first = renderPage();
  expect(await screen.findByRole('heading', { name: 'Chưa có phiếu đăng ký' })).toBeInTheDocument();
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
  first.unmount();

  listRegistrations.mockRejectedValueOnce(new Error('Máy chủ không phản hồi'));
  renderPage();
  expect(await screen.findByRole('alert')).toHaveTextContent('Máy chủ không phản hồi');
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
});

it('writes pagination changes back to the request state', async () => {
  listRegistrations.mockResolvedValue({
    items: [{ id: 'PDK000001', customerId: 'KH000001', candidateCount: 1, registrationDate: '2030-05-06', status: 'Chờ phát hành' }],
    page: 1, pageSize: 20, totalItems: 21, totalPages: 2,
  });
  renderPage();

  await screen.findByRole('table', { name: 'Danh sách phiếu đăng ký' });
  await userEvent.click(screen.getByRole('button', { name: 'Trang sau' }));
  await waitFor(() => expect(listRegistrations).toHaveBeenLastCalledWith({
    page: 2, pageSize: 20, query: '', status: '',
  }, expect.objectContaining({ signal: expect.any(AbortSignal) })));
});

it('aborts an in-flight request when unmounted', async () => {
  let signal;
  listRegistrations.mockImplementation((params, options) => {
    signal = options.signal;
    return new Promise(() => {});
  });
  const view = renderPage();

  await waitFor(() => expect(signal).toBeDefined());
  view.unmount();
  expect(signal.aborted).toBe(true);
});
