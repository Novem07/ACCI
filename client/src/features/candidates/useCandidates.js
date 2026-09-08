import { useEffect, useState } from 'react';
import { listCandidates } from './api';

export default function useCandidates({ page, pageSize, query }) {
  const [state, setState] = useState({ items: [], page, pageSize, totalItems: 0, totalPages: 0, loading: true, error: null });
  useEffect(() => {
    const controller = new AbortController();
    setState((current) => ({ ...current, loading: true, error: null }));
    listCandidates({ page, pageSize, query }, { signal: controller.signal })
      .then((result) => setState({ ...result, loading: false, error: null }))
      .catch((error) => {
        if (error.name !== 'AbortError') setState((current) => ({ ...current, loading: false, error }));
      });
    return () => controller.abort();
  }, [page, pageSize, query]);
  return state;
}
