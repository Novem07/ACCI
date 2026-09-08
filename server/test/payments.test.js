const assert = require('node:assert/strict');
const { test } = require('node:test');
const request = require('supertest');

const { createApp } = require('../src/app');
const { createPaymentService } = require('../src/payments/payment.service');

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
    async getCheckout(registrationId) {
      return {
        payment: { registrationId, customerId: 'KH000001', status: 'unpaid', invoiceId: null },
        quote: { registrationId, currency: 'VND', baseAmount: 1000000, discountAmount: 150000, totalAmount: 850000 },
      };
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

  const checkout = await request(app).get('/api/payments/PDK000001/checkout').set('Cookie', cookie);
  assert.equal(checkout.status, 200);
  assert.equal(checkout.body.payment.registrationId, 'PDK000001');
  assert.equal(checkout.body.quote.currency, 'VND');

  const invoice = await request(app)
    .post('/api/payments/PDK000001/invoices')
    .set('Cookie', cookie)
    .send({ paymentMethod: 'Tiền mặt', invoiceDate: '2026-09-08' });
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

test('payment service rejects invoice dates outside the registration-to-today range', async () => {
  const queries = [];
  const transaction = {
    begin: async () => undefined,
    request() {
      const current = {
        input() { return current; },
        async query(statement) {
          queries.push(statement);
          if (statement.includes('FROM PhieuDangKy p')) {
            return { recordset: [{
              registrationId: 'PDK000001', customerId: 'KH000001', customerName: 'Nguyễn Văn A', customerPhone: '0901234567',
              registrationDate: '2030-05-06', registrationStatus: 'Chờ phát hành', organization: 'Không', candidateCount: 1, baseAmount: 100000,
            }] };
          }
          return { recordset: [] };
        },
      };
      return current;
    },
    commit: async () => undefined,
    rollback: async () => undefined,
  };
  const service = createPaymentService({ db: {}, transactionFactory: () => transaction, clock: () => new Date('2030-05-10T08:00:00Z') });

  await assert.rejects(
    service.createInvoice({ registrationId: 'PDK000001', input: { paymentMethod: 'Tiền mặt', invoiceDate: '2030-05-05' }, userId: 'NV002' }),
    { code: 'INVOICE_DATE_OUT_OF_RANGE', status: 400 }
  );
  await assert.rejects(
    service.createInvoice({ registrationId: 'PDK000001', input: { paymentMethod: 'Tiền mặt', invoiceDate: '2030-05-11' }, userId: 'NV002' }),
    { code: 'INVOICE_DATE_OUT_OF_RANGE', status: 400 }
  );
  assert.equal(queries.some((statement) => statement.includes('INSERT INTO HoaDonDangKy')), false);
});
