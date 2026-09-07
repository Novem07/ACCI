# ACCI Merged-Main Stabilization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn merged `main` into a reproducible, authenticated ACCI application whose registration, payment, and extension workflows are covered by automated tests.

**Architecture:** Keep the React/Express/SQL Server stack, but introduce explicit package boundaries, a testable Express app factory, SQL migrations, transaction-backed services, and one typed-by-convention HTTP contract. Replace localStorage identity with an HttpOnly JWT cookie and make the server authoritative for roles and business rules.

**Tech Stack:** Node.js 22.14.x, npm 10 workspaces, React 19.2.8, React Router 7.18.3, Vite 8.2.2, Vitest 5.0.0, jsdom 29.0.0, ESLint 9.39.5, Express 5.2.1, SQL Server, mssql 12.7.0, Zod 4.5.4, bcryptjs 3.0.3, jsonwebtoken 9.0.3, Supertest 7.2.2.

**Spec:** `docs/superpowers/specs/2026-09-08-merged-main-audit.md`

## Global Constraints

- Run on Node.js `22.14.x`; record `22.14.0` in `.nvmrc` and require `>=22.14 <23` in package engines.
- Keep `client` and `server` as npm workspaces and keep exactly one root `package-lock.json`.
- Never commit `.env`, SQL credentials, JWT secrets, generated builds, coverage, or any `node_modules` directory.
- Use bcrypt hashes with cost `12`; never retain or log plaintext passwords.
- Store JWT only in cookie `acci_session` with `httpOnly: true`, `sameSite: 'strict'`, `secure: NODE_ENV === 'production'`, and `maxAge: 900000`.
- Derive `employeeId` and role from verified authentication; never accept `NguoiTao` from a request body.
- Validate every mutating request with Zod and return `{ error: { code, message, details? } }` for errors.
- Wrap every multi-table business write in one `mssql.Transaction` and rollback on every failed statement.
- Keep Vietnamese role values exactly `Tiếp nhận`, `Kế Toán`, `Tổ chức thi`, `Nhập liệu`, and `Coi thi` until a dedicated role migration changes them.
- Require zero high or critical production advisories from `npm audit --omit=dev`.

---

### Task 1: Repository and dependency boundary

**Files:**
- Create: `.gitignore`
- Create: `.nvmrc`
- Create: `eslint.config.js`
- Modify: `package.json`
- Modify: `client/package.json`
- Modify: `server/package.json`
- Delete: `client/package-lock.json`
- Delete: `server/package-lock.json`
- Regenerate: `package-lock.json`
- Remove from Git index: `node_modules/**`, `client/node_modules/**`, `server/node_modules/**`

**Interfaces:**
- Consumes: current three-package repository layout.
- Produces: root workspace commands `dev`, `lint`, `test`, `build`, `audit:prod`, and `db:smoke` used by every later task and CI.

- [ ] **Step 1: Add the clean-clone guard**

Create `.gitignore` with:

```gitignore
node_modules/
client/node_modules/
server/node_modules/
client/dist/
coverage/
.env
.env.*
!.env.example
*.log
.DS_Store
Thumbs.db
```

Create `.nvmrc` containing `22.14.0`. Then run:

```powershell
git rm -r --cached -- node_modules client/node_modules server/node_modules
```

Expected: dependency files disappear from the Git index but remain available in the working directory.

- [ ] **Step 2: Define the workspace manifests**

Set the root package scripts and engines to:

```json
{
  "private": true,
  "workspaces": ["client", "server"],
  "engines": { "node": ">=22.14 <23" },
  "scripts": {
    "dev": "concurrently -k \"npm run dev --workspace server\" \"npm run dev --workspace client\"",
    "lint": "npm run lint --workspaces --if-present",
    "test": "npm run test --workspaces --if-present",
    "build": "npm run build --workspace client",
    "audit:prod": "npm audit --omit=dev --workspaces",
    "db:smoke": "powershell -NoProfile -File scripts/db-smoke.ps1"
  },
  "devDependencies": {
    "@eslint/js": "9.39.5",
    "concurrently": "10.0.5",
    "eslint": "9.39.5",
    "eslint-plugin-react": "7.37.5",
    "eslint-plugin-react-hooks": "7.1.1",
    "eslint-plugin-react-refresh": "0.5.6",
    "globals": "17.12.0"
  }
}
```

Move runtime ownership into `server/package.json` with exact production dependencies: `bcryptjs@3.0.3`, `cookie-parser@1.4.7`, `cors@2.8.6`, `dotenv@17.4.2`, `express@5.2.1`, `express-rate-limit@8.7.0`, `helmet@8.3.0`, `jsonwebtoken@9.0.3`, `mssql@12.7.0`, and `zod@4.5.4`. Add `supertest@7.2.2` as a dev dependency. Remove `dayjs` and `express-session` unless an import is introduced by a later accepted design change.

Set server scripts to `"dev": "node --watch src/index.js"`, `"start": "node src/index.js"`, `"test": "node --test"`, and `"lint": "eslint src test --max-warnings=0"`. Add a flat `eslint.config.js` using `@eslint/js` recommended rules, browser globals for `client/src`, Node globals for `server/src` and `server/test`, React Hooks recommended rules, and JSX enabled for `client/src/**/*.{js,jsx}`.

- [ ] **Step 3: Generate one deterministic lockfile**

```powershell
Remove-Item -LiteralPath client/package-lock.json,server/package-lock.json
npm install
npm ci
```

