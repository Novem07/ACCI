import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import App from './App';

test('renders the login form at the root route', () => {
  window.history.pushState({}, '', '/');
  render(<App />);
  expect(screen.getByRole('button', { name: /đăng nhập/i })).toBeInTheDocument();
});
