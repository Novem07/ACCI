const { httpError } = require('../errors');

function parsePositiveInteger(value, field, fallback) {
  if (value === undefined || value === '') return fallback;
  if (!/^\d+$/.test(value)) {
    throw httpError(400, 'VALIDATION_ERROR', `${field} phải là số nguyên dương.`);
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw httpError(400, 'VALIDATION_ERROR', `${field} phải là số nguyên dương.`);
  }
  return parsed;
}

function parsePagination(query, { maxPageSize = 100 } = {}) {
  const page = parsePositiveInteger(query.page, 'page', 1);
  const pageSize = parsePositiveInteger(query.pageSize, 'pageSize', 20);
  if (pageSize > maxPageSize) {
    throw httpError(400, 'VALIDATION_ERROR', `pageSize không được lớn hơn ${maxPageSize}.`);
  }
  if ((page - 1) * pageSize > 2147483647) {
    throw httpError(400, 'VALIDATION_ERROR', 'page quá lớn.');
  }

  const searchQuery = typeof query.query === 'string' ? query.query.trim() : '';
  const status = typeof query.status === 'string' ? query.status.trim() : '';
  return { page, pageSize, query: searchQuery, status };
}

function toPageResponse(result, alias) {
  const items = result.items || [];
  return {
    items,
    page: result.page,
    pageSize: result.pageSize,
    totalItems: result.totalItems,
    totalPages: result.totalPages,
    [alias]: items,
  };
}

module.exports = { parsePagination, toPageResponse };