Expected: one root `package-lock.json`; `npm ci` exits 0.

- [ ] **Step 4: Verify repository hygiene**

```powershell
git ls-files '*node_modules*'
git ls-files '*.env' '.env*'
npm ls --workspaces --depth=0
```

Expected: the first two commands print nothing; dependency ownership has no missing-package errors.

- [ ] **Step 5: Commit**

```powershell
git add .gitignore .nvmrc eslint.config.js package.json package-lock.json client/package.json server/package.json
git add -u
git commit -m "chore: establish clean npm workspaces"
```

---

### Task 2: Replace CRA/Jest with Vite/Vitest

**Files:**
- Create: `client/index.html`
- Create: `client/vite.config.mjs`
- Create: `client/src/test/setup.js`
- Modify: `client/package.json`
- Modify: `client/src/index.jsx`
- Modify: `client/src/App.test.jsx`
- Delete: `client/public/index.html`
- Delete: `client/src/reportWebVitals.js`
- Delete: `client/src/setupTests.js`

**Interfaces:**
- Consumes: root workspace commands from Task 1.
- Produces: `npm run test --workspace client -- --run` and `npm run build --workspace client` with an ESM-capable router test environment.

- [ ] **Step 1: Write a router smoke test that expresses the current failure**

Replace `client/src/App.test.js` with:

```jsx
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the login form at the root route', () => {
  window.history.pushState({}, '', '/');
  render(<App />);
  expect(screen.getByRole('button', { name: /đăng nhập/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Prove CRA/Jest cannot execute it**

Run: `npm test --workspace client -- --watchAll=false`

Expected: FAIL before the assertion because Jest 27 cannot resolve the Router 7 package export.

- [ ] **Step 3: Configure Vite and Vitest**

Use these client dev dependencies: `@vitejs/plugin-react@6.1.1`, `vite@8.2.2`, `vitest@5.0.0`, and `jsdom@29.0.0`. Remove `react-scripts` and `web-vitals`. Set scripts to:

```json
{
  "dev": "vite",
  "build": "vite build",
  "test": "vitest run",
  "test:watch": "vitest",
  "lint": "eslint src --max-warnings=0"
}
```

Create `client/vite.config.js`:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 3000 },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: true,
  },
});
```

Create `client/src/test/setup.js` with `import '@testing-library/jest-dom/vitest';`, move the public HTML shell to `client/index.html`, and load `/src/index.js` as a module.

- [ ] **Step 4: Verify the repaired toolchain**

```powershell
npm test --workspace client
npm run build --workspace client
```

Expected: one test passes and Vite writes `client/dist`.

- [ ] **Step 5: Commit**

```powershell
git add client package.json package-lock.json
git commit -m "build: migrate client tests and build to Vite"
```

---

### Task 3: Versioned SQL schema and safe identifiers

**Files:**
- Create: `database/migrations/001_baseline.sql`
- Create: `database/migrations/002_auth_and_workflow_integrity.sql`
- Create: `database/triggers.sql`
- Create: `scripts/db-smoke.ps1`
- Create: `scripts/hash-seed-passwords.js`
- Modify: `Database.sql`
- Modify: `Trigger.sql`

**Interfaces:**
- Consumes: SQL Server connection environment variables `DB_SERVER`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_ENCRYPT`, and `DB_TRUST_SERVER_CERTIFICATE`.
- Produces: `ChiTietPhieuDangKy`, `MaLichThiMoi`, password hashes, named sequences, unique business constraints, and an isolated `npm run db:smoke` check.

- [ ] **Step 1: Write the schema smoke test first**

Create `scripts/db-smoke.ps1` so it creates the exact temporary database name `ACCI_CI_SMOKE`, refuses to continue if that database already exists, runs both migrations and triggers with `sqlcmd -b`, asserts required objects, and drops only `ACCI_CI_SMOKE` in `finally`:

```powershell
$ErrorActionPreference = 'Stop'
$smokeDbName = 'ACCI_CI_SMOKE'
$existing = sqlcmd -S $env:DB_SERVER -U $env:DB_USER -P $env:DB_PASSWORD -h -1 -W -Q "SET NOCOUNT ON; SELECT DB_ID(N'$smokeDbName')"
if (($existing | Out-String).Trim() -notin @('', 'NULL')) { throw "$smokeDbName already exists" }
try {
  sqlcmd -S $env:DB_SERVER -U $env:DB_USER -P $env:DB_PASSWORD -b -v DatabaseName=$smokeDbName -i database/migrations/001_baseline.sql
  sqlcmd -S $env:DB_SERVER -U $env:DB_USER -P $env:DB_PASSWORD -b -v DatabaseName=$smokeDbName -i database/migrations/002_auth_and_workflow_integrity.sql
  sqlcmd -S $env:DB_SERVER -U $env:DB_USER -P $env:DB_PASSWORD -b -v DatabaseName=$smokeDbName -i database/triggers.sql
  sqlcmd -S $env:DB_SERVER -U $env:DB_USER -P $env:DB_PASSWORD -b -Q "USE [$smokeDbName]; IF OBJECT_ID(N'dbo.ChiTietPhieuDangKy') IS NULL THROW 51000, 'missing registration detail table', 1;"
} finally {
  sqlcmd -S $env:DB_SERVER -U $env:DB_USER -P $env:DB_PASSWORD -b -Q "IF DB_ID(N'$smokeDbName') IS NOT NULL BEGIN ALTER DATABASE [$smokeDbName] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [$smokeDbName]; END"
}
```

- [ ] **Step 2: Run it against the existing schema and capture the failure**

Run: `npm run db:smoke`

Expected: FAIL because the new migration files and `ChiTietPhieuDangKy` do not exist.

- [ ] **Step 3: Add explicit schema migrations**

Use SQLCMD variable `$(DatabaseName)` instead of hard-coded `ACCI_DB`. In migration 002 add:

```sql
ALTER TABLE dbo.NhanVien ADD MatKhauHash VARCHAR(60) NULL;
ALTER TABLE dbo.KhachHang ADD HoTen NVARCHAR(100) NULL, CCCD VARCHAR(20) NULL;
ALTER TABLE dbo.ThiSinh ADD HoTen NVARCHAR(100) NULL, CCCD VARCHAR(20) NULL;

