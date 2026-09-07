import React, { useEffect, useState } from 'react';
import './CreateRegisterPage.css'; // dùng lại CSS sẵn có
import { useNavigate } from 'react-router-dom';

function ViewTempThisinh() {
  const [thiSinhList, setThiSinhList] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('tempThiSinhList')) || [];
    setThiSinhList(data);
  }, []);

  return (
    <div className="page-wrapper">
      <nav className="navbar">
        <div className="logo">ACCI</div>
        <div className="nav-links">
          <span onClick={() => navigate('/taophieu')}>← Quay lại</span>
        </div>
      </nav>

      <div className="form-container">
        <h2>Danh Sách Thí Sinh Tạm Thêm</h2>
        {thiSinhList.length === 0 ? (
          <p>Chưa có thí sinh nào được thêm.</p>
        ) : (
          <table className="payment-table">
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>Chứng chỉ</th>
                <th>CCCD</th>
                <th>SĐT</th>
                <th>Email</th>
                <th>Địa chỉ</th>
              </tr>
            </thead>
            <tbody>
              {thiSinhList.map((ts, i) => (
                <tr key={i}>
                  <td>{ts.hoTen}</td>
                  <td>{ts.maChungChi}</td>
                  <td>{ts.cccd}</td>
                  <td>{ts.sdt}</td>
                  <td>{ts.email}</td>
                  <td>{ts.diaChi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default ViewTempThisinh;
