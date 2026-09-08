import { request } from '../../api/client';

export async function listCustomers({ page = 1, pageSize = 100, query = '' } = {}, { signal } = {}) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (query) params.set('query', query);
  const response = await request(`/customers?${params}`, { signal });
  const items = response?.items ?? response?.customers ?? [];
  return { ...response, items };
}

export async function createCustomer(input) {
  const response = await request('/customers', { method: 'POST', body: input });
  return response.customer;
}
