const assert = require('node:assert/strict');
const { test } = require('node:test');
const { z } = require('zod');

const { validate } = require('../src/http/validate');

test('validate stores parsed values and returns flattened validation details', () => {
  const middleware = validate({ body: z.object({ id: z.string().trim().min(1) }) }, 'Dữ liệu không hợp lệ.');
  const request = { body: { id: ' NV001 ' } };
  let nextError;

  middleware(request, {}, (error) => { nextError = error; });
  assert.deepEqual(request.validated, { body: { id: 'NV001' } });
  assert.equal(nextError, undefined);

  middleware({ body: { id: '' } }, {}, (error) => { nextError = error; });
  assert.equal(nextError.status, 400);
  assert.equal(nextError.code, 'VALIDATION_ERROR');
  assert.deepEqual(nextError.details.id, ['Too small: expected string to have >=1 characters']);
});
