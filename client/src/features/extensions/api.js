import { request } from '../../api/client';

export function getExtensionOptions(examFormId, { signal } = {}) {
  return request(`/extensions/${examFormId}/extension-options`, { signal });
}

export async function createExtension(input) {
  const response = await request('/extensions', { method: 'POST', body: input });
  return response.extension ?? response;
}