CREATE TABLE dbo.ChiTietPhieuDangKy (
  MaPhieuDangKy VARCHAR(20) NOT NULL,
  MaThiSinh VARCHAR(20) NOT NULL,
  MaChungChi VARCHAR(20) NOT NULL,
  CONSTRAINT PK_ChiTietPhieuDangKy PRIMARY KEY (MaPhieuDangKy, MaThiSinh),
  CONSTRAINT FK_CTPDK_PhieuDangKy FOREIGN KEY (MaPhieuDangKy) REFERENCES dbo.PhieuDangKy(MaPhieuDangKy),
  CONSTRAINT FK_CTPDK_ThiSinh FOREIGN KEY (MaThiSinh) REFERENCES dbo.ThiSinh(MaThiSinh),
  CONSTRAINT FK_CTPDK_ChungChi FOREIGN KEY (MaChungChi) REFERENCES dbo.ChungChi(MaChungChi)
);

ALTER TABLE dbo.PhieuDangKyGiaHan ADD MaLichThiMoi VARCHAR(20) NULL;
ALTER TABLE dbo.PhieuDangKyGiaHan ADD CONSTRAINT FK_PDKGH_LichThiMoi
  FOREIGN KEY (MaLichThiMoi) REFERENCES dbo.LichThi(MaLichThi);

CREATE SEQUENCE dbo.SeqKhachHang AS BIGINT START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE dbo.SeqThiSinh AS BIGINT START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE dbo.SeqPhieuDangKy AS BIGINT START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE dbo.SeqPhieuDuThi AS BIGINT START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE dbo.SeqPhieuDangKyGiaHan AS BIGINT START WITH 1 INCREMENT BY 1;
```

Backfill `ChiTietPhieuDangKy` from existing `PhieuDuThi`, backfill `MaLichThiMoi` by matching the old date where it is unambiguous, then make workflow-required columns `NOT NULL`. Replace every trigger `INSERT ... SELECT *` with an explicit target/source column list.

Add `CHECK (SoLanGiaHanConLai BETWEEN 0 AND 2)`, a unique filtered index for one active extension request per exam form, and `NOT NULL` constraints for every workflow `NguoiTao`. Replace the inverted extension-count trigger with the transaction logic in Task 8; database constraints remain the final guard against duplicate active requests.

- [ ] **Step 4: Hash seed passwords and remove plaintext compatibility**

Generate bcrypt cost-12 hashes in `scripts/hash-seed-passwords.js`, store only `MatKhauHash`, verify login migration readiness, then drop `NhanVien.MatKhau`. Seed development credentials only when `SEED_DEMO_USERS=true`; document the five employee IDs without printing passwords to logs.

- [ ] **Step 5: Verify schema and triggers**

Run: `npm run db:smoke`

Expected: PASS; the temporary database is absent afterward.

- [ ] **Step 6: Commit**

```powershell
git add database scripts Database.sql Trigger.sql package.json
git commit -m "refactor: version SQL schema and workflow constraints"
```

---

### Task 4: Fail-fast server configuration and health checks

**Files:**
- Create: `.env.example`
- Create: `server/src/config.js`
- Create: `server/src/db.js`
- Create: `server/src/app.js`
- Create: `server/src/index.js`
- Create: `server/test/health.test.js`
- Modify: `server/package.json`
- Delete: `server/db.js`
- Delete: `server/index.js`

**Interfaces:**
- Consumes: validated environment variables and `mssql.ConnectionPool`.
- Produces: `loadConfig(env)`, `createPool(config)`, `createApp({ db, config })`, `/api/health/live`, and `/api/health/ready`.

- [ ] **Step 1: Rotate the credential already present in Git history**

Have the SQL Server administrator create login `acci_app`, grant only CRUD/execute permissions required by the ACCI schema, store its generated password in the deployment secret store, switch the application to it, and disable login `huhu`. Set `PRODUCTION_DB_SERVER` and `EXPOSED_DB_PASSWORD` only in the operator shell, then run `sqlcmd -S $env:PRODUCTION_DB_SERVER -U huhu -P $env:EXPOSED_DB_PASSWORD -Q "SELECT 1"`; expected result is login failure. Do not rewrite shared Git history until all collaborators have coordinated fresh clones; rotation is the mandatory containment action.

- [ ] **Step 2: Write failing health and startup tests**

Create `server/test/health.test.js` using `node:test`, `assert/strict`, and Supertest:

```js
test('readiness is 503 when SQL is unavailable', async () => {
  const db = { request: () => ({ query: async () => { throw new Error('offline'); } }) };
  const response = await request(createApp({ db, config: testConfig })).get('/api/health/ready');
  assert.equal(response.status, 503);
  assert.deepEqual(response.body, { status: 'not-ready' });
});

