import { request } from '../../api/client';

function toSearchParams({ page = 1, pageSize = 20, query = '', status = '' }) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (query) params.set('query', query);
  if (status) params.set('status', status);
  return params;
}

export async function listRegistrations(params, { signal } = {}) {
  const response = await request(`/registrations?${toSearchParams(params)}`, { signal });
  const items = response?.items ?? response?.registrations ?? [];
  return {
    items,
    page: response?.page ?? params.page ?? 1,
    pageSize: response?.pageSize ?? params.pageSize ?? 20,
    totalItems: response?.totalItems ?? items.length,
    totalPages: response?.totalPages ?? (items.length ? 1 : 0),
  };
}
