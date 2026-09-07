# ACCI merged-main stabilization specification

## Baseline

- Audited commit: `27867ed1bf20412a8bdbb7f1b29ca3c208270672` on `main`.
- Remote state: `origin/main` points to the same commit; `origin/Oanh`, `origin/Minh`, and `origin/soizz` are all ancestors of `main`.
- Frontend production build: passes.
- Frontend test command: fails before running tests because CRA/Jest 27 cannot resolve the installed `react-router-dom@7.5.0` package shape.
- Backend syntax checks: pass.
- Backend test command: intentionally exits 1 because it is still the generated placeholder.
- Database smoke test: `Database.sql` followed by `Trigger.sql` executes successfully against a temporary local SQL Server database. The temporary database was dropped after the test.
- Runtime smoke test: Express listens on port 5000 even when SQL connection fails with `ENOTFOUND althea`.

## What the merge resolved

1. All remote development branches are represented in `main`.
2. The database bootstrap script now separates `CREATE DATABASE` and `USE` with `GO`, and both database scripts compile and execute in order.
3. Authentication now queries the unified `NhanVien` table once instead of probing multiple role-specific employee tables.
4. The application now contains real pages and read APIs for registrations, candidates, exam forms, payments, certificates, schedules, and extension requests.
5. A basic client-side `RequireAuth` wrapper was added to some routes.
6. Most SQL values supplied by HTTP requests are passed as `mssql` parameters rather than interpolated into query strings.

## What remains unresolved or regressed

### P0 — correctness and security

1. `server/db.js` contains a committed SQL host, username, and password. The merged credentials also do not work on this machine.
2. `server/db.js` catches the pool rejection and resolves it as `undefined`; `server/index.js` starts accepting traffic before the database is healthy.
3. Passwords are stored and compared as plaintext (`NhanVien.MatKhau CHAR(8)`). Login returns identity data but no authenticated server-side session or signed token.
4. Every business API is callable without authentication or role authorization. Client-side route checks based on editable `localStorage` are not a security boundary.
5. CORS accepts every origin and login has no rate limit.
6. The registration workflow cannot complete:
   - the client calls `POST /api/khachhang`, but that route does not exist;
   - the client expects `POST /api/phieudangky` to return `maPhieuDangKy`, but the response only contains `message`;
   - the client calls `POST /api/phieuduthi`, but that route does not exist;
   - `KhachHang` and `ThiSinh` do not define the `HoTen`/`CCCD` columns consumed by the UI and payment queries;
   - two `POST /api/phieudangky` handlers are mounted, giving the same URL conflicting contracts.
7. `GET /api/payments/khachhang/:id` references the undefined variable `maPDK` and filters on nonexistent `P.MaPDK` instead of `P.MaPhieuDangKy`.
8. The old renewal page sends `PUT /api/giahan/:maPhieu`, while the server exposes `PUT /api/phieuduthi/giahan/:maPhieu`. The newer extension form sends a schedule identifier into the `LichThiMoi DATE` column.
9. IDs generated using `COUNT(*) + 1` can collide under concurrent requests and can reuse deleted identifiers.
10. Registration, exam-form issuance, payment, and extension changes are not transactionally atomic.
11. The merge changed registration creation so the caller may provide `TrangThaiPhieu`; workflow state is therefore client-controlled instead of server-controlled.
12. Trigger role checks can be bypassed with nullable `NguoiTao`, uniqueness rules are not backed by unique constraints, and the extension-count trigger uses an inverted formula.

### P1 — reliability and delivery

1. There is no effective automated test suite for the server or client and no end-to-end contract test.
2. There is no CI workflow, root lint/type-check script, health endpoint, or deterministic database migration command.
3. CRA 5, Jest 27, React 19, and React Router 7 are not a reliable test-toolchain combination in this repository.
4. Dependency audit findings remain: root 8 advisories, server 3, and client 63 at the audited lockfiles.
5. `mssql`, `dayjs`, and unused `express-session` are owned by the root package while server code imports `mssql`. Package boundaries are therefore accidental.
6. 11,263 files under `node_modules` are tracked by Git. The root has no `.gitignore`.
7. Setup documentation is still the generated CRA README and does not describe SQL Server, environment variables, roles, seed users, or verification commands.

