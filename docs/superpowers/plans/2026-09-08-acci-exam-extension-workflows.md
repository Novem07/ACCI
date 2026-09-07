# ACCI Exam and Extension Workflows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modernize exam-form inspection, issuance safeguards, and schedule extension with set-based validation and explicit eligibility reasons.

**Architecture:** Exam forms and extensions retain separate feature boundaries while sharing schedule display models. SQL transactions perform locked set validation and guarded capacity updates; the UI presents current/eligible schedules without reproducing business rules.

**Tech Stack:** React 19, CSS Modules, Vitest, Testing Library, Express 5, Zod 4, mssql, SQL Server migrations.

**Spec:** `docs/superpowers/specs/2026-09-08-acci-modernization-design.md`

## Global Constraints

- Exam capacity and 24-hour eligibility are server-owned business rules.
- Preserve serializable transactions and make concurrent capacity failures explicit.
- Lists use server pagination, normalized English fields, and URL-backed state.
- Status and eligibility include readable text, not color alone.
- Every contract/behavior change uses red-green-refactor and a focused commit.

---

### Task 1: Normalize exam-form API and set-based issuance validation

**Files:**
- Modify: `server/src/exam-forms/exam-form.routes.js`
- Modify: `server/src/exam-forms/exam-form.schema.js`
- Modify: `server/src/exam-forms/exam-form.service.js`
- Modify: `server/test/exam-forms.test.js`

**Interfaces:**
- `GET /api/exam-forms` returns `{ items, page, pageSize, totalItems, totalPages }`.
- `POST /api/exam-forms` retains `{ registrationId, assignments: [{ candidateId, scheduleId }] }`.
- Issuance validates candidates, duplicates, certificate matches, and schedule capacity set-wise before insert work.

- [ ] **Step 1: Write failing contract/query tests**

```js
test('returns the common page shape', async () => {
  const response = await request(app).get('/api/exam-forms?page=1&pageSize=20').set('Cookie', organizerCookie);
  assert.ok(Array.isArray(response.body.items));
  assert.equal(response.body.page, 1);
});

test('validates three assignments without per-assignment SELECT queries', async () => {
  await service.create({ input: threeAssignments, userId: 'NV003' });
  assert.equal(selectsInsideAssignmentLoop(), 0);
});
```

- [ ] **Step 2: Confirm RED**

Run: `npm test --workspace server -- test/exam-forms.test.js`
Expected: FAIL on response shape and query-count expectation.

- [ ] **Step 3: Implement set-based locked validation**

Pass assignments as JSON to one locked query using `OPENJSON(@assignments)` and join registration details, existing exam forms, and schedules. Reject incomplete, duplicate, mismatched, or full assignments before generating IDs. Return `examForms: items` alongside the common page fields until Task 2 switches the frontend adapter. Update capacity with:

```sql
UPDATE LichThi SET SoChoTrong = SoChoTrong - @assignedCount
WHERE MaLichThi = @scheduleId AND SoChoTrong >= @assignedCount;
```

Require one affected row per schedule group.

- [ ] **Step 4: Verify GREEN and rollback/concurrency cases**

Run: `npm test --workspace server -- test/exam-forms.test.js`
Expected: PASS for organizer role, complete assignment, duplicates, mismatch, insufficient capacity, affected-row failure, and rollback.

- [ ] **Step 5: Commit**

```powershell
git add server/src/exam-forms server/test/exam-forms.test.js
git commit -m "refactor: validate exam issuance set-wise"
```

### Task 2: Exam-form list and detail UI

**Files:**
- Create: `client/src/features/exam-forms/api.js`
- Create: `client/src/features/exam-forms/ExamFormListPage.jsx`
- Create: `client/src/features/exam-forms/ExamFormListPage.module.css`
- Create: `client/src/features/exam-forms/ExamFormDetailPage.jsx`
- Create: `client/src/features/exam-forms/ExamFormDetailPage.module.css`
- Create: `client/src/features/exam-forms/ExamForms.test.jsx`
- Modify: `client/src/app/AppRouter.jsx`

