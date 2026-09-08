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
      const current = {
        input() { return current; },
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
      return current;
    },
  };
}

test('reception contract creates a customer and registration, then cannot access accounting', async () => {
  const customers = [];
  const registrations = [];
  const customerService = {
    async list({ page, pageSize, query }) {
      assert.deepEqual({ page, pageSize, query }, { page: 1, pageSize: 20, query: '' });
      return { items: customers, page, pageSize, totalItems: customers.length, totalPages: 1 };
    },
    async create(input) {
      const customer = { id: 'KH000001', ...input };
      customers.push(customer);
      return customer;
    },
  };
  const registrationService = {
    async list({ page, pageSize, query, status }) {
      assert.deepEqual({ page, pageSize, query, status }, { page: 2, pageSize: 10, query: 'PDK', status: 'Chờ phát hành' });
      return { items: registrations, page, pageSize, totalItems: 14, totalPages: 2 };
    },
    async create({ input, userId }) {
      const registration = {
        id: 'PDK000001',
        customerId: input.customerId,
        status: 'Chờ phát hành',
        candidateCount: input.candidates.length,
        createdBy: userId,
      };
      registrations.push(registration);
      return registration;
    },
  };
  const app = createApp({
    db: authDb(),
    config,
    services: { customer: customerService, registration: registrationService },
  });

  const login = await request(app)
    .post('/api/auth/login')
    .send({ employeeId: 'NV001', password: 'correct-password' });
  assert.equal(login.status, 200);
  const cookie = login.headers['set-cookie'];

  const customerResponse = await request(app)
    .post('/api/customers')
    .set('Cookie', cookie)
    .send({
      fullName: 'Khách hàng mẫu', organization: 'Không', citizenId: '',
      phone: '0901234567', email: 'kh@example.com', address: 'Hà Nội',
    });
  assert.equal(customerResponse.status, 201);
  assert.equal(customerResponse.body.customer.id, 'KH000001');

  const listResponse = await request(app).get('/api/customers').set('Cookie', cookie);
  assert.equal(listResponse.status, 200);
  assert.equal(listResponse.body.customers.length, 1);
  assert.deepEqual(listResponse.body.items, customers);
  assert.deepEqual({ page: listResponse.body.page, pageSize: listResponse.body.pageSize, totalItems: listResponse.body.totalItems, totalPages: listResponse.body.totalPages }, {
    page: 1, pageSize: 20, totalItems: 1, totalPages: 1,
  });

  const registrationResponse = await request(app)
    .post('/api/registrations')
    .set('Cookie', cookie)
    .send({
      customerId: customerResponse.body.customer.id,
      registrationDate: '2026-09-08',
      candidates: [{
        fullName: 'Thí sinh mẫu', certificateId: 'CC001', citizenId: '079123456789',
        phone: '0907654321', email: 'ts@example.com', address: 'Đà Nẵng',
      }],
    });
  assert.equal(registrationResponse.status, 201);
  assert.equal(registrationResponse.body.registration.id, 'PDK000001');

  const registrationsResponse = await request(app)
    .get('/api/registrations?page=2&pageSize=10&query=PDK&status=Ch%E1%BB%9D%20ph%C3%A1t%20h%C3%A0nh')
    .set('Cookie', cookie);
  assert.equal(registrationsResponse.status, 200);
  assert.equal(registrationsResponse.body.registrations[0].id, 'PDK000001');
  assert.deepEqual(registrationsResponse.body.items, registrations);
  assert.deepEqual({ page: registrationsResponse.body.page, pageSize: registrationsResponse.body.pageSize, totalItems: registrationsResponse.body.totalItems, totalPages: registrationsResponse.body.totalPages }, {
    page: 2, pageSize: 10, totalItems: 14, totalPages: 2,
  });

  const invalidPagination = await request(app).get('/api/customers?pageSize=101').set('Cookie', cookie);
  assert.equal(invalidPagination.status, 400);
  assert.equal(invalidPagination.body.error.code, 'VALIDATION_ERROR');
  assert.equal((await request(app).get('/api/payments').set('Cookie', cookie)).status, 403);
});