### P2 — maintainability and UX

1. API URLs are repeated as `http://localhost:5000` across page components.
2. Route protection is inconsistent, `/xemthisinh` is declared twice, and several logout links navigate to nonexistent `/login` before the wildcard redirect.
3. Pages parse `localStorage` directly and several dereference `user.name` without a null-safe boundary.
4. Network code often treats any JSON response as success, omits loading/error/empty states, and uses `alert` for workflow feedback.
5. Business rules such as the 24-hour extension limit run in the browser, where time and state can be manipulated.
6. SQL uses `SELECT *`, presentation formatting via `FORMAT`, broad nullable columns, and `INSERT ... SELECT *` triggers that are fragile when schemas change.
7. Navigation, tables, icons, and form controls need keyboard, label, focus, and semantic accessibility cleanup; page-level CSS repeats layout primitives.
8. Home links to `/register`, whose form displays success and clears itself without making any API call, while the partially API-backed form lives separately at `/taophieu`.

## Target architecture

- Node.js `22.14.x` with npm workspaces for `client` and `server`; dependencies belong to the workspace that imports them.
- Express 5.2 with an exported `createApp()` for tests and a separate fail-fast bootstrap that awaits SQL connectivity before listening.
- SQL Server migrations own schema evolution, sequences, constraints, and seed data. Business writes use explicit columns and transactions.
- Authentication uses bcrypt password hashes and a short-lived JWT stored in an HttpOnly, SameSite=Strict cookie. The API derives employee identity and role from the verified token, never from request bodies.
- Zod validates request bodies and route parameters. Helmet, an origin allowlist, login rate limiting, structured errors, and role middleware form the HTTP security boundary.
- Registration candidates are persisted in `ChiTietPhieuDangKy`; exam forms are issued later by the exam-organization role rather than being created by reception during registration.
- React 19 uses Vite/Vitest, one API client configured by `VITE_API_BASE_URL`, an `AuthProvider`, protected role routes, and React Testing Library.

## Required contracts

- `POST /api/auth/login` accepts `{ employeeId, password }`, sets cookie `acci_session`, and returns `{ user: { id, name, role } }`.
- `GET /api/auth/me` returns the same user shape for a valid cookie; `POST /api/auth/logout` clears it.
- `GET /api/health/live` does not touch SQL; `GET /api/health/ready` returns 200 only when `SELECT 1` succeeds.
- `POST /api/customers` accepts `{ fullName, organization, citizenId, phone, email, address }` and returns `{ customer }` with HTTP 201.
- `POST /api/registrations` accepts `{ customerId, registrationDate, candidates[] }`; identity comes from auth. It atomically creates candidate rows, registration details, and one registration and returns `{ registration }` with HTTP 201.
- `POST /api/exam-forms` is restricted to `Tổ chức thi` and issues exam forms from persisted registration details.
- `GET /api/payments` and `GET /api/payments/:registrationId/quote` use one documented response vocabulary based on `registrationId`, `customerId`, and `invoiceId`.
- `POST /api/extensions` accepts `{ examFormId, caseType, newScheduleId }`, checks remaining attempts and the 24-hour rule on the server, and returns `{ extension }` with HTTP 201.

## Acceptance criteria

1. A clean clone needs no tracked dependency folders and installs with `npm ci` at the repository root.
2. No secret or machine-specific host is committed; startup fails nonzero if required configuration or SQL connectivity is missing.
3. Login uses a hash, issues an HttpOnly cookie, and protected APIs reject unauthenticated and wrong-role requests with 401/403.
4. Customer creation, registration creation, payment quote, and extension request each have passing unit/integration tests for success and rollback/error behavior.
5. The UI can complete reception registration and extension flows against the documented API contracts without hard-coded origins.
6. `npm run lint`, `npm test`, and `npm run build` pass locally and in GitHub Actions.
7. Database and trigger scripts pass an isolated SQL Server smoke test in CI.
8. `npm audit --omit=dev` reports zero high or critical production vulnerabilities in each workspace.
9. README setup steps reproduce the database, environment, install, test, and run procedure from a clean clone.
