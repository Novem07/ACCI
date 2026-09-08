const assert = require('node:assert/strict');
const { test } = require('node:test');
const request = require('supertest');

const { createApp } = require('../src/app');
const { createExamFormService } = require('../src/exam-forms/exam-form.service');

const config = {
  nodeEnv: 'test',
  clientOrigin: 'http://localhost:3000',
  jwtSecret: 'test-secret-with-at-least-32-characters',
};

function authDb(role) {
  return {
    request() {
      const current = {
        input() { return current; },
        async query() {
          return { recordset: [{ MaNhanVien: 'NV003', HoTen: 'Lê Văn C', VaiTro: role, MatKhauHash: '$2b$04$Y63QbNce1aiqSHGSPOvH1OtEdkAlGJgkYh9XWekuZDf7DkvG3VZFq' }] };
        },
      };
      return current;
    },
  };
}

test('exam-form issuance is organizer-only and returns stable IDs', async () => {
  const service = {
    async create({ input, userId }) { return { registrationId: input.registrationId, forms: [{ id: 'PDT000001', candidateId: 'TS000001', scheduleId: 'LT001' }], createdBy: userId }; },
    async list() { return { items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 0 }; },
    async get(examFormId) { return { examFormId }; },
  };
  const organizerApp = createApp({ db: authDb('Tổ chức thi'), config, services: { examForm: service } });
  const login = await request(organizerApp).post('/api/auth/login').send({ employeeId: 'NV003', password: 'correct-password' });
  const issuance = await request(organizerApp)
    .post('/api/exam-forms')
    .set('Cookie', login.headers['set-cookie'])
    .send({ registrationId: 'PDK000001', assignments: [{ candidateId: 'TS000001', scheduleId: 'LT001' }] });
  assert.equal(issuance.status, 201);
  assert.equal(issuance.body.issuance.forms[0].id, 'PDT000001');

  const receptionApp = createApp({ db: authDb('Tiếp nhận'), config, services: { examForm: service } });
  const receptionLogin = await request(receptionApp).post('/api/auth/login').send({ employeeId: 'NV003', password: 'correct-password' });
  const forbidden = await request(receptionApp)
    .post('/api/exam-forms')
    .set('Cookie', receptionLogin.headers['set-cookie'])
    .send({ registrationId: 'PDK000001', assignments: [{ candidateId: 'TS000001', scheduleId: 'LT001' }] });
  assert.equal(forbidden.status, 403);
});

test('exam-form list validates page size and returns the common page shape', async () => {
  const items = [{ examFormId: 'PDT000001' }];
  const service = {
    async list(params) {
      assert.deepEqual(params, { page: 1, pageSize: 20, query: '' });
      return { items, page: 1, pageSize: 20, totalItems: 1, totalPages: 1 };
    },
  };
  const app = createApp({ db: authDb('Tổ chức thi'), config, services: { examForm: service } });
  const login = await request(app).post('/api/auth/login').send({ employeeId: 'NV003', password: 'correct-password' });
  const response = await request(app).get('/api/exam-forms?pageSize=101').set('Cookie', login.headers['set-cookie']);
  assert.equal(response.status, 400);
  const page = await request(app).get('/api/exam-forms?page=1&pageSize=20').set('Cookie', login.headers['set-cookie']);
  assert.equal(page.status, 200);
  assert.deepEqual(page.body.items, items);
  assert.deepEqual(page.body.examForms, items);
});

test('exam-form issuance validates assignments in one locked set query before inserts', async () => {
  const statements = [];
  let sequence = 0;
  const transaction = {
    begin: async () => undefined, commit: async () => undefined, rollback: async () => undefined,
    request() {
      const inputs = {};
      const current = {
        input(name, type, value) { inputs[name] = value; return current; },
        async query(statement) {
          statements.push(statement);
          if (statement.includes('FROM PhieuDangKy')) return { recordset: [{ MaPhieuDangKy: 'PDK000001', TrangThaiPhieu: 'Chờ phát hành' }] };
          if (statement.includes('WITH RequestedAssignments')) return { recordset: JSON.parse(inputs.assignments).map((item) => ({ ...item, certificateId: 'CC001', matchedScheduleId: item.scheduleId, examDate: '2030-05-20', examTime: '08:00', remainingSeats: 3 })) };
          if (statement.includes('UPDATE LichThi')) return { recordset: [], rowsAffected: [1] };
          if (statement.includes('SeqPhieuDuThi')) return { recordset: [{ value: ++sequence }] };
          return { recordset: [], rowsAffected: [1] };
        },
      };
      return current;
    },
  };
  const service = createExamFormService({ db: {}, transactionFactory: () => transaction });
  const assignments = ['TS000001', 'TS000002', 'TS000003'].map((candidateId) => ({ candidateId, scheduleId: 'LT001' }));
  const result = await service.create({ input: { registrationId: 'PDK000001', assignments }, userId: 'NV003' });
  assert.equal(result.forms.length, 3);
  assert.equal(statements.filter((statement) => statement.includes('WITH RequestedAssignments')).length, 1);
  assert.equal(statements.filter((statement) => statement.includes('FROM PhieuDuThi WITH')).length, 0);
});
