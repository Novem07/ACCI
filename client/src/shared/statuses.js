function status(label, tone) {
  return Object.freeze({ label, tone });
}

export const REGISTRATION_STATUS = Object.freeze({
  'Chờ phát hành': status('Chờ phát hành', 'warning'),
  'Đã phát hành': status('Đã phát hành', 'success'),
  'Đã hủy': status('Đã hủy', 'danger'),
});

export const PAYMENT_STATUS = Object.freeze({
  unpaid: status('Chờ thanh toán', 'warning'),
  paid: status('Đã thanh toán', 'success'),
});

export const EXAM_FORM_STATUS = Object.freeze({
  'Đang xử lý': status('Đang xử lý', 'warning'),
  'Đã xử lý': status('Đã xử lý', 'success'),
  'Đã phát': status('Đã phát', 'success'),
});
