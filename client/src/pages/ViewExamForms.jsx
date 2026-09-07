import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getErrorMessage } from '../api/client';
import AppShell from '../components/AppShell';
import AsyncState from '../components/AsyncState';

function ViewExamForms() {
  const [data, setData] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/exam-forms?page=1&pageSize=100')
      .then((result) => setData(result.items || []))
      .catch((requestError) => setError(getErrorMessage(requestError, 'Không thể tải danh sách phiếu dự thi.')))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <main className="exam-form-page">
        <h2>Danh sách phiếu dự thi</h2>
        <AsyncState loading={loading} error={error} empty={!data.length && !loading && !error ? 'Chưa có phiếu dự thi.' : ''}>
          <table className="exam-form-table">
        <thead><tr><th>Mã PDT</th><th>Mã TS</th><th>Chứng chỉ</th><th>Ngày thi</th><th>Trạng thái</th><th /></tr></thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.examFormId}>
              <td>{row.examFormId}</td>
              <td>{row.candidateId}</td>
              <td>{row.certificateName || row.certificateId}</td>
              <td>{row.examDate ? new Date(row.examDate).toLocaleDateString('vi-VN') : '—'}</td>
              <td>{row.status}</td>
              <td><button type="button" onClick={() => navigate(`/phieuduthi/${row.examFormId}`)}>Xem chi tiết</button></td>
            </tr>
          ))}
        </tbody>
          </table>
        </AsyncState>
      </main>
    </AppShell>
  );
}

export default ViewExamForms;
