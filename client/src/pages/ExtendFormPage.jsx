import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './ExtendFormPage.css';
import { api, getErrorMessage } from '../api/client';
import AppShell from '../components/AppShell';

function ExtendFormPage() {
  const { maPhieu } = useParams();
  const navigate = useNavigate();
  const [caseType, setCaseType] = useState('');
  const [scheduleId, setScheduleId] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/extensions/${maPhieu}/extension-options`)
      .then((result) => setSchedules(result.schedules || []))
      .catch((requestError) => setError(getErrorMessage(requestError, 'Không thể tải lịch thi phù hợp.')))
      .finally(() => setLoading(false));
  }, [maPhieu]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!caseType || !scheduleId) {
      setError('Vui lòng chọn trường hợp và lịch thi mới.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.post('/extensions', { examFormId: maPhieu, caseType, newScheduleId: scheduleId });
      navigate('/giahan');
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Không thể tạo phiếu gia hạn.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <AppShell><div className="extend-form-wrapper"><p role="status">Đang tải lịch thi...</p></div></AppShell>;

  return (
    <AppShell><div className="extend-form-wrapper">
      <form className="form-container" onSubmit={handleSubmit}>
        <h2 className="form-title">Tạo phiếu đăng ký gia hạn</h2>
        {error && <p role="alert" className="form-error">{error}</p>}
        <fieldset>
          <legend>Chọn trường hợp</legend>
          <div className="case-options">
            <label><input type="radio" name="case" value="Thường" checked={caseType === 'Thường'} onChange={(event) => setCaseType(event.target.value)} /> Thường</label>
            <label><input type="radio" name="case" value="Đặc biệt" checked={caseType === 'Đặc biệt'} onChange={(event) => setCaseType(event.target.value)} /> Đặc biệt</label>
          </div>
        </fieldset>
        <label htmlFor="new-schedule">Chọn lịch thi mới</label>
        <select id="new-schedule" className="select-input" value={scheduleId} onChange={(event) => setScheduleId(event.target.value)}>
          <option value="">-- Chọn lịch thi --</option>
          {schedules.map((item) => (
            <option key={item.scheduleId} value={item.scheduleId}>
              {item.examDate ? new Date(item.examDate).toLocaleDateString('vi-VN') : '—'} - {item.examTime} ({item.scheduleId}, còn {item.remainingSeats} chỗ)
            </option>
          ))}
        </select>
        {!schedules.length && <p>Không còn lịch thi phù hợp.</p>}
        <div className="form-buttons">
          <button className="btn-cancel" type="button" onClick={() => navigate('/giahan')}>Hủy</button>
          <button className="btn-submit" type="submit" disabled={submitting || !schedules.length}>{submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}</button>
        </div>
      </form>
    </div></AppShell>
  );
}

export default ExtendFormPage;