test('loadConfig rejects missing DB_PASSWORD', () => {
  assert.throws(() => loadConfig({ DB_SERVER: 'localhost', DB_NAME: 'ACCI_DB', DB_USER: 'sa', JWT_SECRET: 'x'.repeat(32) }), /DB_PASSWORD/);
});
```

- [ ] **Step 3: Run the focused test and see it fail**

Run: `npm test --workspace server -- --test-name-pattern="readiness|loadConfig"`

Expected: FAIL because `server/src/app.js` and `server/src/config.js` do not exist.

- [ ] **Step 4: Implement validated config and app/bootstrap split**

Define `loadConfig(env)` with Zod coercion and no defaults for SQL credentials or `JWT_SECRET`. `.env.example` must contain names and safe local examples only:

```dotenv
NODE_ENV=development
PORT=5000
CLIENT_ORIGIN=http://localhost:3000
DB_SERVER=localhost
DB_PORT=1433
DB_NAME=ACCI_DB
DB_USER=acci_app
DB_PASSWORD=replace-locally
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
JWT_SECRET=replace-with-at-least-32-random-characters
```

Export the app without listening. In `server/src/index.js`, await `pool.connect()` and a `SELECT 1 AS ready` query before `app.listen`; on failure log one redacted message, set `process.exitCode = 1`, close the pool, and never announce that the backend is running.

- [ ] **Step 5: Verify health and fail-fast behavior**

```powershell
npm test --workspace server -- --test-name-pattern="readiness|loadConfig"
$env:DB_SERVER='invalid.invalid'; npm run start --workspace server
```

Expected: tests PASS; the second command exits nonzero without opening port 5000 and without logging `DB_PASSWORD`.

- [ ] **Step 6: Commit**

```powershell
git add .env.example server package.json package-lock.json
git commit -m "feat: fail fast on invalid server configuration"
```

---

### Task 5: Authenticated identity and role middleware

**Files:**
- Create: `server/src/auth/auth.service.js`
- Create: `server/src/auth/auth.routes.js`
- Create: `server/src/middleware/authenticate.js`
- Create: `server/src/middleware/require-role.js`
- Create: `server/src/middleware/error-handler.js`
- Create: `server/test/auth.test.js`
- Modify: `server/src/app.js`
- Delete: `server/routes/auth.js`

**Interfaces:**
- Consumes: `db`, `config.jwtSecret`, `bcrypt.compare`, cookie `acci_session`.
- Produces: `login(employeeId, password)`, `authenticate(req,res,next)`, `requireRole(...roles)`, `POST /api/auth/login`, `GET /api/auth/me`, and `POST /api/auth/logout`.

- [ ] **Step 1: Write authentication contract tests**

Cover these exact assertions in `server/test/auth.test.js`:

```js
assert.equal((await request(app).get('/api/auth/me')).status, 401);

const login = await request(app).post('/api/auth/login').send({ employeeId: 'NV001', password: 'correct-password' });
assert.equal(login.status, 200);
assert.match(login.headers['set-cookie'][0], /^acci_session=/);
assert.match(login.headers['set-cookie'][0], /HttpOnly/);
assert.deepEqual(login.body.user, { id: 'NV001', name: 'Nguyễn Văn A', role: 'Tiếp nhận' });
assert.equal(Object.hasOwn(login.body.user, 'password'), false);

