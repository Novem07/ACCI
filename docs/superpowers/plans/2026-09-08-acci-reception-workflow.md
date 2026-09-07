# ACCI Reception Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a fast, accessible registration queue and registration-entry flow backed by normalized, paginated APIs and set-based SQL validation.

**Architecture:** The registration and customer domains each own server validation/service boundaries and client adapters/hooks. The create flow composes focused customer, candidate, review, and summary components; the server owns registration identity, date, and transactional status.

**Tech Stack:** React 19, CSS Modules, Vitest, Testing Library, Express 5, Zod 4, mssql, SQL Server.

**Spec:** `docs/superpowers/specs/2026-09-08-acci-modernization-design.md`

## Global Constraints

- API models use English fields; all visible labels remain Vietnamese.
- Registration creation date and identity are server-owned.
- Preserve transactions and locks; validate certificate IDs set-wise before candidate inserts.
- Lists use server pagination and URL-backed query/filter state.
- Essential registration work must remain usable at 390x844.
- Every contract/behavior change uses red-green-refactor and a focused commit.

---

### Task 1: Common pagination and registration/customer list contracts

**Files:**
- Create: `server/src/http/pagination.js`
- Create: `server/test/pagination.test.js`
- Modify: `server/src/customers/customer.routes.js`
- Modify: `server/src/customers/customer.service.js`
- Modify: `server/src/registrations/registration.routes.js`
- Modify: `server/src/registrations/registration.service.js`
- Modify: `server/test/registrations.test.js`
- Modify: `server/test/api-contract.test.js`

**Interfaces:**
- Produces: `parsePagination(query, { maxPageSize = 100 } = {}) -> { page, pageSize, query, status }` or throws `VALIDATION_ERROR`.
- Changes list responses to `{ items, page, pageSize, totalItems, totalPages }`.
- Customer search covers ID, name, phone; registration search covers registration/customer ID and accepts an exact status filter.

- [ ] **Step 1: Write failing contract tests**

```js
test('registration list validates and returns common pagination metadata', async () => {
  const response = await request(app).get('/api/registrations?page=2&pageSize=10&query=PDK&status=Chờ phát hành').set('Cookie', receptionCookie);
  assert.equal(response.status, 200);
  assert.deepEqual(response.body.items, registrations);
  assert.deepEqual(response.body.registrations, registrations);
  assert.deepEqual({ page: response.body.page, pageSize: response.body.pageSize, totalItems: response.body.totalItems, totalPages: response.body.totalPages }, { page: 2, pageSize: 10, totalItems: 14, totalPages: 2 });
});

test('rejects pageSize above 100 before querying', async () => {
  const response = await request(app).get('/api/customers?pageSize=101').set('Cookie', receptionCookie);
  assert.equal(response.status, 400);
  assert.equal(response.body.error.code, 'VALIDATION_ERROR');
});
```

- [ ] **Step 2: Confirm RED**

Run: `npm test --workspace server -- test/pagination.test.js test/registrations.test.js test/api-contract.test.js`
Expected: FAIL because lists currently return full arrays.

- [ ] **Step 3: Implement shared parsing and paginated SQL**

Use parameterized `OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY` and a matching `COUNT_BIG(*)` query. Return numeric metadata and clamp no values silently; invalid input is a 400 response. During migration, also return `registrations: items` or `customers: items` so the current UI remains runnable until Tasks 3–4 switch adapters.

- [ ] **Step 4: Verify GREEN**

Run: `npm test --workspace server -- test/pagination.test.js test/registrations.test.js test/api-contract.test.js`
Expected: PASS for defaults, filters, page bounds, and rejected invalid input.

- [ ] **Step 5: Commit**

```powershell
git add server/src/http server/src/customers server/src/registrations server/test
git commit -m "refactor: paginate reception APIs"
```

### Task 2: Server-owned registration creation and set validation

**Files:**
- Modify: `server/src/registrations/registration.schema.js`
- Modify: `server/src/registrations/registration.service.js`
- Create: `server/src/domain/date.js`
- Modify: `server/test/registrations.test.js`
- Modify: `server/test/api-contract.test.js`

**Interfaces:**
- `POST /api/registrations` consumes `{ customerId, candidates }` only.
- `registrationService.create({ input, userId, now })` returns `{ id, customerId, status, candidateCount, candidateIds, createdBy, registrationDate }`.
- `toBusinessDate(date, timeZone = 'Asia/Ho_Chi_Minh') -> YYYY-MM-DD` owns date-only conversion for later payment and extension tasks.

- [ ] **Step 1: Write failing ownership and query-count tests**

