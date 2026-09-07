import React, { useEffect, useMemo, useState } from 'react';
import './ViewRegisterPage.css';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { api, getErrorMessage } from '../api/client';
import AsyncState from '../components/AsyncState';

function ViewRegisterPage() {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/registrations')
      .then((result) => setData(result.registrations || []))
      .catch((requestError) => setError(getErrorMessage(requestError, 'Không thể tải danh sách phiếu đăng ký.')))
      .finally(() => setLoading(false));
  }, []);

  const filteredData = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return data.filter((row) => !term
      || row.id.toLowerCase().includes(term)
      || row.customerId.toLowerCase().includes(term));
  }, [data, searchTerm]);

  return (
    <main className="accountant-container">
        <h2>Danh sách phiếu đăng ký</h2>
        <div className="search-bar">
          <input
            type="search"
            placeholder="Tìm theo mã PĐK hoặc mã KH"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <button className="create-button" type="button" onClick={() => navigate('/taophieu')}>Tạo phiếu mới</button>
        </div>
        <AsyncState loading={loading} error={error} empty={!filteredData.length && !loading && !error ? 'Không có phiếu đăng ký phù hợp.' : ''}>
          <div className="table-wrapper">
          <table className="payment-table">
            <thead>
              <tr>
                <th>Mã PĐK</th>
                <th>Mã KH</th>
                <th>Số thí sinh</th>
                <th>Ngày đăng ký</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.customerId}</td>
                  <td>{row.candidateCount}</td>
                  <td>{row.registrationDate ? dayjs(row.registrationDate).format('DD/MM/YYYY') : '—'}</td>
                  <td>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </AsyncState>
    </main>
  );
}

export default ViewRegisterPage;
