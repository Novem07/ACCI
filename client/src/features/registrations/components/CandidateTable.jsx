import React from 'react';
import { Button, DataTable, EmptyState } from '../../../ui';

export default function CandidateTable({ candidates, certificatesById, onEdit, onRemove }) {
  if (candidates.length === 0) return <EmptyState title="Chưa có thí sinh" description="Thêm ít nhất một thí sinh để tạo phiếu đăng ký." />;
  return <DataTable
    label="Danh sách thí sinh đăng ký"
    columns={['Họ tên', 'Chứng chỉ', 'CCCD', 'Thao tác']}
    rows={candidates}
    getRowKey={(candidate) => candidate.clientId}
    renderRow={(candidate) => <>
      <td>{candidate.fullName}</td>
      <td>{certificatesById[candidate.certificateId]?.name || candidate.certificateId}</td>
      <td>{candidate.citizenId}</td>
      <td><div className="inlineActions"><Button type="button" variant="quiet" size="sm" onClick={() => onEdit(candidate)}>Sửa</Button><Button type="button" variant="quiet" size="sm" onClick={() => onRemove(candidate.clientId)}>Xóa</Button></div></td>
    </>}
  />;
}
