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
  StatusBadge,
} from '../../ui';
import { getErrorMessage } from '../../api/client';
import { formatDate, formatIdentifier } from '../../shared/format';
import { EXAM_FORM_STATUS } from '../../shared/statuses';
import { listExamForms } from './api';
import styles from './ExamFormListPage.module.css';

function toPage(value) {
  return /^\d+$/.test(value || '') && Number(value) > 0 ? Number(value) : 1;
}

export default function ExamFormListPage() {
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
    title="Phiếu dự thi"
    description={state.totalItems
      ? `${state.totalItems} phiếu dự thi trong hệ thống.`
      : 'Tra cứu lịch thi và thông tin phiếu dự thi.'}
  >
    <SearchToolbar label="Tìm phiếu dự thi" query={draftQuery} onQueryChange={setDraftQuery} />
    {state.loading && <LoadingState label="Đang tải phiếu dự thi…" />}
    {!state.loading && state.error && <Alert tone="danger">{getErrorMessage(state.error, 'Không thể tải danh sách phiếu dự thi.')}</Alert>}
    {!state.loading && !state.error && state.items.length === 0 && <EmptyState title="Chưa có phiếu dự thi phù hợp" description="Thử thay đổi từ khóa tìm kiếm." />}
    {!state.loading && !state.error && state.items.length > 0 && <>
      <DataTable
        label="Danh sách phiếu dự thi"
        columns={['Mã phiếu', 'Thí sinh', 'Lịch thi', 'Trạng thái']}
        rows={state.items}
        getRowKey={(item) => item.examFormId}
        renderRow={(item) => {
          const status = EXAM_FORM_STATUS[item.status];
          return <>
            <td><Link to={`/phieuduthi/${item.examFormId}`}>{formatIdentifier(item.examFormId)}</Link></td>
            <td>{formatIdentifier(item.candidateId)}</td>
            <td>{formatDate(item.examDate)} {item.examTime}</td>
            <td><StatusBadge tone={status?.tone}>{status?.label || formatIdentifier(item.status)}</StatusBadge></td>
          </>;
        }}
      />
      {state.totalPages > 1 && <div className={styles.pagination}>
        <Pagination page={state.page || page} totalPages={state.totalPages} onPageChange={setPage} />
      </div>}
    </>}
  </Page>;
}
