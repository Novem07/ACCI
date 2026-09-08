import React from 'react';
import { FormField, Select } from '../../../ui';

export default function CustomerSelector({ customers, value, onChange }) {
  return <FormField id="registration-customer" label="Chọn khách hàng" required>
    <Select value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">Chọn khách hàng có sẵn</option>
      {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.id} — {customer.fullName}</option>)}
    </Select>
  </FormField>;
}
