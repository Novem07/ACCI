import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import BrandLogo from './BrandLogo';

it('renders the compact mark without redundant accessible text', () => {
  render(<BrandLogo compact decorative />);

  expect(screen.getByTestId('brand-logo')).toHaveAttribute('aria-hidden', 'true');
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
});

it('renders the product name for a non-decorative full logo', () => {
  render(<BrandLogo />);

  expect(screen.getByRole('img', { name: 'ACCI Center' })).toBeInTheDocument();
});
