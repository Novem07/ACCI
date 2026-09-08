# ACCI Center

ACCI Center is a React/Vite client with an Express API and SQL Server database for certificate-registration workflows.

## Requirements

- Node.js `22.14.x` and npm 10
- SQL Server 2022 (local or hosted)
- `sqlcmd` on `PATH` for database setup and smoke tests
- Chromium for browser and accessibility tests: `npx playwright install chromium`

The repository uses npm workspaces and one root lockfile. From a clean clone:

```powershell
npm ci
Copy-Item .env.example .env
```

Edit `.env` with a SQL login that can read/write the ACCI schema. Do not commit `.env`.

## Database setup

Run the baseline and migrations with a SQL account allowed to create/alter the database. SQL authentication example:

```powershell
sqlcmd -S $env:DB_SERVER -U $env:DB_USER -P $env:DB_PASSWORD -C -f 65001 -b -v DatabaseName=ACCI_DB -i database/migrations/001_baseline.sql
sqlcmd -S $env:DB_SERVER -U $env:DB_USER -P $env:DB_PASSWORD -C -f 65001 -b -v DatabaseName=ACCI_DB -i database/migrations/002_auth_and_workflow_integrity.sql
sqlcmd -S $env:DB_SERVER -U $env:DB_USER -P $env:DB_PASSWORD -C -f 65001 -b -v DatabaseName=ACCI_DB -i database/migrations/003_workflow_indexes.sql
sqlcmd -S $env:DB_SERVER -U $env:DB_USER -P $env:DB_PASSWORD -C -f 65001 -b -v DatabaseName=ACCI_DB -i Trigger.sql
```

The baseline creates the database and schema. `Database.sql` is also the included baseline source, and must be executed with the `DatabaseName` SQLCMD variable. Migrations are additive and idempotent where practical; back up production data and apply them strictly in numeric order.

To opt in to development users, set a password in the current shell and run:

```powershell
$env:SEED_DEMO_USERS = 'true'
$env:DEMO_PASSWORD = Read-Host 'Demo password'
npm run db:seed-demo
```

The seed creates or updates these IDs with the supplied password, without storing that password in the repository:

| ID | Role |
| --- | --- |
| NV001 | Tiếp nhận |
| NV002 | Kế Toán |
| NV003 | Tổ chức thi |
| NV004 | Nhập liệu |
| NV005 | Coi thi |

Verify the schema against an isolated `ACCI_CI_SMOKE` database with:

```powershell
npm run db:smoke
```

The smoke script uses SQL authentication when `DB_USER` and `DB_PASSWORD` are set, otherwise Windows integrated authentication. It drops only its temporary database after the check.

## Run locally

With `.env` configured and SQL Server available:

```powershell
npm run dev
```

Open <http://localhost:3000>. Vite proxies `/api` to the Express server at port 5000. The API exposes:

- <http://localhost:5000/api/health/live>
- <http://localhost:5000/api/health/ready>

The server validates all required configuration and SQL connectivity before listening. A failed database connection exits nonzero.

## Quality checks

```powershell
npm run lint
npm test
npm run build
npm run audit:prod
npm run db:smoke
npm run test:e2e
npm run test:a11y
```

`test:e2e` verifies desktop and mobile workflows with deterministic API fixtures. `test:a11y` runs Axe on login, reception, accounting, exam-form, extension, and dashboard pages and fails on serious or critical violations.

## Role routes

- `Tiếp nhận`: registration, customer/candidate lookup, and extension workflows
- `Kế Toán`: payment requests, quotes, and invoice creation
- `Tổ chức thi`: exam-form issuance and exam-form lookup
- `Nhập liệu` and `Coi thi`: authenticated, explicit unavailable-module pages; no placeholder actions are exposed until their business workflows are defined

Authentication is a short-lived JWT in the HttpOnly `acci_session` cookie. The browser does not store the user identity in `localStorage`; roles are enforced again by the API.

## Architecture notes

- `client/src/ui` contains the shared ACCI design system: tokenized light/dark color themes, local Be Vietnam Pro fonts, accessible form controls, feedback, tables, and pagination.
- Feature pages are lazy-loaded, while the authenticated shell stays mounted to avoid a white flash between workflows.
- API list endpoints use a shared page response (`items`, `page`, `pageSize`, `totalItems`, `totalPages`). Error responses include both `X-Request-Id` and `error.requestId` for support tracing.
- `database/migrations/003_workflow_indexes.sql` adds only workflow integrity/performance indexes. Never edit an applied migration; create a later numbered migration instead.

## Common issues

- `EADDRINUSE` on port 5000: stop the existing API process or change `PORT` and `CLIENT_ORIGIN` together.
- Readiness is `503`: verify `DB_SERVER`, `DB_PORT`, database name, SQL credentials, firewall access, and `DB_TRUST_SERVER_CERTIFICATE`.
- Login returns `401`: run the opt-in demo seed or verify that the employee has a bcrypt cost-12 `MatKhauHash`.
- Browser requests fail at `/api`: keep the Vite dev server on port 3000, or set `VITE_API_BASE_URL` to the deployed API base URL.
- Browser tests cannot launch: run `npx playwright install chromium` once after `npm ci`.
- An API error has a request ID: provide the `X-Request-Id` value with the time and affected route when requesting support.

## Further documentation

The approved design and implementation handoff are in `docs/superpowers/`.
