const assert = require('node:assert/strict');
const { test } = require('node:test');
const request = require('supertest');

const { createApp } = require('../src/app');
const { loadConfig } = require('../src/config');

const testConfig = {
  nodeEnv: 'test',
  clientOrigin: 'http://localhost:3000',
  jwtSecret: 'test-secret-with-at-least-32-characters',
};

test('live health endpoint does not require SQL', async () => {
  const response = await request(createApp({ config: testConfig })).get('/api/health/live');
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { status: 'live' });
});

test('readiness is 503 when SQL is unavailable', async () => {
  const db = { request: () => ({ query: async () => { throw new Error('offline'); } }) };
  const response = await request(createApp({ db, config: testConfig })).get('/api/health/ready');
  assert.equal(response.status, 503);
  assert.deepEqual(response.body, { status: 'not-ready' });
});

test('readiness is 200 when SQL responds', async () => {
  const db = { request: () => ({ query: async () => ({ recordset: [{ ready: 1 }] }) }) };
  const response = await request(createApp({ db, config: testConfig })).get('/api/health/ready');
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { status: 'ready' });
});

test('loadConfig rejects missing DB_PASSWORD', () => {
  assert.throws(
    () => loadConfig({
      DB_SERVER: 'localhost',
      DB_NAME: 'ACCI_DB',
      DB_USER: 'acci_app',
      JWT_SECRET: 'x'.repeat(32),
    }),
    /DB_PASSWORD/
  );
});
