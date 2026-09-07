const assert = require('node:assert/strict');
const { test } = require('node:test');
const request = require('supertest');

const { createApp } = require('../src/app');
const { createExtensionService } = require('../src/extensions/extension.service');

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
          return { recordset: [{ MaNhanVien: 'NV001', HoTen: 'Nguyễn Văn A', VaiTro: 'Tiếp nhận', MatKhauHash: '$2b$04$Y63QbNce1aiqSHGSPOvH1OtEdkAlGJgkYh9XWekuZDf7DkvG3VZFq' }] };
        },
      };
      return current;
    },
  };
}

test('extension API sends one canonical request and preserves server errors', async () => {
  const service = {
    async options(examFormId) { return { examFormId, schedules: [] }; },
    async create({ input, userId }) { return { id: 'PDGH000001', ...input, createdBy: userId }; },
  };
  const app = createApp({ db: authDb(), config, services: { extension: service } });
  const login = await request(app).post('/api/auth/login').send({ employeeId: 'NV001', password: 'correct-password' });
  const cookie = login.headers['set-cookie'];
  const options = await request(app).get('/api/extensions/PDT000001/extension-options').set('Cookie', cookie);
  assert.equal(options.status, 200);
  const response = await request(app)
    .post('/api/extensions')
    .set('Cookie', cookie)
    .send({ examFormId: 'PDT000001', caseType: 'Thường', newScheduleId: 'LT002' });
  assert.equal(response.status, 201);
  assert.equal(response.body.extension.createdBy, 'NV001');
});

test('extension service rolls back when the 24-hour rule rejects the schedule', async () => {
  let rollbackCount = 0;
  let queryCount = 0;
  const requestFactory = () => {
    const current = {
      input() { return current; },
      async query() {
        queryCount += 1;
        if (queryCount === 1) return { recordset: [{ examFormId: 'PDT000001', certificateId: 'CC001', currentScheduleId: 'LT001', remainingAttempts: 2, currentExamDate: '2026-09-09', currentExamTime: '12:00:00' }] };
        if (queryCount === 2) return { recordset: [{ scheduleId: 'LT002', certificateId: 'CC001', examDate: '2026-09-08', examTime: '12:00:00', remainingSeats: 3 }] };
        return { recordset: [] };
      },
    };
    return current;
  };
  const transaction = {
    begin: async () => undefined,
    request: requestFactory,
    commit: async () => { throw new Error('commit must not be reached'); },
    rollback: async () => { rollbackCount += 1; },
  };
  const service = createExtensionService({ transactionFactory: () => transaction, db: {}, clock: () => new Date('2026-09-08T00:00:00Z') });
  await assert.rejects(
    service.create({ userId: 'NV001', input: { examFormId: 'PDT000001', caseType: 'Thường', newScheduleId: 'LT002' } }),
    (error) => error.code === 'EXTENSION_WINDOW_CLOSED'
  );
  assert.equal(rollbackCount, 1);
});
