import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './ExtendRegisterPage.css';

function ExtendRegisterPage() {
  const rowRefs = useRef({});
  const [data, setData] = useState([]);
  const [searchBarTerm, setSearchBarTerm] = useState('');
  const [tableSearchTerm, setTableSearchTerm] = useState('');
  const [popup, setPopup] = useState('');
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetch('http://localhost:5000/api/phieuduthi')
      .then(res => res.json())
      .then(data => {
        setData(data);
      })
      .catch(err => console.error('Lỗi khi tải danh sách:', err));
  }, []);

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      const term = searchBarTerm.trim().toLowerCase();
      const foundItem = data.find(
        item =>
          item.MaPhieuDuThi.toLowerCase() === term ||
          item.MaThiSinh.toLowerCase() === term
      );
      if (foundItem) {
        const el = rowRefs.current[foundItem.MaPhieuDuThi];
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.style.backgroundColor = '#ffffcc';
          setTimeout(() => (el.style.backgroundColor = ''), 2000);
        }
      } else {
        alert('Không tìm thấy phiếu phù hợp!');
      }
    }
  };

  const handleExtend = (row) => {
    const { MaPhieuDuThi, NgayThi, GioThi, SoLanGiaHanConLai } = row;
    const examTime = new Date(`${NgayThi}T${GioThi}`);
    const now = new Date();
    const hoursLeft = (examTime - now) / (1000 * 60 * 60);

    if (SoLanGiaHanConLai === 0) {
      setPopup('Đã hết số lần gia hạn!');
    } else if (isNaN(hoursLeft) || hoursLeft < 24) {
      setPopup('Đã quá thời gian gia hạn!');
    } else {
      navigate(`/giahan/create/${MaPhieuDuThi}`);
    }
  };

  const closePopup = () => setPopup('');

  const filteredData = data.filter(item =>
    item.MaPhieuDuThi.toLowerCase().includes(tableSearchTerm.toLowerCase()) ||
    item.MaThiSinh.toLowerCase().includes(tableSearchTerm.toLowerCase())
  );

  return (
    <div className="extend-wrapper">
      <nav className="navbar">
        <div className="logo">ACCI</div>
        <div className="nav-links">
          <span className="disabled" onClick={() => navigate('/taophieu')}>Đăng ký thi</span>
          <span className="disabled">Thanh toán</span>
          <span className="active">Gia hạn thi</span>
          <span className="disabled">Tra cứu</span>
        </div>
        <div className="nav-search-user">
          <input
            type="text"
            placeholder="Tìm kiếm"
            value={searchBarTerm}
            onChange={e => setSearchBarTerm(e.target.value)}
            onKeyDown={handleSearchKeyPress}
          />
          <span className="user-icon">{user?.name}</span>
          <span className="logout-icon" onClick={() => navigate('/login')}>↩</span>
        </div>
      </nav>

      <h2 className="title">Đăng Ký Gia Hạn</h2>

      <div className="search-bar-row">
        <input
          type="text"
          className="search-bar-input"
          placeholder="Tìm kiếm theo Mã PDT hoặc Mã TS"
          value={tableSearchTerm}
          onChange={e => setTableSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="table-container">
        <table>
        <thead>
          <tr>
            <th>Mã PDT</th>
            <th>Mã TS</th>
            <th>Chứng chỉ</th>
            <th>Trạng thái phiếu</th>
            <th>Hành động</th>
          </tr>
        </thead>
          <tbody>
            {filteredData.map((row, index) => (
              <tr
                key={index}
                ref={el => (rowRefs.current[row.MaPhieuDuThi] = el)}
              >
                <td>{row.MaPhieuDuThi}</td>
                <td>{row.MaThiSinh}</td>
                <td>{row.TenChungChi || row.MaChungChi}</td>
                <td>{row.TrangThaiPhieu}</td>
                <td>
                  <button
                    className="btn-extend"
                    onClick={() => handleExtend(row)}
                  >
                    Đăng ký gia hạn
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pagination">&lt; 1 &gt;</div>
      </div>

      {popup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <p>{popup}</p>
            <button onClick={closePopup}>Đóng</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExtendRegisterPage;
