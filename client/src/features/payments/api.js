import { request } from '../../api/client';

export async function listPayments({ page = 1, pageSize = 20, query = '', status = '' }, { signal } = {}) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (query) params.set('query', query);
  if (status) params.set('status', status);
  const response = await request(`/payments?${params}`, { signal });
  const items = response?.items ?? response?.payments ?? [];
  return { items, page: response?.page ?? page, pageSize: response?.pageSize ?? pageSize, totalItems: response?.totalItems ?? items.length, totalPages: response?.totalPages ?? (items.length ? 1 : 0) };
}

export async function getCheckout(registrationId, { signal } = {}) {
  return request(`/payments/${registrationId}/checkout`, { signal });
}

export async function createInvoice(registrationId, input) {
  const response = await request(`/payments/${registrationId}/invoices`, { method: 'POST', body: input });
  return response.invoice;
}
