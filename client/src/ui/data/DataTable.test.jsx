import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { DataTable, Pagination } from '../index';

it('labels the table and prevents pagination outside the valid range', () => {
  const onPageChange = vi.fn();
  render(<><DataTable label="Phiếu đăng ký" columns={['Mã']} rows={[]} getRowKey={(row) => row.id} renderRow={() => null} /><Pagination page={1} totalPages={3} onPageChange={onPageChange} /></>);
  expect(screen.getByRole('table', { name: 'Phiếu đăng ký' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Trang trước' })).toBeDisabled();
});
