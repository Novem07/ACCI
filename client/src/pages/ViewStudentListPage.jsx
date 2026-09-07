import React, { useEffect, useState } from 'react';
import './ViewStudentListPage.css';

function ViewStudentListPage() {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/thisinh')
      .then(res => res.json())
      .then(setStudents)
      .catch(err => console.error('Lỗi gọi API:', err));
  }, []);

  return (
    <div className="student-page">
      <h2>Danh Sách Thí Sinh</h2>
      <table className="student-table">
        <thead>
          <tr>
            <th>Họ tên</th>
            <th>Chứng chỉ thi</th>
            <th>SĐT</th>
            <th>Email</th>
            <th>Địa chỉ</th>
          </tr>
        </thead>
        <tbody>
          {students.map((ts, i) => (
            <tr key={i}>
              <td>{ts.HoTen}</td>
              <td>{ts.ChungChiThi}</td>
              <td>{ts.SDT}</td>
              <td>{ts.Email}</td>
              <td>{ts.DiaChi}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ViewStudentListPage;
