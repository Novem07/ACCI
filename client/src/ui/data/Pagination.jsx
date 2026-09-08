import React from 'react';
import Button from '../actions/Button';
export default function Pagination({ page, totalPages, onPageChange }) { return <nav aria-label="Phân trang"><Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Trang trước</Button><span aria-live="polite"> Trang {page}/{totalPages} </span><Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Trang sau</Button></nav>; }
