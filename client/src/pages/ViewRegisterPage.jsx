import React, { useEffect, useState } from 'react';
import './ViewRegisterPage.css';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import LogoutModal from '../components/LogoutModal';

function ViewRegisterPage() {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const tenNhanVien = user?.name || 'Chưa đăng nhập';

  useEffect(() => {
    fetch('http://localhost:5000/api/phieudangky')
      .then(res => res.json())
      .then(setData)
      .catch(err => console.error('Lỗi khi gọi API:', err));
  }, []);

  const filteredData = data.filter(row =>
    row.MaPhieuDangKy.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.MaKhachHang.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLogoutConfirm = () => {
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="page-wrapper">
      <nav className="navbar">
  <div className="logo">ACCI</div>
  <div className="nav-links">
    <span className="active">Đăng ký thi</span>
    <span className="disabled">Thanh toán</span>
    <span className="clickable" onClick={() => navigate('/giahan')}>
      Gia hạn thi
    </span>
    <span className="disabled">Tra cứu</span>
  </div>
  <div className="nav-search-user">
    <input type="text" placeholder="Tìm kiếm" />
    <span className="user-icon">👤 {tenNhanVien}</span>
    <span className="logout-icon" onClick={() => setShowLogoutModal(true)}>↩</span>
  </div>
</nav>


      <div className="accountant-container">
        <h2>Danh Sách Phiếu Đăng Ký</h2>

        <div className="search-bar">
          <input
            type="text"
            placeholder="Tìm kiếm theo Mã PĐK hoặc Mã KH"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <button className="create-button" onClick={() => navigate('/taophieu')}>
            Tạo phiếu đăng ký mới
          </button>
        </div>

        <div className="table-wrapper">
          <table className="payment-table">
            <thead>
              <tr>
                <th>Mã PĐK</th>
                <th>Mã KH</th>
                <th>Mã thanh toán</th>
                <th>Ngày ĐK</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, i) => (
                <tr key={i}>
                  <td>{row.MaPhieuDangKy}</td>
                  <td>{row.MaKhachHang}</td>
                  <td>{row.MaThanhToan || 'Không'}</td>
                  <td>{row.NgayDangKy ? dayjs(row.NgayDangKy).format('DD/MM/YYYY') : 'Không xác định'}</td>
                  <td>{row.TrangThaiPhieu}</td>
                  <td>
                    <button className="icon-button" onClick={() => navigate(`/phieuduthi/${row.MaPhieuDangKy}`)}>🔍</button>
                    <button className="icon-button" onClick={() => alert('Chỉnh sửa')}>✏️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showLogoutModal && (
        <LogoutModal
          onConfirm={handleLogoutConfirm}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}
    </div>
  );
}

export default ViewRegisterPage;
