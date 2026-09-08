const assert = require('node:assert/strict');
const { test } = require('node:test');

const { EXAM_FORM_STATUS, REGISTRATION_STATUS, ROLES } = require('../src/domain/constants');

test('domain constants preserve the exact persisted roles and workflow statuses', () => {
  assert.equal(ROLES.RECEPTION, 'Tiếp nhận');
  assert.equal(ROLES.ACCOUNTING, 'Kế Toán');
  assert.equal(ROLES.EXAM_ORGANIZER, 'Tổ chức thi');
  assert.equal(REGISTRATION_STATUS.PENDING_ISSUANCE, 'Chờ phát hành');
  assert.equal(REGISTRATION_STATUS.ISSUED, 'Đã phát hành');
  assert.equal(EXAM_FORM_STATUS.PROCESSING, 'Đang xử lý');
});
