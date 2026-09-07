// 📁 client/src/pages/RenewRegisterPage.jsx
import React, { useState } from 'react';
import './RenewRegisterPage.css';
import { useParams, useNavigate } from 'react-router-dom';

function RenewRegisterPage() {
  const { maPhieu } = useParams();
  const navigate = useNavigate();

  const [caseType, setCaseType] = useState('');
  const [newExamDate, setNewExamDate] = useState('');

  const handleSubmit = async () => {
    if (!newExamDate) {
      alert('Vui lòng chọn lịch thi mới');
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/giahan/${maPhieu}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseType, newExamDate }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message);

      alert(result.message || 'Gia hạn thành công!');
      navigate('/giahan');
    } catch (error) {
      alert(error.message || 'Gia hạn thất bại!');
      console.error('Lỗi khi gửi yêu cầu:', error);
    }
  };

  return (
    <div className="renew-page">
      <h2>Tạo phiếu đăng ký gia hạn</h2>

      <div className="checkbox-group">
        <label>
          <input
            type="checkbox"
            checked={caseType === 'thuong'}
            onChange={() => setCaseType(prev => (prev === 'thuong' ? '' : 'thuong'))}
          />
          Thường
        </label>
        <label>
          <input
            type="checkbox"
            checked={caseType === 'dacbiet'}
            onChange={() => setCaseType(prev => (prev === 'dacbiet' ? '' : 'dacbiet'))}
          />
          Đặc biệt
        </label>
      </div>

      <div className="date-picker">
        <label>Chọn lịch thi mới:</label>
        <input
          type="date"
          value={newExamDate}
          onChange={e => setNewExamDate(e.target.value)}
        />
      </div>

      <div className="button-group">
        <button className="cancel" onClick={() => navigate('/giahan')}>
          Hủy
        </button>
        <button className="confirm" onClick={handleSubmit}>
          Tiếp tục
        </button>
      </div>
    </div>
  );
}

export default RenewRegisterPage;
