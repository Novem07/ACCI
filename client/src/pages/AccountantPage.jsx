import React, { useEffect, useMemo, useState } from 'react';
import './AccountantPage.css';
import { useNavigate } from 'react-router-dom';
import { api, getErrorMessage } from '../api/client';
import AppShell from '../components/AppShell';
import AsyncState from '../components/AsyncState';

const itemsPerPage = 15;

const formatDate = (value) => (value ? new Date(value).toLocaleDateString('vi-VN') : '—');

const AccountantPage = () => {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/payments')
      .then((result) => setData(result.payments || []))
      .catch((requestError) => setError(getErrorMessage(requestError, 'Không thể tải danh sách thanh toán.')))
      .finally(() => setLoading(false));
  }, []);

  const filteredData = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return data.filter((row) => !term
      || row.registrationId.toLowerCase().includes(term)
      || row.customerId.toLowerCase().includes(term)
      || (row.customerName || '').toLowerCase().includes(term));
  }, [data, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  return (
    <AppShell>
      <main className="accountant-container">
        <h2>Danh sách yêu cầu thanh toán</h2>
        <div className="search-bar">
          <input type="search" placeholder="Tìm theo mã PĐK, mã KH hoặc tên" value={searchTerm} onChange={(event) => { setSearchTerm(event.target.value); setCurrentPage(1); }} />
        </div>
        <AsyncState loading={loading} error={error} empty={!filteredData.length && !loading && !error ? 'Không có yêu cầu thanh toán phù hợp.' : ''}>
          <div className="table-wrapper">
          <table className="payment-table">
            <thead>
              <tr>
                <th>Mã PĐK</th>
                <th>Mã KH</th>
                <th>Khách hàng</th>
                <th>Mã hóa đơn</th>
                <th>Ngày đăng ký</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row) => (
                <tr key={row.registrationId}>
                  <td>{row.registrationId}</td>
                  <td>{row.customerId}</td>
                  <td>{row.customerName}</td>
                  <td>{row.invoiceId || 'Chưa có'}</td>
                  <td>{formatDate(row.registrationDate)}</td>
                  <td>{row.registrationStatus}</td>
                  <td>
                    {!row.invoiceId && <button className="btn btn-xuly" type="button" onClick={() => navigate(`/ketoan/xuly/${row.registrationId}`)}>Xử lý</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!paginatedData.length && <p>Không có yêu cầu thanh toán phù hợp.</p>}
          {filteredData.length > itemsPerPage && (
            <div className="pagination" aria-label="Phân trang">
              <button type="button" className="page" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => page - 1)}>‹</button>
              <span>Trang {currentPage}/{totalPages}</span>
              <button type="button" className="page" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => page + 1)}>›</button>
            </div>
          )}
          </div>
        </AsyncState>
      </main>
    </AppShell>
  );
};

export default AccountantPage;
