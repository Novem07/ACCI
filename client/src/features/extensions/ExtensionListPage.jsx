import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Alert,
  DataTable,
  EmptyState,
  LoadingState,
  Page,
  Pagination,
  SearchToolbar,
} from '../../ui';
import { getErrorMessage } from '../../api/client';
import { formatDate, formatIdentifier } from '../../shared/format';
import { listExamForms } from '../exam-forms/api';
import styles from './ExtensionListPage.module.css';

function toPage(value) {
  return /^\d+$/.test(value || '') && Number(value) > 0 ? Number(value) : 1;
}

export default function ExtensionListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = toPage(searchParams.get('page'));
  const query = searchParams.get('query') || '';
  const [draftQuery, setDraftQuery] = useState(query);
  const [state, setState] = useState({
    loading: true,
    items: [],
    totalItems: 0,
    totalPages: 0,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    setState((current) => ({ ...current, loading: true, error: null }));

    listExamForms({ page, pageSize: 20, query }, { signal: controller.signal })
      .then((result) => setState({ ...result, loading: false, error: null }))
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setState({ loading: false, items: [], totalItems: 0, totalPages: 0, error });
        }
      });

    return () => controller.abort();
  }, [page, query]);

  useEffect(() => setDraftQuery(query), [query]);

  useEffect(() => {
    if (draftQuery === query) return undefined;

    const timer = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      if (draftQuery.trim()) next.set('query', draftQuery.trim());
      else next.delete('query');
      next.set('page', '1');
      setSearchParams(next);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [draftQuery, query, searchParams, setSearchParams]);

  function setPage(nextPage) {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(nextPage));
    setSearchParams(next);
  }

  return <Page
    title="Gia hạn chứng chỉ"
    description={state.totalItems
      ? `Chọn trong ${state.totalItems} phiếu dự thi để xem lịch thay thế đủ điều kiện.`
      : 'Chọn phiếu dự thi để xem lịch thay thế đủ điều kiện.'}
  >
    <SearchToolbar label="Tìm phiếu dự thi" query={draftQuery} onQueryChange={setDraftQuery} />
    {state.loading && <LoadingState label="Đang tải phiếu dự thi…" />}
    {!state.loading && state.error && <Alert tone="danger">{getErrorMessage(state.error, 'Không thể tải danh sách phiếu dự thi.')}</Alert>}
    {!state.loading && !state.error && state.items.length === 0 && <EmptyState title="Chưa có phiếu dự thi phù hợp" description="Thử thay đổi từ khóa tìm kiếm." />}
    {!state.loading && !state.error && state.items.length > 0 && <>
      <DataTable
        label="Phiếu dự thi có thể gia hạn"
        columns={['Phiếu dự thi', 'Thí sinh', 'Ngày thi', 'Lần còn lại', '']}
        rows={state.items}
        getRowKey={(item) => item.examFormId}
        renderRow={(item) => <>
          <td>{formatIdentifier(item.examFormId)}</td>
          <td>{formatIdentifier(item.candidateId)}</td>
          <td>{formatDate(item.examDate)}</td>
          <td>{item.remainingAttempts}</td>
          <td>{Number(item.remainingAttempts) > 0 && <Link to={`/giahan/create/${item.examFormId}`}>Gia hạn</Link>}</td>
        </>}
      />
      {state.totalPages > 1 && <div className={styles.pagination}>
        <Pagination page={state.page || page} totalPages={state.totalPages} onPageChange={setPage} />
      </div>}
    </>}
  </Page>;
}
