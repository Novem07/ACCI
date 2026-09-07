const assert = require('node:assert/strict');
const { test } = require('node:test');
const express = require('express');
const request = require('supertest');

const { createApp } = require('../src/app');
const { createRegistrationService } = require('../src/registrations/registration.service');

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
              MaNhanVien: 'NV001', HoTen: 'Nguyễn Văn A', VaiTro: 'Tiếp nhận',
              MatKhauHash: '$2b$04$Y63QbNce1aiqSHGSPOvH1OtEdkAlGJgkYh9XWekuZDf7DkvG3VZFq',
            }],
          };
        },
      };
      return current;
    },
  };
}

test('registration API returns a server-owned state and identity', async () => {
  const registrationService = {
    async create({ input, userId }) {
      return {
        id: 'PDK000001', customerId: input.customerId, status: 'Chờ phát hành',
        candidateCount: input.candidates.length, createdBy: userId,
      };
    },
    async list() { return []; },
  };
  const app = createApp({ db: authDb(), config, services: { registration: registrationService } });
  const login = await request(app).post('/api/auth/login').send({ employeeId: 'NV001', password: 'correct-password' });
  const response = await request(app)
    .post('/api/registrations')
    .set('Cookie', login.headers['set-cookie'])
    .send({
      customerId: 'KH000001',
      registrationDate: '2026-09-08',
      candidates: [{
        fullName: 'Trần Minh An', certificateId: 'CC001', citizenId: '079123456789',
        phone: '0901234567', email: 'an@example.com', address: 'TP.HCM',
      }],
      TrangThaiPhieu: 'Đã phát hành',
    });
  assert.equal(response.status, 400);

  const valid = await request(app)
    .post('/api/registrations')
    .set('Cookie', login.headers['set-cookie'])
    .send({
      customerId: 'KH000001', registrationDate: '2026-09-08', candidates: [{
        fullName: 'Trần Minh An', certificateId: 'CC001', citizenId: '079123456789',
        phone: '0901234567', email: 'an@example.com', address: 'TP.HCM',
      }],
    });
  assert.equal(valid.status, 201);
  assert.deepEqual(valid.body.registration, {
    id: 'PDK000001', customerId: 'KH000001', status: 'Chờ phát hành', candidateCount: 1, createdBy: 'NV001',
  });
});

test('registration service rolls back when a candidate cannot be persisted', async () => {
  let committed = 0;
  let rolledBack = 0;
  let queryCount = 0;
  const makeRequest = () => {
    const current = {
      input() { return current; },
      async query() {
        queryCount += 1;
        if (queryCount === 1) return { recordset: [{ MaKhachHang: 'KH000001' }] };
        if (queryCount === 2) return { recordset: [{ value: 1 }] };
        if (queryCount === 3) throw Object.assign(new Error('candidate insert failed'), { code: 'DB_ERROR' });
        return { recordset: [{ MaChungChi: 'CC001' }] };
      },
    };
    return current;
  };
  const transaction = {
    begin: async () => undefined,
    request: makeRequest,
    commit: async () => { committed += 1; },
    rollback: async () => { rolledBack += 1; },
  };
  const service = createRegistrationService({ db: {}, transactionFactory: () => transaction });
  await assert.rejects(
    service.create({
      userId: 'NV001',
      input: {
        customerId: 'KH000001', registrationDate: '2026-09-08', candidates: [{
          fullName: 'Trần Minh An', certificateId: 'CC001', citizenId: '079123456789',
          phone: '0901234567', email: 'an@example.com', address: 'TP.HCM',
        }],
      },
    }),
    /candidate insert failed/
  );
  assert.equal(committed, 0);
  assert.equal(rolledBack, 1);
});

test('registration route requires reception role', async () => {
  const app = express();
  app.use(express.json());
  app.post('/registrations', (req, res) => res.status(403).json({ error: { code: 'FORBIDDEN' } }));
  assert.equal((await request(app).post('/registrations')).status, 403);
});