assert.equal((await request(app).post('/api/auth/login').send({ employeeId: '', password: '' })).status, 400);
assert.equal((await request(app).post('/api/auth/login').send({ employeeId: 'NV001', password: 'wrong' })).status, 401);
```

- [ ] **Step 2: Run tests and confirm missing secure auth**

Run: `npm test --workspace server -- --test-name-pattern=auth`

Expected: FAIL because current login compares plaintext and does not set a cookie.

- [ ] **Step 3: Implement bcrypt and JWT cookie authentication**

Select `MaNhanVien`, `HoTen`, `VaiTro`, and `MatKhauHash` by employee ID, run `bcrypt.compare`, and sign `{ sub: id, role, name }` with `expiresIn: '15m'`. Set the cookie using all values in Global Constraints. `authenticate` verifies the cookie and assigns:

```js
req.user = { id: payload.sub, name: payload.name, role: payload.role };
```

`requireRole('Tiếp nhận')` returns 401 without `req.user` and 403 for a different role. Logout clears the cookie with matching cookie attributes.

- [ ] **Step 4: Add login abuse controls and security headers**

Apply `helmet()` globally and an `express-rate-limit` limiter only to login: 5 attempts per 15 minutes per IP, standard headers enabled, legacy headers disabled. Configure CORS with exact origin `config.clientOrigin`, methods `GET,POST,PUT,PATCH,DELETE`, and `credentials: true`.

- [ ] **Step 5: Verify auth and middleware**

Run: `npm test --workspace server -- --test-name-pattern="auth|role|rate"`

Expected: PASS for login, cookie, me, logout, 400, 401, 403, and sixth-attempt 429 cases.

- [ ] **Step 6: Commit**

```powershell
git add server/src server/test package-lock.json
git commit -m "feat: secure API identity with role authorization"
```

---

### Task 6: Atomic customer and registration workflow

**Files:**
- Create: `server/src/customers/customer.routes.js`
- Create: `server/src/registrations/registration.schema.js`
- Create: `server/src/registrations/registration.service.js`
- Create: `server/src/registrations/registration.routes.js`
- Create: `server/test/registrations.test.js`
- Modify: `server/src/app.js`
- Delete: `server/routes/khachhang.js`
- Delete: `server/routes/phieudangky.js`
- Delete: `server/routes/registerRoutes.js`

**Interfaces:**
- Consumes: authenticated `req.user.id`, sequence-backed IDs, and one SQL transaction.
- Produces: `POST /api/customers`, `GET /api/customers`, `GET /api/customers/:customerId`, `POST /api/registrations`, and `GET /api/registrations`.

- [ ] **Step 1: Write failing API contract and rollback tests**

Use an authenticated Supertest agent and assert:

```js
const created = await agent.post('/api/registrations').send({
  customerId: 'KH0001',
  registrationDate: '2026-09-08',
  candidates: [{
    fullName: 'Trần Minh An', certificateId: 'CC001', citizenId: '079123456789',
    phone: '0901234567', email: 'an@example.com', address: 'TP.HCM'
  }]
});
assert.equal(created.status, 201);
assert.match(created.body.registration.id, /^PDK\d{6}$/);
assert.equal(created.body.registration.candidateCount, 1);
assert.equal(created.body.registration.createdBy, 'NV001');
```

Add a fake transaction that throws during detail insertion and assert `rollback` is called once, `commit` is never called, and no 201 response is returned. Assert an empty candidate array returns 400, a `Kế Toán` user returns 403, and caller-supplied `status`/`TrangThaiPhieu` fields are rejected with 400.

- [ ] **Step 2: Run tests and observe current route-contract failures**

Run: `npm test --workspace server -- --test-name-pattern="registration|customer"`

Expected: FAIL because customer POST is absent, duplicate registration handlers disagree, IDs use row counts, and no transaction is used.

- [ ] **Step 3: Implement schemas and explicit transaction flow**

Validate customer and candidate fields with Zod: trimmed nonempty names, citizen ID `/^\d{9,12}$/`, phone `/^0\d{9}$/`, valid email, ISO date, and `candidates` length 1–100. Generate IDs using `NEXT VALUE FOR dbo.SeqKhachHang`, `SeqThiSinh`, and `SeqPhieuDangKy`, formatted to six digits.

In one transaction, insert the registration, each candidate, and each `ChiTietPhieuDangKy` row with explicit columns. Do not insert `PhieuDuThi`; issuance belongs to `Tổ chức thi`. Return:

```json
{
  "registration": {
    "id": "PDK000001",
    "customerId": "KH000001",
    "status": "Chờ phát hành",
    "candidateCount": 1,
    "createdBy": "NV001"
  }
}
```

- [ ] **Step 4: Verify workflow and rollback behavior**

Run: `npm test --workspace server -- --test-name-pattern="registration|customer"`

Expected: PASS for 201, validation 400, auth 401, role 403, ID shape, and rollback.

- [ ] **Step 5: Commit**

```powershell
git add server/src server/test
git add -u server/routes
git commit -m "feat: persist registrations atomically"
```

---

### Task 7: Correct payment queries and state transitions

**Files:**
- Create: `server/src/payments/payment.service.js`
- Create: `server/src/payments/payment.routes.js`
- Create: `server/test/payments.test.js`
- Modify: `server/src/app.js`
- Delete: `server/routes/paymentRoutes.js`

**Interfaces:**
- Consumes: `ChiTietPhieuDangKy`, certificate prices, customer organization status, authenticated `Kế Toán` identity.
- Produces: `GET /api/payments`, `GET /api/payments/:registrationId`, `GET /api/payments/:registrationId/quote`, and `POST /api/payments/:registrationId/invoices`.

- [ ] **Step 1: Write regression tests for the broken payment endpoint**

Assert the detail query binds the route parameter as `registrationId`, uses `PhieuDangKy.MaPhieuDangKy`, and returns 404 for an unknown registration rather than throwing `ReferenceError: maPDK is not defined`. Add quote fixtures for one individual and 21 organization candidates and assert currency values as integer VND, not formatted strings.

- [ ] **Step 2: Run payment tests against the merged implementation**

Run: `npm test --workspace server -- --test-name-pattern=payment`

Expected: FAIL on the undefined `maPDK`, nonexistent `P.MaPDK`, missing customer columns, and absent invoice write endpoint.

- [ ] **Step 3: Implement canonical payment vocabulary and SQL**

Replace `MaPDK`/`MaKH`/`MaTT` response aliases with:

```json
{
  "registrationId": "PDK000001",
  "customerId": "KH000001",
  "invoiceId": null,
  "registrationDate": "2026-09-08",
  "registrationStatus": "Chờ phát hành"
}
```

Calculate the quote from registration details and certificate prices. Keep dates and amounts raw in SQL; format them in the client. Create an invoice and update registration/payment state in one transaction, with a unique constraint preventing a second active invoice for the same registration.

- [ ] **Step 4: Verify payment authorization and calculations**

Run: `npm test --workspace server -- --test-name-pattern=payment`

Expected: PASS for individual, organization discount, unknown registration 404, unauthenticated 401, wrong-role 403, duplicate invoice 409, and rollback.

- [ ] **Step 5: Commit**

```powershell
git add server/src server/test
git add -u server/routes/paymentRoutes.js
git commit -m "fix: make payment contracts and transactions consistent"
```

---

### Task 8: Server-authoritative extension workflow

**Files:**
- Create: `server/src/extensions/extension.schema.js`
- Create: `server/src/extensions/extension.service.js`
- Create: `server/src/extensions/extension.routes.js`
- Create: `server/test/extensions.test.js`
- Modify: `server/src/app.js`
- Delete: `server/routes/lichthi.js`
- Delete: `server/routes/phieudangkygiahan.js`
- Remove extension mutation from: `server/routes/phieuduthi.js`

**Interfaces:**
- Consumes: `{ examFormId, caseType, newScheduleId }`, authenticated reception identity, SQL Server current UTC time, schedule capacity, and remaining extension count.
- Produces: `GET /api/exam-forms/:examFormId/extension-options` and `POST /api/extensions`.

- [ ] **Step 1: Write boundary and concurrency tests**

Freeze server time at `2026-09-08T01:00:00Z`. Assert requests at 24 hours exactly are accepted, requests one second inside 24 hours return 409 `EXTENSION_WINDOW_CLOSED`, zero remaining attempts return 409 `NO_EXTENSION_ATTEMPTS`, mismatched certificates return 400, and two concurrent requests allow exactly one commit.

- [ ] **Step 2: Run tests and expose client-only enforcement**

Run: `npm test --workspace server -- --test-name-pattern=extension`

Expected: FAIL because the 24-hour rule exists only in React, the API accepts a date-shaped `LichThiMoi`, and count-based IDs race.

- [ ] **Step 3: Implement a locked transaction**

Within one transaction, read the exam form using `WITH (UPDLOCK, HOLDLOCK)`, compare SQL `SYSUTCDATETIME()` to the scheduled datetime, verify `SoLanGiaHanConLai > 0`, verify the new schedule has the same certificate and capacity, insert the sequence-backed extension request with `MaLichThiMoi`, decrement the remaining count, and commit. Return a 201 body with `id`, `examFormId`, `newScheduleId`, `caseType`, and `remainingAttempts`.

- [ ] **Step 4: Verify all extension rules**

Run: `npm test --workspace server -- --test-name-pattern=extension`

Expected: PASS for boundaries, validation, roles, capacity, and concurrent conflict behavior.

- [ ] **Step 5: Commit**

```powershell
git add server/src server/test
git add -u server/routes
git commit -m "feat: enforce extension rules transactionally"
```

---

### Task 9: Exam-form issuance and paginated read APIs

**Files:**
- Create: `server/src/exam-forms/exam-form.schema.js`
- Create: `server/src/exam-forms/exam-form.service.js`
- Create: `server/src/exam-forms/exam-form.routes.js`
- Create: `server/test/exam-forms.test.js`
- Modify: `server/src/app.js`
- Modify: `database/migrations/002_auth_and_workflow_integrity.sql`
- Delete: `server/routes/phieuduthi.js`
- Delete: `server/routes/thisinh.js`

**Interfaces:**
- Consumes: persisted registration details, authenticated `Tổ chức thi` identity, selected schedule IDs, and sequence-backed exam-form IDs.
- Produces: `POST /api/exam-forms`, `GET /api/exam-forms?page=1&pageSize=20&query=`, `GET /api/exam-forms/:examFormId`, and stable pagination metadata `{ page, pageSize, totalItems, totalPages }`.

- [ ] **Step 1: Write issuance, authorization, capacity, and pagination tests**

Submit `{ registrationId: 'PDK000001', assignments: [{ candidateId: 'TS000001', scheduleId: 'LT001' }] }` as `Tổ chức thi`; assert 201, `PDT000001`, remaining extension count 2, and schedule capacity decremented once. Assert reception receives 403, duplicate issuance returns 409, insufficient capacity rolls back, and `pageSize=101` returns 400. Seed 21 rows and assert page 2 with size 20 contains one item and correct metadata.

- [ ] **Step 2: Run focused tests against the old routes**

Run: `npm test --workspace server -- --test-name-pattern="exam form|pagination"`

Expected: FAIL because no issuance POST exists and list endpoints return unbounded arrays.

- [ ] **Step 3: Implement transactional issuance and explicit projections**

Validate page as integer `>=1`, pageSize as integer `1..100`, and assignment IDs as nonempty strings. Lock registration details and schedules with `UPDLOCK, HOLDLOCK`, reject certificate mismatches and exhausted schedules, insert exam forms with explicit columns, decrement each schedule capacity, and commit once. Never accept `NguoiTao`, status, remaining attempts, or prices from the caller.

Use `ORDER BY` plus `OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`; replace `SELECT *` and SQL `FORMAT()` with explicit raw columns. Add indexes:

```sql
CREATE INDEX IX_PhieuDangKy_NgayDangKy ON dbo.PhieuDangKy (NgayDangKy DESC) INCLUDE (MaKhachHang, TrangThaiPhieu);
CREATE INDEX IX_PhieuDuThi_MaPhieuDangKy ON dbo.PhieuDuThi (MaPhieuDangKy) INCLUDE (MaThiSinh, MaChungChi, MaLichThi, TrangThaiPhieu);
CREATE INDEX IX_ChiTietPDK_MaThiSinh ON dbo.ChiTietPhieuDangKy (MaThiSinh) INCLUDE (MaPhieuDangKy, MaChungChi);
CREATE INDEX IX_LichThi_ChungChiNgayThi ON dbo.LichThi (MaChungChi, NgayThi, GioThi) INCLUDE (SoChoTrong);
```

- [ ] **Step 4: Inspect actual query plans before retaining indexes**

Run the list/detail queries with `SET STATISTICS IO, TIME ON` against fixtures of at least 10,000 registration details. Retain an index only when the actual plan uses it and logical reads improve; save before/after reads in the commit message body.

- [ ] **Step 5: Verify issuance and list contracts**

Run: `npm test --workspace server -- --test-name-pattern="exam form|pagination"`

Expected: PASS for 201, 400, 403, 409, rollback, capacity, and two-page assertions.

- [ ] **Step 6: Commit**

```powershell
git add server/src server/test database/migrations/002_auth_and_workflow_integrity.sql
git add -u server/routes
git commit -m "feat: issue exam forms with capacity-safe pagination"
```

---

### Task 10: Central client API and authenticated route shell

**Files:**
- Create: `client/src/api/client.js`
- Create: `client/src/auth/AuthContext.jsx`
- Create: `client/src/auth/ProtectedRoute.jsx`
- Create: `client/src/auth/RoleRoute.jsx`
- Create: `client/src/auth/AuthContext.test.jsx`
- Modify: `client/src/App.js`
- Modify: `client/src/pages/LoginPage.jsx`
- Modify: `client/src/pages/HomePage.jsx`

**Interfaces:**
- Consumes: `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`, `VITE_API_BASE_URL` defaulting to `/api`.
- Produces: `api.request(path, options)`, `useAuth()`, authenticated loading state, and route-level role enforcement.

- [ ] **Step 1: Write failing login restoration and role-route tests**

Mock `/api/auth/me` and assert the app shows a loading state before resolving, redirects 401 to `/`, permits `Tiếp nhận` at `/tiepnhan`, and renders an access-denied page for `Kế Toán`. Assert no identity key is written to localStorage after login.

- [ ] **Step 2: Run the tests against localStorage auth**

Run: `npm test --workspace client -- AuthContext.test.jsx`

Expected: FAIL because identity is read directly from localStorage and no server session restoration exists.

- [ ] **Step 3: Implement one credentialed API client**

`client/src/api/client.js` must prefix `import.meta.env.VITE_API_BASE_URL || '/api'`, set `credentials: 'include'`, parse JSON once, and throw an `ApiError` containing `status`, `code`, `message`, and `details`. Remove every literal `http://localhost:5000` from `client/src`.

