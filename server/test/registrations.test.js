const assert = require('node:assert/strict');
const { test } = require('node:test');
const express = require('express');
const request = require('supertest');

const { createApp } = require('../src/app');
const { createRegistrationService } = require('../src/registrations/registration.service');
const { toBusinessDate } = require('../src/domain/date');

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

test('registration API accepts only server-owned state and identity', async () => {
  const registrationService = {
    async create({ input, userId }) {
      return {
        id: 'PDK000001', customerId: input.customerId, status: 'Chờ phát hành',
        candidateCount: input.candidates.length, createdBy: userId,
      };
    },
    async list() { return { items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 0 }; },
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

  const clientOwnedDate = await request(app)
    .post('/api/registrations')
    .set('Cookie', login.headers['set-cookie'])
    .send({
      customerId: 'KH000001', registrationDate: '2026-09-08', candidates: [{
        fullName: 'Trần Minh An', certificateId: 'CC001', citizenId: '079123456789',
        phone: '0901234567', email: 'an@example.com', address: 'TP.HCM',
      }],
    });
  assert.equal(clientOwnedDate.status, 400);
  assert.equal(clientOwnedDate.body.error.code, 'VALIDATION_ERROR');

  const valid = await request(app)
    .post('/api/registrations')
    .set('Cookie', login.headers['set-cookie'])
    .send({
      customerId: 'KH000001', candidates: [{
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
  const makeRequest = () => {
    const current = {
      input() { return current; },
      async query(statement) {
        if (statement.includes('FROM KhachHang')) return { recordset: [{ MaKhachHang: 'KH000001' }] };
        if (statement.includes('FROM ChungChi')) return { recordset: [{ id: 'CC001' }] };
        if (statement.includes('NEXT VALUE')) return { recordset: [{ value: 1 }] };
        if (statement.includes('INSERT INTO ThiSinh')) {
          throw Object.assign(new Error('candidate insert failed'), { code: 'DB_ERROR' });
        }
        return { recordset: [] };
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
        customerId: 'KH000001', candidates: [{
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

test('registration service derives the date from its clock and validates certificates in one set query', async () => {
  const queries = [];
  let candidateSequence = 0;
  const makeRequest = () => {
    const inputs = {};
    const current = {
      input(name, type, value) {
        inputs[name] = value;
        return current;
      },
      async query(statement) {
        queries.push({ statement, inputs });
        if (statement.includes('FROM KhachHang')) return { recordset: [{ MaKhachHang: 'KH000001' }] };
        if (statement.includes('FROM ChungChi')) {
          return { recordset: JSON.parse(inputs.certificateIds).map((id) => ({ id })) };
        }
        if (statement.includes('SeqPhieuDangKy')) return { recordset: [{ value: 7 }] };
        if (statement.includes('SeqThiSinh')) {
          candidateSequence += 1;
          return { recordset: [{ value: candidateSequence }] };
        }
        return { recordset: [] };
      },
    };
    return current;
  };
  const transaction = {
    begin: async () => undefined,
    request: makeRequest,
    commit: async () => undefined,
    rollback: async () => undefined,
  };
  const service = createRegistrationService({ db: {}, transactionFactory: () => transaction });
  const candidate = {
    fullName: 'Trần Minh An', certificateId: 'CC001', citizenId: '079123456789',
    phone: '0901234567', email: 'an@example.com', address: 'TP.HCM',
  };

  const registration = await service.create({
    userId: 'NV001',
    now: new Date('2030-05-06T08:00:00Z'),
    input: { customerId: 'KH000001', candidates: [candidate, { ...candidate, certificateId: 'CC002' }] },
  });

  assert.equal(registration.registrationDate, '2030-05-06');
  assert.equal(queries.filter(({ statement }) => statement.includes('FROM ChungChi')).length, 1);
  assert.equal(queries.find(({ statement }) => statement.includes('FROM ChungChi')).inputs.certificateIds, '["CC001","CC002"]');
  assert.equal(queries.find(({ statement }) => statement.includes('INSERT INTO PhieuDangKy')).inputs.status, 'Chờ phát hành');
});

test('registration service rejects an unknown certificate before writing the registration', async () => {
  const queries = [];
  const transaction = {
    begin: async () => undefined,
    request() {
      const current = {
        input() { return current; },
        async query(statement) {
          queries.push(statement);
          if (statement.includes('FROM KhachHang')) return { recordset: [{ MaKhachHang: 'KH000001' }] };
          if (statement.includes('FROM ChungChi')) return { recordset: [] };
          return { recordset: [] };
        },
      };
      return current;
    },
    commit: async () => undefined,
    rollback: async () => undefined,
  };
  const service = createRegistrationService({ db: {}, transactionFactory: () => transaction });

  await assert.rejects(
    service.create({
      userId: 'NV001',
      input: {
        customerId: 'KH000001',
        candidates: [{
          fullName: 'Trần Minh An', certificateId: 'UNKNOWN', citizenId: '079123456789',
          phone: '0901234567', email: 'an@example.com', address: 'TP.HCM',
        }],
      },
    }),
    { code: 'CERTIFICATE_NOT_FOUND', status: 400 }
  );
  assert.equal(queries.some((statement) => statement.includes('INSERT INTO PhieuDangKy')), false);
});

test('toBusinessDate uses the ACCI business timezone', () => {
  assert.equal(toBusinessDate(new Date('2030-05-05T18:00:00Z')), '2030-05-06');
});

test('registration route requires reception role', async () => {
  const app = express();
  app.use(express.json());
  app.post('/registrations', (req, res) => res.status(403).json({ error: { code: 'FORBIDDEN' } }));
  assert.equal((await request(app).post('/registrations')).status, 403);
});

test('registration list uses the same parameterized filters for counting and page retrieval', async () => {
  const queries = [];
  const db = {
    request() {
      const current = {
        input() { return current; },
        async query(statement) {
          queries.push(statement);
          if (statement.includes('COUNT_BIG')) return { recordset: [{ totalItems: 21 }] };
          return { recordset: [{ id: 'PDK000021' }] };
        },
      };
      return current;
    },
  };
  const service = createRegistrationService({ db });

  const page = await service.list({ page: 2, pageSize: 20, query: 'PDK', status: 'Chờ phát hành' });

  assert.deepEqual(page, {
    items: [{ id: 'PDK000021' }], page: 2, pageSize: 20, totalItems: 21, totalPages: 2,
  });
  assert.equal(queries.length, 2);
  assert.match(queries[0], /FROM PhieuDangKy p/);
  assert.match(queries[0], /p\.TrangThaiPhieu = @status/);
  assert.match(queries[1], /FROM PhieuDangKy p\s+LEFT JOIN ChiTietPhieuDangKy/s);
  assert.match(queries[1], /OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY/);
});
