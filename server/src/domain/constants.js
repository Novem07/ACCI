const ROLES = Object.freeze({
  RECEPTION: 'Tiếp nhận',
  ACCOUNTING: 'Kế Toán',
  EXAM_ORGANIZER: 'Tổ chức thi',
  DATA_ENTRY: 'Nhập liệu',
  PROCTOR: 'Coi thi',
});

const REGISTRATION_STATUS = Object.freeze({
  PENDING_ISSUANCE: 'Chờ phát hành',
  ISSUED: 'Đã phát hành',
  CANCELLED: 'Đã hủy',
});

const EXAM_FORM_STATUS = Object.freeze({
  PROCESSING: 'Đang xử lý',
  PROCESSED: 'Đã xử lý',
  PUBLISHED: 'Đã phát',
});

module.exports = { EXAM_FORM_STATUS, REGISTRATION_STATUS, ROLES };
