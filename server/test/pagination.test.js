const assert = require('node:assert/strict');
const { test } = require('node:test');

const { parsePagination } = require('../src/http/pagination');

test('parsePagination supplies safe defaults and trims filters', () => {
  assert.deepEqual(parsePagination({ query: '  KH001 ', status: ' Chờ phát hành ' }), {
    page: 1,
    pageSize: 20,
    query: 'KH001',
    status: 'Chờ phát hành',
  });
});

test('parsePagination rejects invalid values instead of silently clamping them', () => {
  for (const query of [{ page: '0' }, { page: '1.5' }, { pageSize: '101' }]) {
    assert.throws(() => parsePagination(query), { code: 'VALIDATION_ERROR', status: 400 });
  }
});
