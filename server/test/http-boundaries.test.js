const assert = require('node:assert/strict');
const { test } = require('node:test');
const request = require('supertest');

const { createApp } = require('../src/app');

const config = {
  nodeEnv: 'test',
  clientOrigin: 'http://localhost:3000',
  jwtSecret: 'test-secret-with-at-least-32-characters',
};

function authDb() {
  return {
    request() {
      const query = {
        input() { return query; },
        async query() {
          return {
            recordset: [{
              MaNhanVien: 'NV001',
              HoTen: 'Nguyễn Văn A',
              VaiTro: 'Tiếp nhận',
              MatKhauHash: '$2b$04$Y63QbNce1aiqSHGSPOvH1OtEdkAlGJgkYh9XWekuZDf7DkvG3VZFq',
            }],
          };
        },
      };
      return query;
    },
  };
}

test('validation errors include the request ID returned in the response header', async () => {
  const app = createApp({
    db: authDb(),
    config,
    services: { customer: { async list() { return { items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 0 }; } } },
  });
  const login = await request(app)
    .post('/api/auth/login')
    .send({ employeeId: 'NV001', password: 'correct-password' });

  const response = await request(app)
    .get('/api/customers?pageSize=not-a-number')
    .set('Cookie', login.headers['set-cookie']);

  assert.equal(response.status, 400);
  assert.equal(response.body.error.code, 'VALIDATION_ERROR');
  assert.match(response.headers['x-request-id'], /^[\da-f-]{36}$/i);
  assert.equal(response.body.error.requestId, response.headers['x-request-id']);
});
