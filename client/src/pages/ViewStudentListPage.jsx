import React, { useEffect, useState } from 'react';
import './ViewStudentListPage.css';
import { api, getErrorMessage } from '../api/client';
import AppShell from '../components/AppShell';
import AsyncState from '../components/AsyncState';

function ViewStudentListPage() {
  const [students, setStudents] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/catalog/candidates')
      .then((result) => setStudents(result.candidates || []))
      .catch((requestError) => setError(getErrorMessage(requestError, 'Không thể tải danh sách thí sinh.')))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <main className="student-page">
        <h2>Danh sách thí sinh</h2>
        <AsyncState loading={loading} error={error} empty={!students.length && !loading && !error ? 'Chưa có thí sinh.' : ''}>
          <table className="student-table">
        <thead><tr><th>Mã TS</th><th>Họ tên</th><th>CCCD</th><th>SĐT</th><th>Email</th><th>Địa chỉ</th></tr></thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id}>
              <td>{student.id}</td>
              <td>{student.fullName}</td>
              <td>{student.citizenId}</td>
              <td>{student.phone}</td>
              <td>{student.email}</td>
              <td>{student.address}</td>
            </tr>
          ))}
        </tbody>
          </table>
        </AsyncState>
      </main>
    </AppShell>
  );
}

export default ViewStudentListPage;
