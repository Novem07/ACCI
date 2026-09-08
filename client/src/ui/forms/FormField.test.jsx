import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { FormField, TextInput } from '../index';

it('associates label, hint, and error with the native input', () => {
  render(<FormField id="phone" label="Số điện thoại" hint="10 chữ số" error="Không hợp lệ" required><TextInput id="phone" /></FormField>);

  const input = screen.getByLabelText(/Số điện thoại/);
  expect(input).toHaveAttribute('aria-invalid', 'true');
  expect(input.getAttribute('aria-describedby')).toMatch(/phone-hint/);
  expect(input.getAttribute('aria-describedby')).toMatch(/phone-error/);
});
