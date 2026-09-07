import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ExtendFormPage.css';

function ExtendFormPage() {
  const { maPhieu } = useParams();
  const navigate = useNavigate();
  const [caseType, setCaseType] = useState('');
  const [lichThiMoi, setLichThiMoi] = useState('');
  const [lichThiList, setLichThiList] = useState([]);

  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetch(`http://localhost:5000/api/lichthi/giahan/${maPhieu}`)
      .then(res => res.json())
      .then(data => setLichThiList(data))
      .catch(err => console.error('Lỗi khi lấy lịch thi phù hợp:', err));
  }, [maPhieu]);

  const handleSubmit = () => {
    if (!caseType || !lichThiMoi) {
      alert('Vui lòng chọn trường hợp và lịch thi mới!');
      return;
    }

    fetch('http://localhost:5000/api/phieudangkygiahan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        maPhieuDuThi: maPhieu,
        truongHop: caseType,
        lichThiMoi,
        nguoiTao: user.maNV
      })
    })
      .then(res => res.json())
      .then(data => {
        alert(data.message || 'Tạo phiếu đăng ký gia hạn thành công!');
        navigate('/giahan');
      })
      .catch(err => {
        console.error('Lỗi khi tạo phiếu đăng ký gia hạn:', err);
        alert('Có lỗi xảy ra khi gửi yêu cầu.');
      });
  };

  return (
    <div className="extend-form-wrapper">
      <div className="form-container">
        <h2 className="form-title">Tạo phiếu đăng ký gia hạn</h2>
  
        <div>
          <p>Chọn trường hợp</p>
          <div className="case-options">
            <label>
              <input type="radio" name="case" value="Thường" onChange={e => setCaseType(e.target.value)} /> Thường
            </label>
            <label>
              <input type="radio" name="case" value="Đặc biệt" onChange={e => setCaseType(e.target.value)} /> Đặc biệt
            </label>
          </div>
        </div>
  
        <div>
          <p>Chọn lịch thi mới</p>
          <select className="select-input" onChange={e => setLichThiMoi(e.target.value)} defaultValue="">
            <option value="" disabled>-- Chọn lịch thi --</option>
            {lichThiList.map(item => (
              <option key={item.MaLichThi} value={item.MaLichThi}>
                {item.NgayThi} - {item.GioThi} ({item.MaLichThi})
              </option>
            ))}
          </select>
        </div>
  
        <div className="form-buttons">
          <button className="btn-cancel" onClick={() => navigate('/giahan')}>Hủy</button>
          <button className="btn-submit" onClick={handleSubmit}>Tiếp tục</button>
        </div>
      </div>
    </div>
  );  
}

export default ExtendFormPage;