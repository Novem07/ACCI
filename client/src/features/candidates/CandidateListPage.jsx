import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, DataTable, EmptyState, LoadingState, Page, Pagination, SearchToolbar } from '../../ui';
import { getErrorMessage } from '../../api/client';
import { formatIdentifier } from '../../shared/format';
import useCandidates from './useCandidates';
import styles from './CandidateListPage.module.css';

function toPage(value) {
  return /^\d+$/.test(value || '') && Number(value) > 0 ? Number(value) : 1;
}

export default function CandidateListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = toPage(searchParams.get('page'));
  const query = searchParams.get('query') || '';
  const [draftQuery, setDraftQuery] = useState(query);
  const { items, totalItems, totalPages, loading, error } = useCandidates({ page, pageSize: 20, query });

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

  return <Page title="Thí sinh" description={totalItems ? `${totalItems} thí sinh trong hệ thống.` : 'Tra cứu thí sinh theo mã hoặc họ tên.'}>
    <SearchToolbar label="Tìm thí sinh" query={draftQuery} onQueryChange={setDraftQuery} />
    {loading && <LoadingState label="Đang tải danh sách thí sinh…" />}
    {!loading && error && <Alert tone="danger">{getErrorMessage(error, 'Không thể tải danh sách thí sinh.')}</Alert>}
    {!loading && !error && items.length === 0 && <EmptyState title="Chưa có thí sinh phù hợp" description="Thử thay đổi từ khóa tìm kiếm." />}
    {!loading && !error && items.length > 0 && <>
      <DataTable
        label="Danh sách thí sinh"
        columns={['Mã thí sinh', 'Họ tên', 'CCCD', 'SĐT', 'Email', 'Địa chỉ']}
        rows={items}
        getRowKey={(candidate) => candidate.id}
        renderRow={(candidate) => <>
          <td>{formatIdentifier(candidate.id)}</td>
          <td>{formatIdentifier(candidate.fullName)}</td>
          <td>{formatIdentifier(candidate.citizenId)}</td>
          <td>{formatIdentifier(candidate.phone)}</td>
          <td>{formatIdentifier(candidate.email)}</td>
          <td>{formatIdentifier(candidate.address)}</td>
        </>}
      />
      {totalPages > 1 && <div className={styles.pagination}><Pagination page={page} totalPages={totalPages} onPageChange={setPage} /></div>}
    </>}
  </Page>;
}
