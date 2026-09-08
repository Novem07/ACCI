const assert = require('node:assert/strict');
const { test } = require('node:test');
const request = require('supertest');

const { createApp } = require('../src/app');

const config = {
  nodeEnv: 'test',
  clientOrigin: 'http://localhost:3000',
  jwtSecret: 'test-secret-with-at-least-32-characters',
};

function authDb(role = 'Tiếp nhận') {
  return {
    request() {
      const current = {
        input() { return current; },
        async query() {
          return { recordset: [{
            MaNhanVien: 'NV001', HoTen: 'Nguyễn Văn A', VaiTro: role,
            MatKhauHash: '$2b$04$Y63QbNce1aiqSHGSPOvH1OtEdkAlGJgkYh9XWekuZDf7DkvG3VZFq',
          }] };
        },
      };
      return current;
    },
  };
}

async function receptionCookie(app) {
  const login = await request(app).post('/api/auth/login').send({ employeeId: 'NV001', password: 'correct-password' });
  return login.headers['set-cookie'];
}

test('candidate directory validates pagination before querying and returns a common page response', async () => {
  let listCalls = 0;
  const candidates = [{ id: 'TS000001', fullName: 'Trần Minh An', citizenId: '079123456789' }];
  const catalogService = {
    async listCertificates() { return []; },
    async listCandidates(params) {
      listCalls += 1;
      assert.deepEqual(params, { page: 2, pageSize: 20, query: 'An', status: '' });
      return { items: candidates, page: 2, pageSize: 20, totalItems: 21, totalPages: 2 };
    },
  };
  const app = createApp({ db: authDb(), config, services: { catalog: catalogService } });
  const cookie = await receptionCookie(app);

  const invalid = await request(app).get('/api/catalog/candidates?pageSize=101').set('Cookie', cookie);
  assert.equal(invalid.status, 400);
  assert.equal(invalid.body.error.code, 'VALIDATION_ERROR');
  assert.equal(listCalls, 0);

  const response = await request(app).get('/api/catalog/candidates?page=2&pageSize=20&query=An').set('Cookie', cookie);
  assert.equal(response.status, 200);
  assert.deepEqual(response.body.items, candidates);
  assert.deepEqual(response.body.candidates, candidates);
  assert.deepEqual({ page: response.body.page, pageSize: response.body.pageSize, totalItems: response.body.totalItems, totalPages: response.body.totalPages }, {
    page: 2, pageSize: 20, totalItems: 21, totalPages: 2,
  });
});

test('candidate directory is available to reception, accounting, and exam organization only', async () => {
  const catalogService = {
    async listCertificates() { return []; },
    async listCandidates() { return { items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 0 }; },
  };
  for (const role of ['Tiếp nhận', 'Kế Toán', 'Tổ chức thi']) {
    const app = createApp({ db: authDb(role), config, services: { catalog: catalogService } });
    const cookie = await receptionCookie(app);
    assert.equal((await request(app).get('/api/catalog/candidates').set('Cookie', cookie)).status, 200);
  }

  const deniedApp = createApp({ db: authDb('Nhập liệu'), config, services: { catalog: catalogService } });
  const deniedCookie = await receptionCookie(deniedApp);
  assert.equal((await request(deniedApp).get('/api/catalog/candidates').set('Cookie', deniedCookie)).status, 403);
});
