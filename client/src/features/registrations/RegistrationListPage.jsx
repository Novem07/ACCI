import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Button, DataTable, EmptyState, LoadingState, Page, Pagination, SearchToolbar, Select, StatusBadge } from '../../ui';
import { formatDate, formatIdentifier } from '../../shared/format';
import { REGISTRATION_STATUS } from '../../shared/statuses';
import { getErrorMessage } from '../../api/client';
import useRegistrations from './useRegistrations';
import styles from './RegistrationListPage.module.css';

function toPage(value) {
  return /^\d+$/.test(value || '') && Number(value) > 0 ? Number(value) : 1;
}

function toParams(searchParams) {
  return {
    page: toPage(searchParams.get('page')),
    pageSize: 20,
    query: searchParams.get('query') || '',
    status: searchParams.get('status') || '',
  };
}

export default function RegistrationListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const params = toParams(searchParams);
  const [draftQuery, setDraftQuery] = useState(params.query);
  const { items, page, totalItems, totalPages, loading, error } = useRegistrations(params);

  useEffect(() => setDraftQuery(params.query), [params.query]);
  useEffect(() => {
    if (draftQuery === params.query) return undefined;
    const timer = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      if (draftQuery.trim()) next.set('query', draftQuery.trim());
      else next.delete('query');
      next.set('page', '1');
      setSearchParams(next);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [draftQuery, params.query, searchParams, setSearchParams]);

  function updateParams(changes) {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => {
      if (value === '' || value === undefined) next.delete(key);
      else next.set(key, String(value));
    });
    setSearchParams(next);
  }

  return <Page
    title="Phiếu đăng ký"
    description={totalItems ? `${totalItems} phiếu đăng ký trong hệ thống.` : 'Theo dõi và xử lý hồ sơ đăng ký.'}
    actions={<Button type="button" onClick={() => navigate('/taophieu')}>Lập phiếu đăng ký</Button>}
  >
    <SearchToolbar label="Tìm phiếu đăng ký" query={draftQuery} onQueryChange={setDraftQuery}>
      <label className={styles.filterLabel}>
        Trạng thái
        <Select aria-label="Lọc trạng thái" value={params.status} onChange={(event) => updateParams({ status: event.target.value, page: 1 })}>
          <option value="">Tất cả trạng thái</option>
          {Object.entries(REGISTRATION_STATUS).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}
        </Select>
      </label>
    </SearchToolbar>
    {loading && <LoadingState label="Đang tải phiếu đăng ký…" />}
    {!loading && error && <Alert tone="danger">{getErrorMessage(error, 'Không thể tải danh sách phiếu đăng ký.')}</Alert>}
    {!loading && !error && items.length === 0 && <EmptyState title="Chưa có phiếu đăng ký" description="Thử thay đổi từ khóa hoặc tạo một phiếu mới." />}
    {!loading && !error && items.length > 0 && <>
      <DataTable
        label="Danh sách phiếu đăng ký"
        columns={['Mã phiếu', 'Khách hàng', 'Thí sinh', 'Ngày đăng ký', 'Trạng thái']}
        rows={items}
        getRowKey={(row) => row.id}
        renderRow={(row) => <>
          <td>{formatIdentifier(row.id)}</td>
          <td>{formatIdentifier(row.customerId)}</td>
          <td>{row.candidateCount}</td>
          <td>{formatDate(row.registrationDate)}</td>
          <td><StatusBadge tone={REGISTRATION_STATUS[row.status]?.tone}>{formatIdentifier(row.status)}</StatusBadge></td>
        </>}
      />
      {totalPages > 1 && <div className={styles.pagination}><Pagination page={page} totalPages={totalPages} onPageChange={(nextPage) => updateParams({ page: nextPage })} /></div>}
    </>}
  </Page>;
}
