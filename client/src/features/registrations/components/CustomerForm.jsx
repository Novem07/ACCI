import React, { useEffect, useState } from 'react';
import { Button, FormField, TextInput } from '../../../ui';

const emptyCustomer = { fullName: '', organization: '', citizenId: '', phone: '', email: '', address: '' };

export default function CustomerForm({ onCreate, onDirtyChange, loading = false }) {
  const [customer, setCustomer] = useState(emptyCustomer);
  const update = (field) => (event) => setCustomer((current) => ({ ...current, [field]: event.target.value }));
  useEffect(() => onDirtyChange?.(Object.values(customer).some(Boolean)), [customer, onDirtyChange]);

  async function submit(event) {
    event.preventDefault();
    if (await onCreate(customer)) setCustomer(emptyCustomer);
  }

  return <form onSubmit={submit}>
    <h2>Thêm khách hàng mới</h2>
    <div className="formGrid">
      <FormField id="customer-fullName" label="Họ tên khách hàng" required><TextInput value={customer.fullName} onChange={update('fullName')} /></FormField>
      <FormField id="customer-organization" label="Đơn vị" hint="Nhập “Không” nếu là cá nhân." required><TextInput value={customer.organization} onChange={update('organization')} /></FormField>
      <FormField id="customer-citizenId" label="CCCD"><TextInput value={customer.citizenId} onChange={update('citizenId')} inputMode="numeric" /></FormField>
      <FormField id="customer-phone" label="SĐT" required><TextInput value={customer.phone} onChange={update('phone')} inputMode="tel" /></FormField>
      <FormField id="customer-email" label="Email" required><TextInput type="email" value={customer.email} onChange={update('email')} /></FormField>
      <FormField id="customer-address" label="Địa chỉ" required><TextInput value={customer.address} onChange={update('address')} /></FormField>
    </div>
    <Button type="submit" variant="secondary" loading={loading}>Thêm và chọn khách hàng</Button>
  </form>;
}