- [ ] **Step 4: Implement auth and route ownership**

Wrap routes in `AuthProvider`. Protect all business pages, remove the duplicate `/xemthisinh`, remove `/login` navigation in favor of `/`, and map exact roles to route groups. Delete direct `JSON.parse(localStorage.getItem('user'))` calls; pages read `useAuth().user`.

- [ ] **Step 5: Verify routing and logout**

```powershell
npm test --workspace client -- AuthContext.test.jsx
rg -n "localhost:5000|localStorage.getItem\('user'\)|path=\"/xemthisinh\"" client/src
```

Expected: tests PASS; no hard-coded API origin or localStorage identity remains; exactly one `/xemthisinh` declaration remains.

- [ ] **Step 6: Commit**

```powershell
git add client/src client/package.json package-lock.json
git commit -m "refactor: centralize client auth and API access"
```

---

### Task 11: Reconnect registration, payment, and extension pages

**Files:**
- Modify: `client/src/pages/CreateRegisterPage.jsx`
- Modify: `client/src/pages/RegisterFormPage.jsx`
- Modify: `client/src/pages/ViewRegisterPage.jsx`
- Modify: `client/src/pages/AccountantPage.jsx`
- Modify: `client/src/pages/ProcessRegister.jsx`
- Modify: `client/src/pages/ExtendRegisterPage.jsx`
- Modify: `client/src/pages/ExtendFormPage.jsx`
- Delete: `client/src/pages/RenewRegisterPage.jsx`
- Delete: `client/src/pages/RenewRegisterPage.css`
- Create: `client/src/pages/CreateRegisterPage.test.jsx`
- Create: `client/src/pages/ExtendFormPage.test.jsx`
- Create: `client/src/pages/ProcessRegister.test.jsx`

