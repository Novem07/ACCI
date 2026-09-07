import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './ExamFormDetail.css';
import { api, getErrorMessage } from '../api/client';

function ExamFormDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/exam-forms/${id}`)
      .then((result) => setInfo(result.examForm))
      .catch((requestError) => setError(getErrorMessage(requestError, 'Không thể tải chi tiết phiếu dự thi.')));
  }, [id]);

  if (error) return <main className="exam-detail"><p role="alert">{error}</p><button type="button" onClick={() => navigate('/phieuduthi')}>Quay lại</button></main>;
  if (!info) return <main className="exam-detail"><p role="status">Đang tải dữ liệu...</p></main>;

  return (
    <main className="exam-detail">
      <h2>Phiếu dự thi</h2>
      <p><b>Mã phiếu dự thi:</b> {info.examFormId}</p>
      <p><b>Mã thí sinh:</b> {info.candidateId}</p>
      <p><b>Họ tên thí sinh:</b> {info.candidateName}</p>
      <p><b>CCCD:</b> {info.citizenId}</p>
      <p><b>SĐT:</b> {info.phone}</p>
      <p><b>Email:</b> {info.email}</p>
      <p><b>Địa chỉ:</b> {info.address}</p>
      <p><b>Chứng chỉ:</b> {info.certificateName}</p>
      <p><b>Lịch thi:</b> {info.scheduleId}</p>
      <p><b>Ngày thi:</b> {info.examDate ? new Date(info.examDate).toLocaleDateString('vi-VN') : '—'}</p>
      <p><b>Giờ thi:</b> {info.examTime}</p>
      <p><b>Lần gia hạn còn lại:</b> {info.remainingAttempts}</p>
      <p><b>Trạng thái:</b> {info.status}</p>
      <button type="button" onClick={() => navigate('/phieuduthi')}>Quay lại</button>
    </main>
  );
}

export default ExamFormDetail;