**Interfaces:**
- `listExamForms(params, { signal } = {}) -> Promise<Page<ExamFormSummary>>`.
- `getExamForm(id, { signal } = {}) -> Promise<ExamFormDetail>`.

- [ ] **Step 1: Write failing list/detail tests**

```jsx
it('opens an exam form from a URL-backed paginated list', async () => {
  renderRoute('/phieuduthi?page=2&query=PDT');
  const link = await screen.findByRole('link', { name: /PDT000021/ });
  expect(link).toHaveAttribute('href', '/phieuduthi/PDT000021');
});

it('renders exam details as labelled values', async () => {
  renderRoute('/phieuduthi/PDT000021');
  expect(await screen.findByText('Ngày thi')).toBeInTheDocument();
  expect(screen.getByText('Mã thí sinh')).toBeInTheDocument();
});
```

- [ ] **Step 2: Confirm RED**

Run: `npm test --workspace client -- ExamForms.test.jsx`
Expected: FAIL because migrated feature pages do not exist.

- [ ] **Step 3: Implement pages from shared primitives**

Use `Page`, `SearchToolbar`, `DataTable`, `Pagination`, `StatusBadge`, and a semantic `<dl>` detail card. Keep loading/error states within the page frame and format dates through `shared/format.js`.

- [ ] **Step 4: Verify GREEN**

Run: `npm test --workspace client -- ExamForms.test.jsx`
Expected: PASS for pagination, deep link, loading, not found, details, and back navigation.

- [ ] **Step 5: Commit**

```powershell
git add client/src/features/exam-forms client/src/app
git commit -m "feat: modernize exam form views"
```

### Task 3: Extension eligibility contract and concurrency guards

**Files:**
- Modify: `server/src/extensions/extension.routes.js`
- Modify: `server/src/extensions/extension.schema.js`
- Modify: `server/src/extensions/extension.service.js`
- Modify: `server/test/extensions.test.js`

**Interfaces:**
- `GET /api/extensions/:examFormId/extension-options` returns `{ examForm, currentSchedule, schedules }`.
- Schedule item includes `{ scheduleId, examDate, examTime, duration, remainingSeats, roomId, eligibility: { allowed, reason } }`.
- Eligibility reasons: `null`, `SCHEDULE_FULL`, `EXTENSION_WINDOW_CLOSED`, or `CURRENT_SCHEDULE`.

- [ ] **Step 1: Write failing eligibility and guarded-update tests**

```js
test('returns ineligible schedules with a machine reason', async () => {
  const result = await service.options('PDT000001', { now: fixedNow });
  assert.deepEqual(result.schedules.find(item => item.remainingSeats === 0).eligibility, { allowed: false, reason: 'SCHEDULE_FULL' });
});

test('rolls back when the destination seat update affects no row', async () => {
  destinationUpdate.rowsAffected = [0];
  await assert.rejects(() => service.create(validRequest), error => error.code === 'SCHEDULE_FULL');
  assert.equal(transactionRolledBack, true);
});
```

- [ ] **Step 2: Confirm RED**

Run: `npm test --workspace server -- test/extensions.test.js`
Expected: FAIL because options currently exclude full schedules and capacity updates do not inspect affected rows.

- [ ] **Step 3: Implement eligibility and atomic capacity updates**

Return matching-certificate schedules with computed eligibility. Decrement with `WHERE SoChoTrong > 0`, verify one affected row, then increment the previous schedule within the same transaction. Use the same injected clock and `Asia/Ho_Chi_Minh` date helper for options and creation.

- [ ] **Step 4: Verify GREEN**

Run: `npm test --workspace server -- test/extensions.test.js`
Expected: PASS for each eligibility reason, no attempts, same schedule, mismatch, 24-hour boundary, seat race, and rollback.

- [ ] **Step 5: Commit**

```powershell
git add server/src/extensions server/test/extensions.test.js
git commit -m "refactor: expose extension eligibility safely"
```

### Task 4: Extension list and schedule comparison UI