**Interfaces:**
- Consumes: canonical APIs from Tasks 6–9.
- Produces: working reception registration, accountant payment, and reception extension user journeys.

- [ ] **Step 1: Write registration interaction tests**

Mock API calls and assert: customer creation selects the returned ID; submitting one candidate sends one `POST /api/registrations`; a 201 response displays `PDK000001`; a 400 field error remains on the form; and no request to `/api/phieuduthi` occurs during reception registration.

- [ ] **Step 2: Write payment and extension interaction tests**

Assert ProcessRegister loads `/api/payments/PDK000001/quote` and submits one invoice; ExtendForm loads server-provided options and sends `{ examFormId, caseType, newScheduleId }`; a 409 server rule is rendered verbatim and does not navigate away.

- [ ] **Step 3: Run focused tests and capture contract mismatch**

Run: `npm test --workspace client -- CreateRegisterPage.test.jsx ProcessRegister.test.jsx ExtendFormPage.test.jsx`

Expected: FAIL because pages use old URLs, fields, and unconditional success handling.

- [ ] **Step 4: Implement the three journeys**

Use `api.request` for every call, disable submit while pending, require at least one candidate, retain form data after errors, render field/server errors inline, and navigate only after a successful response. Format dates with `Intl.DateTimeFormat('vi-VN')` and VND with `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })`.

