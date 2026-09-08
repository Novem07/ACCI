import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Alert, DataTable, EmptyState, LoadingState, Page, SearchToolbar } from '../../ui';
import { getErrorMessage } from '../../api/client';
import { formatDate } from '../../shared/format';
import { listExamForms } from './api';

export default function ExamFormListPage() {
  const [searchParams, setSearchParams] = useSearchParams(); const query = searchParams.get('query') || ''; const [draft, setDraft] = useState(query); const [state, setState] = useState({ loading: true, items: [], error: null });
  useEffect(() => { const controller = new AbortController(); listExamForms({ page: 1, pageSize: 20, query }, { signal: controller.signal }).then((result) => setState({ ...result, loading: false, error: null })).catch((error) => { if (error.name !== 'AbortError') setState({ loading: false, items: [], error }); }); return () => controller.abort(); }, [query]);
  useEffect(() => { const timer = setTimeout(() => { if (draft !== query) setSearchParams(draft ? { query: draft } : {}); }, 250); return () => clearTimeout(timer); }, [draft, query, setSearchParams]);
  return <Page title="Phiếu dự thi" description="Tra cứu lịch thi và thông tin phiếu dự thi."><SearchToolbar label="Tìm phiếu dự thi" query={draft} onQueryChange={setDraft} />{state.loading && <LoadingState />}{state.error && <Alert tone="danger">{getErrorMessage(state.error)}</Alert>}{!state.loading && !state.error && !state.items.length && <EmptyState title="Chưa có phiếu dự thi" />}{!state.loading && !state.error && state.items.length > 0 && <DataTable label="Danh sách phiếu dự thi" columns={['Mã phiếu', 'Thí sinh', 'Lịch thi', 'Trạng thái']} rows={state.items} getRowKey={(item) => item.examFormId} renderRow={(item) => <><td><Link to={`/phieuduthi/${item.examFormId}`}>{item.examFormId}</Link></td><td>{item.candidateId}</td><td>{formatDate(item.examDate)} {item.examTime}</td><td>{item.status}</td></>} />}</Page>;
}
