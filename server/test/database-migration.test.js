const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { test } = require('node:test');

test('workflow migration declares uniqueness and schedule lookup indexes', () => {
  const sql = readFileSync(resolve(__dirname, '../../database/migrations/003_workflow_indexes.sql'), 'utf8');
  assert.match(sql, /UX_PhieuDuThi_Registration_Candidate/);
  assert.match(sql, /UX_HoaDonDangKy_Registration/);
  assert.match(sql, /IX_LichThi_Certificate_Date/);
  assert.match(sql, /THROW/);
});
