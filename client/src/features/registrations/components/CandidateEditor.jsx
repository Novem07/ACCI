import React, { useEffect, useState } from 'react';
import { Button, FormField, Select, TextInput } from '../../../ui';

const emptyCandidate = { fullName: '', certificateId: '', citizenId: '', phone: '', email: '', address: '' };

function createClientId() {
  return globalThis.crypto?.randomUUID?.() || `candidate-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function CandidateEditor({ certificates, initialValue, onSave, onCancel, onDirtyChange }) {
  const [candidate, setCandidate] = useState(initialValue || emptyCandidate);
  const editing = Boolean(initialValue?.clientId);
  useEffect(() => setCandidate(initialValue || emptyCandidate), [initialValue]);
  useEffect(() => onDirtyChange?.(Object.values(candidate).some(Boolean)), [candidate, onDirtyChange]);
  const update = (field) => (event) => setCandidate((current) => ({ ...current, [field]: event.target.value }));

  function submit(event) {
    event.preventDefault();
    onSave({ ...candidate, clientId: candidate.clientId || createClientId() });
    if (!editing) setCandidate(emptyCandidate);
  }

  return <form onSubmit={submit}>
    <h2>{editing ? 'Chỉnh sửa thí sinh' : 'Thêm thí sinh'}</h2>
    <div className="formGrid">
      <FormField id="candidate-fullName" label="Họ tên thí sinh" required><TextInput value={candidate.fullName} onChange={update('fullName')} /></FormField>
      <FormField id="candidate-certificateId" label="Chứng chỉ" required>
        <Select value={candidate.certificateId} onChange={update('certificateId')}>
          <option value="">Chọn chứng chỉ</option>
          {certificates.map((certificate) => <option key={certificate.id} value={certificate.id}>{certificate.id} — {certificate.name}</option>)}
        </Select>
      </FormField>
      <FormField id="candidate-citizenId" label="CCCD thí sinh" required><TextInput value={candidate.citizenId} onChange={update('citizenId')} inputMode="numeric" /></FormField>
      <FormField id="candidate-phone" label="SĐT thí sinh" required><TextInput value={candidate.phone} onChange={update('phone')} inputMode="tel" /></FormField>
      <FormField id="candidate-email" label="Email thí sinh" required><TextInput type="email" value={candidate.email} onChange={update('email')} /></FormField>
      <FormField id="candidate-address" label="Địa chỉ thí sinh" required><TextInput value={candidate.address} onChange={update('address')} /></FormField>
    </div>
    <div className="inlineActions">
      <Button type="submit">{editing ? 'Lưu thay đổi' : 'Thêm thí sinh'}</Button>
      {editing && <Button type="button" variant="quiet" onClick={onCancel}>Hủy chỉnh sửa</Button>}
    </div>
  </form>;
}
