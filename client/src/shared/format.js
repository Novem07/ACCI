const fallback = '—';

export function formatDate(value) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' }).format(date);
}

export function formatCurrency(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return fallback;
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
}

export function formatIdentifier(value) {
  return value || fallback;
}
