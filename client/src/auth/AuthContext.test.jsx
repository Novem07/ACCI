import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';

function response(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (body === null ? '' : JSON.stringify(body)),
  };
}

function Probe() {
  const { loading, user, login } = useAuth();
  return (
    <div>
      <span>{loading ? 'loading' : user ? user.name : 'anonymous'}</span>
      <button type="button" onClick={() => login({ employeeId: 'NV001', password: 'secret' })}>Login</button>
    </div>
  );
}

describe('AuthProvider', () => {
  let fetchMock;

  beforeEach(() => {
    localStorage.clear();
    fetchMock = vi.fn((url) => {
      if (url.endsWith('/auth/me')) return Promise.resolve(response(null, 401));
      if (url.endsWith('/auth/login')) return Promise.resolve(response({ user: { id: 'NV001', name: 'Nguyễn Văn A', role: 'Tiếp nhận' } }));
      return Promise.resolve(response(null));
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('hydrates from the session endpoint and keeps identity out of localStorage', async () => {
    render(<AuthProvider><Probe /></AuthProvider>);

    await waitFor(() => expect(screen.getByText('anonymous')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    await waitFor(() => expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument());

    expect(localStorage.getItem('user')).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/auth/me'), expect.objectContaining({ credentials: 'include' }));
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/auth/login'), expect.objectContaining({ credentials: 'include' }));
  });
});
