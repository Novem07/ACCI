import React, { useEffect, useState } from 'react';
import './AccountantPage.css';
import LogoutModal from '../components/LogoutModal';
import { useNavigate } from 'react-router-dom';

const AccountantPage = () => {
  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const itemsPerPage = 15;
  const user = JSON.parse(localStorage.getItem('user'));
  const tenNhanVien = user.name || 'Chưa đăng nhập';

  const navigate = useNavigate();


  useEffect(() => {
    fetch('http://localhost:5000/api/payments')
      .then((res) => res.json())
      .then((data) => {
        console.log('✅ Dữ liệu nhận được:', data);
        setData(data);
      })
      .catch((err) => console.error('❌ Lỗi fetch:', err));
  }, []);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const paginatedData = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
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
          <span className="disabled">Đăng ký thi</span>
          <span className="active">Thanh toán</span>
          <span className="disabled">Gia hạn thi</span>
          <span className="disabled">Tra cứu</span>
        </div>
        <div className="nav-search-user">
          <input type="text" placeholder="Tìm kiếm" />
          <span className="user-icon">👤 {tenNhanVien}</span>
          <span
            className="logout-icon"
            onClick={() => setShowLogoutModal(true)}
          >
            ↩
          </span>
        </div>
      </nav>

      <div className="accountant-container">
        <h2>Danh Sách Yêu Cầu Thanh Toán</h2>
        <div className="search-bar">
          <input type="text" placeholder="Tìm kiếm" />
        </div>

        <div className="table-wrapper">
          <table className="payment-table">
            <thead>
              <tr>
                <th>Mã PĐK</th>
                <th>Mã KH</th>
                <th>Mã thanh toán</th>
                <th>Ngày ĐK</th>
                <th>Trạng thái phiếu</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, index) => (
                <tr key={index}>
                  <td>{row.MaPDK}</td>
                  <td>{row.MaKH}</td>
                  <td>{row.MaTT || 'Không'}</td>
                  <td>{row.NgayDK}</td>
                  <td>{row.TrangThai}</td>
                  <td>
                  {row.TrangThai === 'Đang xử lý' && (
                    <button
                        className={`btn ${row.DaXuLy ? 'btn-capnhat' : 'btn-xuly'}`}
                        onClick={() => {
                        console.log('➡️ Chuyển đến:', row.MaPDK);
                        navigate(`/ketoan/xuly/${row.MaPDK}`);
                        }}
                    >
                        {row.DaXuLy ? 'Cập nhật' : 'Xử lý'}
                    </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* PHÂN TRANG ĐỘNG */}
          {totalPages > 1 && (
            <div className="pagination">
              <span
                className="page"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              >
                &lt;
              </span>

              {[...Array(totalPages)].map((_, i) => (
                <span
                  key={i}
                  className={`page ${currentPage === i + 1 ? 'active' : ''}`}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </span>
              ))}

              <span
                className="page"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              >
                &gt;
              </span>
            </div>
          )}
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
};

export default AccountantPage;