```js
test('ignores no client date and stores the server date', async () => {
  const input = { customerId: 'KH000001', candidates: [candidate] };
  const result = await service.create({ input, userId: 'NV001', now: new Date('2030-05-06T08:00:00Z') });
  assert.equal(result.registrationDate, '2030-05-06');
});

test('validates all certificate IDs in one set query before inserting', async () => {
  await service.create({ input: registrationWithThreeCandidates, userId: 'NV001' });
  assert.equal(dbQueries.filter(sql => sql.includes('FROM ChungChi')).length, 1);
});
```

- [ ] **Step 2: Confirm RED**

Run: `npm test --workspace server -- test/registrations.test.js test/api-contract.test.js`
Expected: FAIL because the schema requires `registrationDate` and certificate checks run per candidate.

- [ ] **Step 3: Implement server date and set lookup**

Remove `registrationDate` from the accepted schema. Pass the clock into the service and derive the date through `toBusinessDate(now)`. Serialize unique certificate IDs as JSON and query once:

```sql
SELECT MaChungChi AS id
FROM ChungChi
WHERE MaChungChi IN (SELECT [value] FROM OPENJSON(@certificateIds));
```

Reject the request before inserts if any requested ID is absent.

- [ ] **Step 4: Verify GREEN and rollback behavior**

Run: `npm test --workspace server -- test/registrations.test.js test/api-contract.test.js`
Expected: PASS; unknown certificates roll back; returned date comes from the injected clock.

- [ ] **Step 5: Commit**

```powershell
git add server/src/domain/date.js server/src/registrations server/test
git commit -m "refactor: make registration creation server owned"
```

### Task 3: Reception client adapters and list page

**Files:**
- Create: `client/src/features/registrations/api.js`
- Create: `client/src/features/registrations/useRegistrations.js`
- Create: `client/src/features/registrations/RegistrationListPage.jsx`
- Create: `client/src/features/registrations/RegistrationListPage.module.css`
- Create: `client/src/features/registrations/RegistrationListPage.test.jsx`
- Create: `client/src/shared/format.js`
- Create: `client/src/shared/statuses.js`
- Modify: `client/src/api/client.js`
- Modify: `client/src/app/AppRouter.jsx`

**Interfaces:**
- `request(path, { signal, ...options })` forwards `AbortSignal` and accepts empty 204 bodies.
- `listRegistrations({ page, pageSize, query, status }, { signal } = {}) -> Promise<{ items, page, pageSize, totalItems, totalPages }>`.
- `formatDate(value)`, `formatCurrency(value)`, and `formatIdentifier(value)` centralize display formatting.
- Produces frozen `REGISTRATION_STATUS`, `PAYMENT_STATUS`, and `EXAM_FORM_STATUS` code/label/tone mappings for later feature plans.

- [ ] **Step 1: Write failing adapter/page tests**

