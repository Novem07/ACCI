const assert = require('node:assert/strict');
const { test } = require('node:test');
const request = require('supertest');

const { createApp } = require('../src/app');

const config = {
  nodeEnv: 'test',
  clientOrigin: 'http://localhost:3000',
  jwtSecret: 'test-secret-with-at-least-32-characters',
};

function createDb() {
  const requestFactory = () => {
    const requestObject = {
      input() { return requestObject; },
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
    return requestObject;
  };
  return { request: requestFactory };
}

test('auth endpoints require a cookie and expose only the public user shape', async () => {
  const app = createApp({ db: createDb(), config });

  const unauthenticated = await request(app).get('/api/auth/me');
  assert.equal(unauthenticated.status, 401);

  const login = await request(app)
    .post('/api/auth/login')
    .send({ employeeId: 'NV001', password: 'correct-password' });
  assert.equal(login.status, 200);
  assert.match(login.headers['set-cookie'][0], /^acci_session=/);
  assert.match(login.headers['set-cookie'][0], /HttpOnly/);
  assert.deepEqual(login.body.user, { id: 'NV001', name: 'Nguyễn Văn A', role: 'Tiếp nhận' });
  assert.equal(Object.hasOwn(login.body.user, 'password'), false);

  const me = await request(app)
    .get('/api/auth/me')
    .set('Cookie', login.headers['set-cookie']);
  assert.equal(me.status, 200);
  assert.deepEqual(me.body.user, login.body.user);

  const logout = await request(app)
    .post('/api/auth/logout')
    .set('Cookie', login.headers['set-cookie']);
  assert.equal(logout.status, 204);
  assert.match(logout.headers['set-cookie'][0], /acci_session=;/);
});

test('login validates input and rejects wrong credentials', async () => {
  const app = createApp({ db: createDb(), config });
  assert.equal((await request(app).post('/api/auth/login').send({ employeeId: '', password: '' })).status, 400);
  assert.equal((await request(app).post('/api/auth/login').send({ employeeId: 'NV001', password: 'wrong' })).status, 401);
});

test('role middleware rejects missing and wrong roles', async () => {
  const app = createApp({ db: createDb(), config });
  const login = await request(app).post('/api/auth/login').send({ employeeId: 'NV001', password: 'correct-password' });
  const cookie = login.headers['set-cookie'];
  const roleApp = require('../src/middleware/require-role').requireRole;
  const { authenticate } = require('../src/middleware/authenticate');
  const express = require('express');
  const router = express.Router();
  const authService = require('../src/auth/auth.service').createAuthService({ db: createDb(), jwtSecret: config.jwtSecret });
  router.get('/restricted', authenticate(authService), roleApp('Kế Toán'), (req, res) => res.json({ ok: true }));
  app.use(router);

  assert.equal((await request(app).get('/restricted')).status, 401);
  assert.equal((await request(app).get('/restricted').set('Cookie', cookie)).status, 403);
});
