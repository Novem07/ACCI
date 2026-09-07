// 📁 client/src/pages/ViewExamForms.jsx
import React, { useEffect, useState } from 'react';

function ViewExamForms() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/phieuduthi')
      .then(res => res.json())
      .then(setData)
      .catch(err => console.error('Lỗi khi gọi API phiếu dự thi:', err));
  }, []);

  return (
    <div className="exam-form-page">
      <h2>Danh Sách Phiếu Dự Thi</h2>
      <table className="exam-form-table">
        <thead>
          <tr>
            <th>Mã PDT</th>
            <th>Mã TS</th>
            <th>Chứng chỉ</th>
            <th>Trạng thái phiếu</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              <td>{row.MaPhieuDuThi}</td>
              <td>{row.MaThiSinh}</td>
              <td>{row.TenChungChi}</td>
              <td>{row.TrangThaiPhieu}</td>
              <td>
                <button
                    className="icon-button"
                    title="Xem chi tiết"
                    onClick={() => window.location.href = `/phieuduthi/${row.MaPhieuDuThi}`}
                >
                    🔍
                </button>
            </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ViewExamForms;
