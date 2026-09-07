import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import App from './App';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 401, text: async () => '' })));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test('renders the login form at the root route', () => {
  window.history.pushState({}, '', '/');
  render(<App />);
  expect(screen.getByRole('button', { name: /đăng nhập/i })).toBeInTheDocument();
});
