import React from 'react';
import './AsyncState.css';

export default function AsyncState({ loading, error, empty, children }) {
  if (loading) return <div className="async-state" role="status" aria-live="polite"><span className="loading-dot" />Đang tải dữ liệu…</div>;
  if (error) return <p role="alert">{error}</p>;
  if (empty) return <div className="async-state async-empty">{empty}</div>;
  return children;
}
