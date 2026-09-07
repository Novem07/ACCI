import React, { useEffect, useState } from 'react';
import './CreateRegisterPage.css';
import { useNavigate } from 'react-router-dom';

function CreateRegisterPage() {
  const navigate = useNavigate();
  const [maKhachHangList, setMaKhachHangList] = useState([]);
  const [maChungChiList, setMaChungChiList] = useState([]);

  const [selectedMaKH, setSelectedMaKH] = useState('');
  const [khachHangInfo, setKhachHangInfo] = useState({
    hoTen: '', donVi: '', cccd: '', sdt: '', email: '', diaChi: ''
  });

  const [thiSinhInfo, setThiSinhInfo] = useState({
    hoTen: '', maChungChi: '', cccd: '', sdt: '', email: '', diaChi: ''
  });
  const [thiSinhList, setThiSinhList] = useState([]);

  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    // Lấy danh sách khách hàng
    fetch('http://localhost:5000/api/khachhang')
      .then(res => res.text())
      .then(text => {
        if (!text) return;
        const data = JSON.parse(text);
        setMaKhachHangList(data);
      })
      .catch(err => console.error('❌ Lỗi lấy danh sách KH:', err));

    // Lấy danh sách chứng chỉ
    fetch('http://localhost:5000/api/chungchi')
      .then(res => res.text())
      .then(text => {
        if (!text) return;
        const data = JSON.parse(text);
        setMaChungChiList(data);
      })
      .catch(err => console.error('❌ Lỗi lấy danh sách chứng chỉ:', err));
  }, []);

  const handleSelectKH = async (maKH) => {
    setSelectedMaKH(maKH);
    if (!maKH) {
      setKhachHangInfo({ hoTen: '', donVi: '', cccd: '', sdt: '', email: '', diaChi: '' });
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/khachhang/${maKH}`);
      const text = await res.text();
      if (!res.ok || !text) throw new Error('Không có dữ liệu');
      const data = JSON.parse(text);
      setKhachHangInfo({
        hoTen: data.HoTen || '',
        donVi: data.DonVi || '',
        cccd: data.CCCD || '',
        sdt: data.SDT || '',
        email: data.Email || '',
        diaChi: data.DiaChi || ''
      });
    } catch (err) {
      alert('Không thể load khách hàng: ' + err.message);
      console.error(err);
    }
  };

  const handleAddKH = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/khachhang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(khachHangInfo)
      });
      const text = await res.text();
      const result = text ? JSON.parse(text) : {};
      alert(result.message || 'Đã thêm khách hàng');
    } catch (err) {
      alert('Lỗi khi thêm khách hàng');
      console.error(err);
    }
  };

  const handleAddThiSinh = () => {
    const { hoTen, maChungChi, cccd, sdt, email, diaChi } = thiSinhInfo;
    if (!hoTen || !maChungChi || !cccd || !sdt || !email || !diaChi) {
      alert('Vui lòng điền đầy đủ thông tin thí sinh');
      return;
    }
  
    const updatedList = [...thiSinhList, thiSinhInfo];
    setThiSinhList(updatedList);
    localStorage.setItem('tempThiSinhList', JSON.stringify(updatedList)); // 👈 Lưu vào localStorage
  
    setThiSinhInfo({ hoTen: '', maChungChi: '', cccd: '', sdt: '', email: '', diaChi: '' });
  };
  

  const handleSubmit = async () => {
    if (!selectedMaKH) {
      alert('Vui lòng chọn hoặc thêm khách hàng!');
      return;
    }

    try {
      const resPDK = await fetch('http://localhost:5000/api/phieudangky', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          MaKhachHang: selectedMaKH,
          NguoiTao: user.maNV,
          TrangThaiPhieu: 'Chờ phát hành',
          NgayDangKy: new Date().toISOString().split('T')[0]
        })
      });

      const text = await resPDK.text();
      const result = text ? JSON.parse(text) : {};
      const maPhieuDangKy = result.maPhieuDangKy;

      for (const ts of thiSinhList) {
        await fetch('http://localhost:5000/api/phieuduthi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...ts, MaPhieuDangKy: maPhieuDangKy })
        });
      }

      alert('Tạo phiếu đăng ký thành công!');
      navigate('/tiepnhan');
    } catch (err) {
      alert('Lỗi khi tạo phiếu đăng ký');
      console.error(err);
    }
  };

  return (
    <div className="page-wrapper">
      <nav className="navbar">
        <div className="logo">ACCI</div>
        <div className="nav-links">
          <span className="active">Đăng ký thi</span>
          <span className="disabled">Thanh toán</span>
          <span className="disabled" onClick={() => navigate('/giahan')}>Gia hạn thi</span>
          <span className="disabled">Tra cứu</span>
        </div>
        <div className="nav-search-user">
          <input type="text" placeholder="Tìm kiếm" />
          <span className="user-icon">👤 {user.name}</span>
          <span className="logout-icon" onClick={() => navigate('/login')}>↩</span>
        </div>
      </nav>

      <div className="form-container">
        <h2>Tạo Phiếu Đăng Ký Mới</h2>

        {/* Thông tin khách hàng */}
        <div className="form-section">
          <h4>Thông tin khách hàng</h4>
          <select value={selectedMaKH} onChange={e => handleSelectKH(e.target.value)}>
            <option value="">-- Chọn mã khách hàng --</option>
            {maKhachHangList.map(kh => (
              <option key={kh.MaKhachHang} value={kh.MaKhachHang}>
                {kh.MaKhachHang}
              </option>
            ))}
          </select>
          <div className="input-row">
            <input placeholder="Họ tên khách hàng" value={khachHangInfo.hoTen} onChange={e => setKhachHangInfo({ ...khachHangInfo, hoTen: e.target.value })} />
            <input placeholder="Đơn vị" value={khachHangInfo.donVi} onChange={e => setKhachHangInfo({ ...khachHangInfo, donVi: e.target.value })} />
          </div>
          <div className="input-row">
            <input placeholder="CCCD" value={khachHangInfo.cccd} onChange={e => setKhachHangInfo({ ...khachHangInfo, cccd: e.target.value })} />
            <input placeholder="SĐT" value={khachHangInfo.sdt} onChange={e => setKhachHangInfo({ ...khachHangInfo, sdt: e.target.value })} />
            <input placeholder="Email" value={khachHangInfo.email} onChange={e => setKhachHangInfo({ ...khachHangInfo, email: e.target.value })} />
          </div>
          <input placeholder="Địa chỉ" value={khachHangInfo.diaChi} onChange={e => setKhachHangInfo({ ...khachHangInfo, diaChi: e.target.value })} />
          <button className="btn btn-black" onClick={handleAddKH}>Thêm khách hàng</button>
        </div>

        {/* Thông tin thí sinh */}
        <div className="form-section">
          <h4>Thông tin thí sinh</h4>
          <div className="input-row">
            <input placeholder="Họ tên thí sinh" value={thiSinhInfo.hoTen} onChange={e => setThiSinhInfo({ ...thiSinhInfo, hoTen: e.target.value })} />
            <select value={thiSinhInfo.maChungChi} onChange={e => setThiSinhInfo({ ...thiSinhInfo, maChungChi: e.target.value })}>
              <option value="">-- Chọn chứng chỉ --</option>
              {maChungChiList.map(cc => (
                <option key={cc.MaChungChi} value={cc.MaChungChi}>
                  {cc.TenChungChi}
                </option>
              ))}
            </select>
          </div>
          <div className="input-row">
            <input placeholder="CCCD" value={thiSinhInfo.cccd} onChange={e => setThiSinhInfo({ ...thiSinhInfo, cccd: e.target.value })} />
            <input placeholder="SĐT" value={thiSinhInfo.sdt} onChange={e => setThiSinhInfo({ ...thiSinhInfo, sdt: e.target.value })} />
            <input placeholder="Email" value={thiSinhInfo.email} onChange={e => setThiSinhInfo({ ...thiSinhInfo, email: e.target.value })} />
          </div>
          <input placeholder="Địa chỉ" value={thiSinhInfo.diaChi} onChange={e => setThiSinhInfo({ ...thiSinhInfo, diaChi: e.target.value })} />
          <button className="btn btn-blue" onClick={handleAddThiSinh}>Thêm thí sinh</button>
        </div>

        <div className="button-group">
          <button className="btn btn-red" onClick={() => navigate('/tiepnhan')}>Hủy</button>
          <button className="btn btn-gray" onClick={() => navigate('/xemtempthisinh')}>Xem danh sách thí sinh</button>
          <button className="btn btn-green" onClick={handleSubmit}>Tiếp tục</button>
        </div>
      </div>
    </div>
  );
}

export default CreateRegisterPage;
