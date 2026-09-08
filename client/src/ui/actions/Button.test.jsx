import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { Button, IconButton } from '../index';

it('prevents repeat submission while loading', async () => {
  const onClick = vi.fn();
  render(<Button loading onClick={onClick}>Lưu</Button>);

  expect(screen.getByRole('button', { name: /Đang xử lý/ })).toBeDisabled();
  await userEvent.click(screen.getByRole('button'));
  expect(onClick).not.toHaveBeenCalled();
});

it('requires an accessible name for icon-only actions', () => {
  render(<IconButton label="Đóng">×</IconButton>);
  expect(screen.getByRole('button', { name: 'Đóng' })).toBeInTheDocument();
});
