import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { Icon } from '../index';

it('hides decorative icons from assistive technology', () => {
  render(<Icon name="search" />);
  expect(screen.getByTestId('icon-search')).toHaveAttribute('aria-hidden', 'true');
});