- [ ] **Step 5: Remove obsolete state and routes**

Delete the old `RenewRegisterPage`, make `/register` redirect to the canonical API-backed `/taophieu` flow, and update Home to the canonical route. Remove the fake-success form behavior, stop storing temporary candidates and processed-payment flags in localStorage, use stable database IDs as React keys, and remove the obsolete `/giahan/:maPhieu` route.

- [ ] **Step 6: Verify complete client behavior**

```powershell
npm test --workspace client
npm run build --workspace client
rg -n "api/giahan|api/phieudangky|api/phieuduthi.*POST|tempThiSinhList|processed_" client/src
```

Expected: tests and build PASS; the search prints no obsolete write paths or local state flags.

- [ ] **Step 7: Commit**

```powershell
git add client/src
git add -u client/src/pages
git commit -m "fix: reconnect core UI workflows to stable APIs"
```

---

### Task 12: Accessibility and shared presentation primitives

**Files:**
- Create: `client/src/components/AppShell.jsx`
- Create: `client/src/components/AsyncState.jsx`
- Create: `client/src/styles/tokens.css`
- Modify: `client/src/index.css`
- Modify: `client/src/pages/*.jsx`
- Modify: `client/src/pages/*.css`
- Create: `client/src/components/AppShell.test.jsx`

**Interfaces:**
- Consumes: `useAuth`, React Router navigation, normalized page loading/error states.
- Produces: semantic shared navigation, keyboard-safe actions, labeled controls, and reusable table/form states.

- [ ] **Step 1: Write an accessibility smoke test**

Render AppShell and one form page, then assert navigation has an accessible name, logout is a button, every input has a programmatic label, errors use `role="alert"`, and the active route uses `aria-current="page"`.

- [ ] **Step 2: Run the test against clickable spans**

Run: `npm test --workspace client -- AppShell.test.jsx`

Expected: FAIL because navigation and icon actions are spans without button/link semantics and several inputs rely only on placeholders.

- [ ] **Step 3: Extract semantic shared components**

Replace repeated page navbars with `AppShell`; use `NavLink`, `<button type="button">`, `<label htmlFor>`, table captions, visible focus rings, and `aria-live="polite"` for async completion. `AsyncState` must render loading, error, empty, and content states without page-specific fetch logic.

- [ ] **Step 4: Consolidate visual tokens**

Define colors, spacing, radii, and focus styles in `tokens.css`; remove duplicate `.navbar`, `.page-wrapper`, `.pagination`, and generic `.btn` declarations from page CSS. Keep page-specific grids local to each page stylesheet.

- [ ] **Step 5: Verify accessibility and regressions**

Run: `npm test --workspace client && npm run build --workspace client`

Expected: all client tests pass and the production build succeeds without accessibility-test failures.

- [ ] **Step 6: Commit**

```powershell
git add client/src
git commit -m "refactor: standardize accessible application layout"
```

---

### Task 13: CI, operations guide, and final quality gate

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `README.md`
- Modify: `client/README.md`
- Modify: `package.json`
- Create: `server/test/api-contract.test.js`

**Interfaces:**
- Consumes: all root scripts, SQL smoke script, and core API contracts.
- Produces: one reproducible CI gate and a clean-clone runbook.

- [ ] **Step 1: Add a cross-route contract test**

Create one Supertest scenario that logs in as reception, creates/selects a customer, creates a registration, confirms it appears in the registration list, and verifies accountant-only payment access is 403 for reception. Use deterministic fixtures and rollback the test transaction.

- [ ] **Step 2: Run the full gate before CI exists**

```powershell
npm ci
npm run lint
npm test
npm run build
npm run audit:prod
npm run db:smoke
```

Expected before dependency and workflow work is complete: at least one command fails, proving CI would catch the current baseline.

- [ ] **Step 3: Add GitHub Actions with SQL Server 2022**

Configure `.github/workflows/ci.yml` for pull requests and pushes to `main`, use `actions/checkout@v4`, `actions/setup-node@v4` with Node `22.14.0` and npm cache, start `mcr.microsoft.com/mssql/server:2022-latest`, wait for `SELECT 1`, then run the six commands from Step 2. Use repository secrets for the CI SQL password and never print it.

- [ ] **Step 4: Write the root runbook**

Document prerequisites, `.env.example` copying, SQL login/database creation, `npm ci`, `npm run db:smoke`, migrations, demo seed opt-in, `npm run dev`, health URLs, test/build/audit commands, role-to-route mapping, and common errors for port 5000 and SQL connectivity. Replace `client/README.md` with a short pointer to the root README plus client-only commands.

- [ ] **Step 5: Run the final local quality gate**

```powershell
npm ci
npm run lint
npm test
npm run build
npm run audit:prod
npm run db:smoke
git status --short
```

Expected: every command exits 0; audit has zero high/critical production advisories; status contains only intentional source/documentation changes before commit.

- [ ] **Step 6: Commit**

```powershell
git add .github README.md client/README.md server/test package.json package-lock.json
git commit -m "ci: enforce ACCI release quality gates"
```

- [ ] **Step 7: Push and verify remote main after review**

```powershell
git push origin main
git fetch origin
git rev-parse HEAD
git rev-parse origin/main
```

Expected: both commit hashes are identical and GitHub Actions reports success for that commit.
