// src/components/WarningModal.jsx
import React from 'react';
import './WarningModal.css';

function WarningModal({ message, onClose }) {
  return (
    <div className="modal-overlay" role="presentation">
      <div className="warning-modal" role="alertdialog" aria-modal="true" aria-labelledby="warning-title">
        <div className="modal-header">
          <span id="warning-title" className="modal-title">Thông báo</span>
        </div>
        <div className="modal-body">
          <p>{message}</p>
          <div className="modal-buttons">
            <button type="button" className="confirm" onClick={onClose}>OK</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WarningModal;
