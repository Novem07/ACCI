// src/components/ConfirmModal.jsx
import React from 'react';
import './ConfirmModal.css';

function ConfirmModal({ name, cert, date, gender, dob, customerType, onCancel, onConfirm }) {
    const formattedDate = date.split('-').reverse().join('/');
  
    const getCertLabel = (value) => {
      switch (value) {
        case 'toeic': return 'TOEIC';
        case 'tin': return 'Ứng dụng CNTT';
        default: return value;
      }
    };
  
    return (
      <div className="modal-overlay">
        <div className="confirm-modal-box">
          <div className="modal-title">Xác nhận thông tin</div>
          <div className="modal-info">
            <p><strong>Họ tên thí sinh:</strong> {name}</p>
            <p><strong>Loại chứng chỉ:</strong> {getCertLabel(cert)}</p>
            <p><strong>Ngày thi:</strong> {formattedDate}</p>
            <p><strong>Giới tính:</strong> {gender}</p>
            <p><strong>Ngày sinh:</strong> {dob}</p>
            <p><strong>Loại khách:</strong> {customerType}</p>

          </div>
          <div className="modal-buttons">
            <button className="cancel" onClick={onCancel}>Huỷ</button>
            <button className="confirm" onClick={onConfirm}>Xác nhận</button>
          </div>
        </div>
      </div>
    );
  }  

export default ConfirmModal;
