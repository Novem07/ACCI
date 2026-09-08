import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Alert, DataTable, EmptyState, LoadingState, Page, Pagination, SearchToolbar, Select, StatusBadge } from '../../ui';
import { getErrorMessage } from '../../api/client';
import { formatDate, formatIdentifier } from '../../shared/format';
import { PAYMENT_STATUS } from '../../shared/statuses';
import usePayments from './usePayments';
import styles from './PaymentQueuePage.module.css';

function toPage(value) { return /^\d+$/.test(value || '') && Number(value) > 0 ? Number(value) : 1; }

export default function PaymentQueuePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = { page: toPage(searchParams.get('page')), pageSize: 20, query: searchParams.get('query') || '', status: searchParams.get('status') || '' };
  const [draftQuery, setDraftQuery] = useState(params.query);
  const { items, page, totalItems, totalPages, loading, error } = usePayments(params);
  useEffect(() => setDraftQuery(params.query), [params.query]);
  const updateParams = useCallback((changes) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => { if (!value) next.delete(key); else next.set(key, String(value)); });
    setSearchParams(next);
  }, [searchParams, setSearchParams]);
  useEffect(() => {
    if (draftQuery === params.query) return undefined;
    const timer = window.setTimeout(() => updateParams({ query: draftQuery.trim(), page: 1 }), 250);
    return () => window.clearTimeout(timer);
  }, [draftQuery, params.query, updateParams]);
  return <Page title="Thanh toán" description={totalItems ? `${totalItems} yêu cầu thanh toán trong hệ thống.` : 'Theo dõi và xử lý hóa đơn đăng ký.'}>
    <SearchToolbar label="Tìm yêu cầu thanh toán" query={draftQuery} onQueryChange={setDraftQuery}>
      <label className={styles.filterLabel}>Trạng thái
        <Select aria-label="Lọc trạng thái thanh toán" value={params.status} onChange={(event) => updateParams({ status: event.target.value, page: 1 })}>
          <option value="">Tất cả trạng thái</option>{Object.entries(PAYMENT_STATUS).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}
        </Select>
      </label>
    </SearchToolbar>
    {loading && <LoadingState label="Đang tải yêu cầu thanh toán…" />}
    {!loading && error && <Alert tone="danger">{getErrorMessage(error, 'Không thể tải danh sách thanh toán.')}</Alert>}
    {!loading && !error && items.length === 0 && <EmptyState title="Chưa có yêu cầu phù hợp" description="Thử thay đổi từ khóa hoặc bộ lọc." />}
    {!loading && !error && items.length > 0 && <>
      <DataTable label="Danh sách yêu cầu thanh toán" columns={['Mã phiếu', 'Khách hàng', 'Ngày đăng ký', 'Trạng thái', 'Hành động']} rows={items} getRowKey={(payment) => payment.registrationId} renderRow={(payment) => <>
        <td>{formatIdentifier(payment.registrationId)}</td><td><strong>{formatIdentifier(payment.customerName)}</strong><br /><span className={styles.muted}>{formatIdentifier(payment.customerId)}</span></td><td>{formatDate(payment.registrationDate)}</td><td><StatusBadge tone={PAYMENT_STATUS[payment.status]?.tone}>{PAYMENT_STATUS[payment.status]?.label || formatIdentifier(payment.status)}</StatusBadge></td><td>{payment.status === 'unpaid' ? <Link className={styles.action} to={`/ketoan/xuly/${payment.registrationId}`} aria-label={`Xử lý ${payment.registrationId}`}>Xử lý</Link> : <span className={styles.receipt}>{formatIdentifier(payment.invoiceId)}</span>}</td>
      </>} />
      {totalPages > 1 && <div className={styles.pagination}><Pagination page={page} totalPages={totalPages} onPageChange={(nextPage) => updateParams({ page: nextPage })} /></div>}
    </>}
  </Page>;
}
