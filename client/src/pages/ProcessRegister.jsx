import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ProcessRegister.css';
import LogoutModal from '../components/LogoutModal';

const ProcessRegister = () => {
  const { maPDK } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [phieu, setPhieu] = useState(null);
  const [khachHang, setKhachHang] = useState(null);
  const [daThanhToan, setDaThanhToan] = useState(false);
  const [maThanhToan, setMaThanhToan] = useState('');

  const user = JSON.parse(localStorage.getItem('user'));
  const tenNhanVien = user.name || 'Chưa đăng nhập';
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [phuongThuc, setPhuongThuc] = useState('Tiền mặt');
  const [ngayLap, setNgayLap] = useState('');



  useEffect(() => {
    fetch(`http://localhost:5000/api/payments/phieu/${maPDK}`)
      .then(res => res.json())
      .then(data => {
        setPhieu(data);
        setMaThanhToan(data.MaTT || '');
        const isDonVi = data.DonVi && data.DonVi.trim().toLowerCase() !== 'không';
        setKhachHang({
          HoTen: data.HoTen,
          SDT: data.SDT,
          DonVi: isDonVi ? 'Có' : 'Không',
          LaDonVi: isDonVi,
        });
        setLoading(false);
        setPhuongThuc(data.PhuongThucThanhToan || 'Tiền mặt');
        const today = new Date();
        const formattedDate = today.toLocaleDateString('vi-VN'); // ra định dạng dd/mm/yyyy
        setNgayLap(formattedDate);

        const tongTruocTroGia = (data.TongTien || 0) + (data.TroGia || 0);
        setPhieu({ ...data, TongTruocTroGia: tongTruocTroGia });

      })
      .catch(err => {
        console.error('❌ Lỗi khi truy vấn phiếu:', err);
        setLoading(false);
      });
  }, [maPDK]);

    fetch(`http://localhost:5000/api/payments/tinhtoan/${maPDK}`)
    .then(res => res.json())
    .then(data => {
        setPhieu(prev => ({
        ...prev,
        TongTruocTroGia: data.Tong,
        TroGia: data.TroGia,
        TongTien: data.TongTien
        }));
    })
    .catch(err => console.error('❌ Lỗi khi tính hóa đơn:', err));

  const handleHuyPhieu = () => {
    navigate('/ketoan');
  };

  const handleTiepTuc = () => {
    if (khachHang.LaDonVi && !daThanhToan) {
      // Lưu cờ đã xử lý vào localStorage
      localStorage.setItem(`processed_${maPDK}`, true);
      alert('✅ Phiếu đã được xử lý (chưa thanh toán).');
      navigate('/ketoan');
    } else if (daThanhToan) {
      // xử lý thanh toán bình thường (nếu có)
      alert('✅ Đã xác nhận thanh toán!');
      navigate('/ketoan');
    }
  };  

  const handleLogoutConfirm = () => {
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  if (loading || !phieu || !khachHang) return <div>Đang tải dữ liệu...</div>;

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
          <span className="logout-icon" onClick={() => setShowLogoutModal(true)}>↩</span>
        </div>
      </nav>

      <div className="invoice-wrapper">
        <div className="invoice">
          <h1>ACCI</h1>
          <h2>Hóa Đơn Đăng Ký</h2>
          <p><span>Mã hóa đơn:</span><span>HĐĐK{phieu.MaPDK.slice(-3)}</span></p>
          <p><span>Mã phiếu đăng ký:</span><span>{phieu.MaPDK}</span></p>
          <p><span>Họ tên khách hàng:</span><span>{khachHang.HoTen}</span></p>
          <p><span>Số điện thoại khách hàng:</span><span>{khachHang.SDT}</span></p>
          <p><span>Đơn vị:</span><span>{khachHang.LaDonVi ? 'Có' : 'Không'}</span></p>
          <p><span>Tổng:</span><span>{phieu.TongTruocTroGia?.toLocaleString()} VND</span></p>
          <p><span>Trợ giá:</span><span>{phieu.TroGia?.toLocaleString()} VND</span></p>
          <hr />
          <p><span>Tổng tiền:</span><span>{phieu.TongTien?.toLocaleString()} VND</span></p>
          <p>
            <span>Phương thức thanh toán:</span>
            <span>
                <select value={phuongThuc} onChange={(e) => setPhuongThuc(e.target.value)}>
                <option value="Tiền mặt">Tiền mặt</option>
                <option value="MOMO">MOMO</option>
                </select>
            </span>
            </p>
            <p><span>Ngày lập hóa đơn:</span><span>{ngayLap}</span></p>
          <p><span>Người tạo:</span><span>{tenNhanVien}</span></p>
          <label className="input-label">
            Mã thanh toán:
            <input
              type="text"
              value={maThanhToan}
              onChange={(e) => setMaThanhToan(e.target.value)}
              placeholder="Nhập mã"
            />
          </label>
        </div>
      </div>

      <div className="payment-actions">
        <label>
          <input
            type="checkbox"
            checked={daThanhToan}
            onChange={() => setDaThanhToan(!daThanhToan)}
          />
          {' '}Đã thanh toán
        </label>

        <div className="button-group">
          <button className="btn cancel" onClick={handleHuyPhieu}>
            Hủy phiếu
          </button>
          {(khachHang.LaDonVi || daThanhToan) && (
            <button className="btn confirm" onClick={handleTiepTuc}>
              Tiếp tục
            </button>
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

export default ProcessRegister;
