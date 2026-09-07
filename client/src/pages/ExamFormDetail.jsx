import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './ExamFormDetail.css';

function ExamFormDetail() {
  const { id } = useParams();
  const [info, setInfo] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5000/api/phieuduthi/${id}`)
      .then(res => res.json())
      .then(setInfo)
      .catch(err => console.error('Lỗi khi tải chi tiết phiếu:', err));
  }, [id]);

  if (!info) return <div>Không tìm thấy dữ liệu cho mã phiếu: {id}</div>;

  return (
    <div className="exam-detail">
      <h2>Phiếu Dự Thi</h2>
      <p><b>Mã phiếu dự thi:</b> {info.MaPhieuDuThi}</p>
      <p><b>Họ tên thí sinh:</b> {info.HoTen}</p>
      <p><b>CCCD:</b> {info.CCCD}</p>
      <p><b>SDT:</b> {info.SDT}</p>
      <p><b>Email:</b> {info.Email}</p>
      <p><b>Địa chỉ:</b> {info.DiaChi}</p>
      <p><b>Số báo danh:</b> {info.SoBaoDanh}</p>
      <p><b>Chứng chỉ:</b> {info.TenChungChi}</p>
      <p><b>Ngày thi:</b> {info.NgayThi}</p>
      <p><b>Giờ thi:</b> {info.GioThi}</p>
      <p><b>Số lần gia hạn còn lại:</b> {info.SoLanGiaHanConLai}</p>
    </div>
  );
}

export default ExamFormDetail;
