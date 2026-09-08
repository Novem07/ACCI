import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import UnavailableModule from './UnavailableModule';

it('explains that an unfinished role module is unavailable without exposing fake actions', () => {
  render(<UnavailableModule title="Nhập liệu" description="Chức năng nhập liệu sẽ được mở khi quy trình nghiệp vụ được phê duyệt." />);

  expect(screen.getByRole('heading', { name: 'Nhập liệu' })).toBeInTheDocument();
  expect(screen.getByText(/sẽ được mở/)).toBeInTheDocument();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});
