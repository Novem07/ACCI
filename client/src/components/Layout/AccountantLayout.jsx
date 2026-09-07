import React from 'react';
import './AccountantLayout.css';

const Layout = ({ children }) => {
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
          <span className="user-icon">👤 Nguyễn Văn A</span>
          <span className="logout-icon">↩</span>
        </div>
      </nav>
      <div className="layout-content">
        {children}
      </div>
    </div>
  );
};

export default Layout;