```jsx
it('restores queue filters from the URL and sends them to the adapter', async () => {
  renderRoute('/tiepnhan?page=2&query=PDK&status=Ch%E1%BB%9D%20ph%C3%A1t%20h%C3%A0nh');
  await waitFor(() => expect(listRegistrations).toHaveBeenCalledWith(expect.objectContaining({ page: 2, query: 'PDK', status: 'Chờ phát hành' }), expect.any(Object)));
  expect(screen.getByRole('heading', { name: 'Phiếu đăng ký' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Confirm RED**

Run: `npm test --workspace client -- RegistrationListPage.test.jsx`
Expected: FAIL because feature adapter/page files do not exist.

- [ ] **Step 3: Implement adapter, abortable hook, and page composition**

Compose `Page`, `SearchToolbar`, `DataTable`, `StatusBadge`, `Pagination`, `LoadingState`, and `EmptyState`. Debounce search by 250ms and write committed search/filter/page values to `useSearchParams`.

- [ ] **Step 4: Verify GREEN**

Run: `npm test --workspace client -- RegistrationListPage.test.jsx`
Expected: PASS for loading, data, empty, error, search, filter, pagination, and abort-on-unmount.

- [ ] **Step 5: Commit**

```powershell
git add client/src/api client/src/features/registrations client/src/shared client/src/app
git commit -m "feat: modernize registration queue"
```

### Task 4: Composed registration-entry flow

**Files:**
- Create: `client/src/features/customers/api.js`
- Create: `client/src/features/registrations/CreateRegistrationPage.jsx`
- Create: `client/src/features/registrations/CreateRegistrationPage.module.css`
- Create: `client/src/features/registrations/components/CustomerSelector.jsx`
- Create: `client/src/features/registrations/components/CustomerForm.jsx`
- Create: `client/src/features/registrations/components/CandidateEditor.jsx`
- Create: `client/src/features/registrations/components/CandidateTable.jsx`
- Create: `client/src/features/registrations/components/RegistrationSummary.jsx`
- Create: `client/src/features/registrations/CreateRegistrationPage.test.jsx`
- Modify: `client/src/features/registrations/api.js`
- Modify: `client/src/app/AppRouter.jsx`
- Create: `e2e/reception.spec.js`

**Interfaces:**
- `createRegistration({ customerId, candidates }) -> Promise<Registration>`; no date/status/creator input.
- Candidate client model: `{ clientId, fullName, certificateId, citizenId, phone, email, address }`.
- `CandidateEditor({ certificates, initialValue, onSave, onCancel })`; `CandidateTable({ candidates, certificatesById, onEdit, onRemove })`.

- [ ] **Step 1: Write failing end-to-end component behavior test**

```jsx
it('selects a customer, edits candidates, and submits only server-accepted fields', async () => {
  renderCreateRegistration();
  await selectCustomer('KH000001 - Nguyễn Văn A');
  await addCandidate(validCandidate);
  await userEvent.click(screen.getByRole('button', { name: 'Tạo phiếu đăng ký' }));
  expect(createRegistration).toHaveBeenCalledWith({ customerId: 'KH000001', candidates: [expect.objectContaining({ fullName: validCandidate.fullName })] });
  expect(createRegistration.mock.calls[0][0]).not.toHaveProperty('registrationDate');
});
```

- [ ] **Step 2: Confirm RED**

Run: `npm test --workspace client -- CreateRegistrationPage.test.jsx`
Expected: FAIL because the composed feature page does not exist.

- [ ] **Step 3: Implement focused sections and validation**

Use persistent labels and field-level errors. Generate `clientId` with `crypto.randomUUID()`, strip it in the API adapter, permit candidate edit/removal, and show a sticky summary bar. Register `beforeunload` and route blocker only when form state is dirty.

- [ ] **Step 4: Verify GREEN and browser flow**

Run: `npm test --workspace client -- CreateRegistrationPage.test.jsx` and `npm run test:e2e -- --grep "registration"`
Expected: PASS for create customer, select customer, add/edit/remove candidate, dirty-leave warning, success navigation, and server error.

- [ ] **Step 5: Commit**

```powershell
git add client/src/features/customers client/src/features/registrations client/src/app e2e/reception.spec.js
git commit -m "feat: rebuild registration entry workflow"
```

### Task 5: Shared candidate directory

**Files:**
- Create: `server/src/catalog/catalog.service.js`
- Modify: `server/src/catalog/catalog.routes.js`
- Modify: `server/src/app.js`
- Create: `server/test/catalog.test.js`
- Create: `client/src/features/candidates/api.js`
- Create: `client/src/features/candidates/CandidateListPage.jsx`
- Create: `client/src/features/candidates/CandidateListPage.module.css`
- Create: `client/src/features/candidates/CandidateListPage.test.jsx`
- Modify: `client/src/app/AppRouter.jsx`

**Interfaces:**
- `GET /api/catalog/candidates?page=1&pageSize=20&query=` returns `{ items, page, pageSize, totalItems, totalPages, candidates: items }` during compatibility migration.
- `listCandidates(params, { signal } = {}) -> Promise<Page<CandidateSummary>>`.

- [ ] **Step 1: Write failing API and page tests**

```js
test('candidate directory validates pagination before querying', async () => {
  const response = await request(app).get('/api/catalog/candidates?pageSize=101').set('Cookie', staffCookie);
  assert.equal(response.status, 400);
  assert.equal(response.body.error.code, 'VALIDATION_ERROR');
});
```

```jsx
it('preserves candidate search in the URL', async () => {
  renderRoute('/xemthisinh?query=Nguyen&page=1');
  expect(await screen.findByRole('table', { name: 'Danh sách thí sinh' })).toBeInTheDocument();
  expect(screen.getByRole('searchbox', { name: 'Tìm thí sinh' })).toHaveValue('Nguyen');
});
```

- [ ] **Step 2: Confirm RED**

Run: `npm test --workspace server -- test/catalog.test.js` and `npm test --workspace client -- CandidateListPage.test.jsx`
Expected: FAIL because candidate pagination/service and migrated page do not exist.

- [ ] **Step 3: Implement service, adapter, and shared-role page**

Move catalog SQL out of the router, apply common pagination parsing, and keep the temporary `candidates` alias for the old page. Compose the new page from `Page`, `SearchToolbar`, `DataTable`, and `Pagination`; allow Reception, Accounting, and Exam Organizer roles through the existing nested role gate.

- [ ] **Step 4: Verify GREEN**

Run: `npm test --workspace server -- test/catalog.test.js` and `npm test --workspace client -- CandidateListPage.test.jsx`
Expected: PASS for all three allowed roles, denied roles, pagination validation, search, empty state, and URL restoration.

- [ ] **Step 5: Commit**

```powershell
git add server/src/catalog server/src/app.js server/test/catalog.test.js client/src/features/candidates client/src/app
git commit -m "feat: add paginated candidate directory"
```
