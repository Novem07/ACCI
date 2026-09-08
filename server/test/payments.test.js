const assert = require('node:assert/strict');
const { test } = require('node:test');
const request = require('supertest');

const { createApp } = require('../src/app');

const config = {
  nodeEnv: 'test',
  clientOrigin: 'http://localhost:3000',
  jwtSecret: 'test-secret-with-at-least-32-characters',
};

function authDb(role = 'Kế Toán') {
  return {
    request() {
      const current = {
        input() { return current; },
        async query() {
          return {
            recordset: [{
              MaNhanVien: 'NV002', HoTen: 'Trần Thị B', VaiTro: role,
              MatKhauHash: '$2b$04$Y63QbNce1aiqSHGSPOvH1OtEdkAlGJgkYh9XWekuZDf7DkvG3VZFq',
            }],
          };
        },
      };
      return current;
    },
  };
}

test('payment routes use registrationId and return a canonical quote', async () => {
  const service = {
    async list(params) {
      assert.deepEqual(params, { page: 2, pageSize: 10, query: 'KH', status: 'unpaid' });
      return {
        items: [{ registrationId: 'PDK000001', customerId: 'KH000001', status: 'unpaid' }],
        page: 2, pageSize: 10, totalItems: 11, totalPages: 2,
      };
    },
    async get(registrationId) { return { registrationId }; },
    async quote(registrationId) {
      return { registrationId, baseAmount: 1000000, discountAmount: 150000, totalAmount: 850000, currency: 'VND' };
    },
    async createInvoice({ registrationId, userId }) {
      return { invoiceId: 'HD000001', registrationId, createdBy: userId };
    },
  };
  const app = createApp({ db: authDb(), config, services: { payment: service } });
  const login = await request(app).post('/api/auth/login').send({ employeeId: 'NV002', password: 'correct-password' });
  const cookie = login.headers['set-cookie'];

  const paymentPage = await request(app).get('/api/payments?page=2&pageSize=10&query=KH&status=unpaid').set('Cookie', cookie);
  assert.equal(paymentPage.status, 200);
  assert.deepEqual(paymentPage.body.items, [{ registrationId: 'PDK000001', customerId: 'KH000001', status: 'unpaid' }]);
  assert.deepEqual(paymentPage.body.payments, paymentPage.body.items);
  assert.deepEqual({ page: paymentPage.body.page, pageSize: paymentPage.body.pageSize, totalItems: paymentPage.body.totalItems, totalPages: paymentPage.body.totalPages }, {
    page: 2, pageSize: 10, totalItems: 11, totalPages: 2,
  });

  const invalidPage = await request(app).get('/api/payments?pageSize=101').set('Cookie', cookie);
  assert.equal(invalidPage.status, 400);
  const invalidStatus = await request(app).get('/api/payments?status=pending').set('Cookie', cookie);
  assert.equal(invalidStatus.status, 400);

  const quote = await request(app).get('/api/payments/PDK000001/quote').set('Cookie', cookie);
  assert.equal(quote.status, 200);
  assert.equal(quote.body.quote.registrationId, 'PDK000001');
  assert.equal(quote.body.quote.totalAmount, 850000);

  const invoice = await request(app)
    .post('/api/payments/PDK000001/invoices')
    .set('Cookie', cookie)
    .send({ paymentMethod: 'Tiền mặt' });
  assert.equal(invoice.status, 201);
  assert.equal(invoice.body.invoice.registrationId, 'PDK000001');
  assert.equal(invoice.body.invoice.createdBy, 'NV002');
});

test('payment routes reject non-accountants and caller-owned status fields', async () => {
  const service = { async list() { return []; } };
  const app = createApp({ db: authDb('Tiếp nhận'), config, services: { payment: service } });
  const login = await request(app).post('/api/auth/login').send({ employeeId: 'NV002', password: 'correct-password' });
  const response = await request(app)
    .post('/api/payments/PDK000001/invoices')
    .set('Cookie', login.headers['set-cookie'])
    .send({ paymentMethod: 'Tiền mặt', status: 'Đã thanh toán' });
  assert.equal(response.status, 403);
});
