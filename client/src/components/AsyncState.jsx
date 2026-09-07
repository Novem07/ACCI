import React from 'react';

function AsyncState({ loading, error, empty, children }) {
  if (loading) return <p role="status" aria-live="polite">Đang tải dữ liệu...</p>;
  if (error) return <p role="alert">{error}</p>;
  if (empty) return <p>{empty}</p>;
  return children;
}

export default AsyncState;
