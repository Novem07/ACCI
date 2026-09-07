import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ExtendRegisterPage.css';
import { api, getErrorMessage } from '../api/client';
import AsyncState from '../components/AsyncState';

function ExtendRegisterPage() {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/exam-forms?page=1&pageSize=100')
      .then((result) => setData(result.items || []))
      .catch((requestError) => setError(getErrorMessage(requestError, 'Không thể tải danh sách phiếu dự thi.')))
      .finally(() => setLoading(false));
  }, []);

  const filteredData = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return data.filter((item) => !term
      || item.examFormId.toLowerCase().includes(term)
      || item.candidateId.toLowerCase().includes(term));
  }, [data, searchTerm]);

  return (
    <main>
        <h2 className="title">Đăng ký gia hạn</h2>
        <div className="search-bar-row">
          <input
            type="search"
            className="search-bar-input"
            placeholder="Tìm theo mã PDT hoặc mã TS"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <AsyncState loading={loading} error={error} empty={!filteredData.length && !loading && !error ? 'Không có phiếu phù hợp.' : ''}>
          <div className="table-container">
          <table>
            <thead>
              <tr><th>Mã PDT</th><th>Mã TS</th><th>Chứng chỉ</th><th>Ngày thi</th><th>Lần gia hạn còn lại</th><th>Hành động</th></tr>
            </thead>
            <tbody>
              {filteredData.map((row) => (
                <tr key={row.examFormId}>
                  <td>{row.examFormId}</td>
                  <td>{row.candidateId}</td>
                  <td>{row.certificateName || row.certificateId}</td>
                  <td>{row.examDate ? new Date(row.examDate).toLocaleDateString('vi-VN') : '—'} {row.examTime || ''}</td>
                  <td>{row.remainingAttempts}</td>
                  <td>
                    <button className="btn-extend" type="button" disabled={Number(row.remainingAttempts) <= 0} onClick={() => navigate(`/giahan/create/${row.examFormId}`)}>
                      Đăng ký gia hạn
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </AsyncState>
    </main>
  );
}

export default ExtendRegisterPage;