**Files:**
- Create: `client/src/features/extensions/api.js`
- Create: `client/src/features/extensions/ExtensionListPage.jsx`
- Create: `client/src/features/extensions/ExtensionListPage.module.css`
- Create: `client/src/features/extensions/CreateExtensionPage.jsx`
- Create: `client/src/features/extensions/CreateExtensionPage.module.css`
- Create: `client/src/features/extensions/Extensions.test.jsx`
- Modify: `client/src/app/AppRouter.jsx`
- Create: `e2e/extensions.spec.js`

**Interfaces:**
- `getExtensionOptions(examFormId, { signal } = {}) -> Promise<ExtensionOptions>`.
- `createExtension({ examFormId, caseType, newScheduleId }) -> Promise<Extension>`.

- [ ] **Step 1: Write failing schedule-comparison test**

```jsx
it('explains why an unavailable schedule cannot be selected', async () => {
  renderCreateExtension(optionsWithFullAndClosedSchedules);
  expect(await screen.findByText('Đã hết chỗ')).toBeInTheDocument();
  expect(screen.getByRole('radio', { name: /LT000002/ })).toBeDisabled();
  expect(screen.getByText('Còn dưới 24 giờ')).toBeInTheDocument();
});
```

- [ ] **Step 2: Confirm RED**

Run: `npm test --workspace client -- Extensions.test.jsx`
Expected: FAIL because eligibility reasons are not presented.

- [ ] **Step 3: Implement list and comparison page**

Use the paginated exam-form list adapter for candidates for extension. Present current schedule above a radio-based comparison table; map server reasons to Vietnamese labels and never calculate eligibility in React.

- [ ] **Step 4: Verify GREEN and browser workflow**

Run: `npm test --workspace client -- Extensions.test.jsx` and `npm run test:e2e -- --grep "extension"`
Expected: PASS for eligible selection, disabled reasons, no-attempt state, submission success, API conflict, and keyboard selection.

- [ ] **Step 5: Commit**

```powershell
git add client/src/features/extensions client/src/app e2e/extensions.spec.js
git commit -m "feat: rebuild extension scheduling workflow"
```

### Task 5: Database invariant migration

**Files:**
- Create: `database/migrations/003_workflow_indexes.sql`
- Modify: `scripts/db-smoke.ps1`
- Create: `server/test/database-migration.test.js`

**Interfaces:**
- Produces unique invariant `UX_PhieuDuThi_Registration_Candidate` on `(MaPhieuDangKy, MaThiSinh)`.
- Produces unique invariant `UX_HoaDonDangKy_Registration` on `(MaPhieuDangKy)`.
- Produces schedule lookup index `IX_LichThi_Certificate_Date` on `(MaChungChi, NgayThi, GioThi)` including `(SoChoTrong, MaPhongThi)`.

- [ ] **Step 1: Write failing migration text and smoke assertions**

```js
test('migration declares workflow uniqueness and schedule lookup indexes', () => {
  const sql = readFileSync(migrationPath, 'utf8');
  assert.match(sql, /UX_PhieuDuThi_Registration_Candidate/);
  assert.match(sql, /UX_HoaDonDangKy_Registration/);
  assert.match(sql, /IX_LichThi_Certificate_Date/);
});
```

- [ ] **Step 2: Confirm RED**

Run: `npm test --workspace server -- test/database-migration.test.js`
Expected: FAIL because migration 003 does not exist.

- [ ] **Step 3: Add guarded additive migration**

Before each unique index, abort with `THROW` if duplicate rows exist. Wrap DDL in a transaction and guard each index with `IF NOT EXISTS (SELECT 1 FROM sys.indexes ...)`. Extend DB smoke checks to assert all three indexes exist.

- [ ] **Step 4: Verify migration and database smoke**

Run: `npm test --workspace server -- test/database-migration.test.js` and `npm run db:smoke`
Expected: PASS; rerunning the migration is safe and smoke reports all indexes.

- [ ] **Step 5: Commit**

```powershell
git add database/migrations/003_workflow_indexes.sql scripts/db-smoke.ps1 server/test/database-migration.test.js
git commit -m "perf: enforce workflow database invariants"
```
