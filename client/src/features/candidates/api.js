import { request } from '../../api/client';

export async function listCandidates({ page = 1, pageSize = 20, query = '' }, { signal } = {}) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (query) params.set('query', query);
  const response = await request(`/catalog/candidates?${params}`, { signal });
  const items = response?.items ?? response?.candidates ?? [];
  return {
    items,
    page: response?.page ?? page,
    pageSize: response?.pageSize ?? pageSize,
    totalItems: response?.totalItems ?? items.length,
    totalPages: response?.totalPages ?? (items.length ? 1 : 0),
  };
}
