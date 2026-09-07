# ACCI Quality, Cleanup, and Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish cross-cutting backend consistency, remove legacy frontend code, cover accessibility and critical browser flows, and document a reproducible release-quality workspace.

**Architecture:** Shared server middleware/constants replace repeated route boundaries. Remaining frontend routes use the persistent shell and intentional empty states, then obsolete CSS/assets/dependencies are removed only after reference scans and tests prove they are unused.

**Tech Stack:** React 19, React Router 7, Vite 8, Playwright, axe-core, Express 5, Zod 4, SQL Server.

**Spec:** `docs/superpowers/specs/2026-09-08-acci-modernization-design.md`

## Global Constraints

- Retain React, Vite, Express, and SQL Server; Node.js remains `>=22.14 <23`.
- Do not invent workflows for unfinished roles; show an honest unavailable-module state.
- Remove a dependency or asset only after `rg` proves there are no runtime references.
- No high-severity production audit findings, serious accessibility violations, browser console errors, or failed API requests.
- Every behavior change uses red-green-refactor and a focused commit.

---

### Task 1: Shared backend roles, validation, and request diagnostics

**Files:**
- Create: `server/src/domain/constants.js`
- Create: `server/src/http/validate.js`
- Create: `server/src/middleware/request-id.js`
- Modify: `server/src/app.js`
- Modify: `server/src/middleware/error-handler.js`
- Modify: `server/src/auth/auth.routes.js`
- Modify: `server/src/catalog/catalog.routes.js`
- Modify: `server/src/customers/customer.routes.js`
- Modify: `server/src/exam-forms/exam-form.routes.js`
- Modify: `server/src/extensions/extension.routes.js`
- Modify: `server/src/payments/payment.routes.js`
- Modify: `server/src/registrations/registration.routes.js`
- Create: `server/test/http-boundaries.test.js`

**Interfaces:**
- Produces: `ROLES = Object.freeze({ RECEPTION: 'Tiếp nhận', ACCOUNTING: 'Kế Toán', EXAM_ORGANIZER: 'Tổ chức thi', DATA_ENTRY: 'Nhập liệu', PROCTOR: 'Coi thi' })` plus frozen `REGISTRATION_STATUS`, `PAYMENT_STATUS`, and `EXAM_FORM_STATUS` values matching database text exactly.
- Produces: `validate({ body, params, query })` middleware that stores parsed values in `req.validated`.
- Produces: `requestId` response header `X-Request-Id` and `error.requestId` for non-2xx JSON errors.

- [ ] **Step 1: Write failing boundary tests**

```js
test('returns flattened Zod details and a request ID', async () => {
  const response = await request(app).post('/api/registrations').set('Cookie', receptionCookie).send({});
  assert.equal(response.status, 400);
  assert.equal(response.body.error.code, 'VALIDATION_ERROR');
  assert.equal(response.body.error.requestId, response.headers['x-request-id']);
});
```

- [ ] **Step 2: Confirm RED**

Run: `npm test --workspace server -- test/http-boundaries.test.js`
Expected: FAIL because shared validation/request IDs do not exist.

- [ ] **Step 3: Implement boundaries and migrate routes**

```js
function validate(schemas) {
  return (req, res, next) => {
    const parsed = Object.fromEntries(Object.entries(schemas).map(([key, schema]) => [key, schema.safeParse(req[key])]));
    const failure = Object.values(parsed).find(result => !result.success);
    if (failure) return next(httpError(400, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ.', failure.error.flatten().fieldErrors));
    req.validated = Object.fromEntries(Object.entries(parsed).map(([key, result]) => [key, result.data]));
    next();
  };
}
```

Use `crypto.randomUUID()` for request IDs and Express 5 async rejection handling consistently. Replace literal role strings in route modules with `ROLES`. Remove the temporary `registrations`, `customers`, `candidates`, `payments`, and `examForms` list aliases now that every client adapter consumes `items`; assert their absence in `api-contract.test.js`.

- [ ] **Step 4: Verify GREEN and all server tests**

Run: `npm test --workspace server` and `npm run lint --workspace server`
Expected: all server tests pass; 400/401/403/404/409/500 responses keep existing codes/messages and include request IDs.

- [ ] **Step 5: Commit**

```powershell
git add server/src server/test/http-boundaries.test.js
git commit -m "refactor: unify server request boundaries"
```

### Task 2: Remaining routes, lazy loading, and honest module states

**Files:**
- Create: `client/src/ui/feedback/UnavailableModule.jsx`
- Create: `client/src/ui/feedback/UnavailableModule.test.jsx`
- Create: `client/src/features/dashboard/DashboardPage.jsx`
- Create: `client/src/features/dashboard/DashboardPage.module.css`
- Create: `client/src/features/dashboard/DashboardPage.test.jsx`
- Modify: `client/src/app/AppRouter.jsx`
- Modify: `client/src/app/routes.js`
- Test: `client/src/app/AppRouter.test.jsx`

**Interfaces:**
- Produces: `UnavailableModule({ title, description })` inside the persistent page layout.
- Route modules load through `React.lazy`; the `<Suspense>` fallback is a page-framed `LoadingState`, not a blank viewport.

- [ ] **Step 1: Write failing lazy/empty-state tests**

```jsx
it('keeps the shell while a lazy route resolves', async () => {
  renderRoute('/nhaplieu');
  expect(screen.getByTestId('app-shell')).toBeInTheDocument();
  expect(await screen.findByRole('heading', { name: 'Nhập liệu' })).toBeInTheDocument();
  expect(screen.getByText(/chưa khả dụng/)).toBeInTheDocument();
});

it('shows only actions allowed for the signed-in role', () => {
  renderDashboard({ role: ROLES.ACCOUNTING });
  expect(screen.getByRole('link', { name: 'Thanh toán' })).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Lập phiếu đăng ký' })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Confirm RED**

Run: `npm test --workspace client -- AppRouter.test.jsx UnavailableModule.test.jsx DashboardPage.test.jsx`
Expected: FAIL because placeholder headings and eager imports remain.

- [ ] **Step 3: Implement lazy feature routes and unavailable states**

Use `lazy(() => import('../features/.../Page.jsx'))` for page modules. Keep `AppShellLayout` outside `Suspense`; render data-entry and proctor routes with clear Vietnamese descriptions and no fake controls.

- [ ] **Step 4: Verify GREEN and chunk output**

Run: `npm test --workspace client -- AppRouter.test.jsx UnavailableModule.test.jsx DashboardPage.test.jsx` and `npm run build`
Expected: tests pass and Vite emits multiple feature chunks without a chunk-size warning.

- [ ] **Step 5: Commit**

```powershell
git add client/src/app client/src/features/dashboard client/src/ui/feedback
git commit -m "perf: lazy load feature routes"
```

### Task 3: Remove legacy styles, assets, and dependencies

**Files:**
- Delete after migration: `client/src/App.css`
- Delete after migration: `client/src/styles/design.css`
- Delete after migration: `client/src/pages/AccountantPage.css`
- Delete after migration: `client/src/pages/AccountantPage.jsx`
- Delete after migration: `client/src/pages/CreateRegisterPage.css`
- Delete after migration: `client/src/pages/CreateRegisterPage.jsx`
- Delete after migration: `client/src/pages/ExamFormDetail.css`
- Delete after migration: `client/src/pages/ExamFormDetail.jsx`
- Delete after migration: `client/src/pages/ExtendFormPage.css`
- Delete after migration: `client/src/pages/ExtendFormPage.jsx`
- Delete after migration: `client/src/pages/ExtendRegisterPage.css`
- Delete after migration: `client/src/pages/ExtendRegisterPage.jsx`
- Delete after migration: `client/src/pages/HomePage.css`
- Delete after migration: `client/src/pages/HomePage.jsx`
- Delete after migration: `client/src/pages/LoginPage.css`
- Delete after migration: `client/src/pages/LoginPage.jsx`
- Delete after migration: `client/src/pages/ProcessRegister.css`
- Delete after migration: `client/src/pages/ProcessRegister.jsx`
- Delete after migration: `client/src/pages/ViewExamForms.css`
- Delete after migration: `client/src/pages/ViewExamForms.jsx`
- Delete after migration: `client/src/pages/ViewRegisterPage.css`
- Delete after migration: `client/src/pages/ViewRegisterPage.jsx`
- Delete after migration: `client/src/pages/ViewStudentListPage.css`
- Delete after migration: `client/src/pages/ViewStudentListPage.jsx`
- Delete after migration: `client/src/pages/ViewTempThisinh.jsx`
- Delete after migration: `client/src/pages/CreateRegisterPage.test.jsx`
- Delete after migration: `client/src/pages/ExtendFormPage.test.jsx`
- Delete after migration: `client/src/pages/HomePage.test.jsx`
- Delete after migration: `client/src/pages/ProcessRegister.test.jsx`
- Delete after migration: `client/src/components/AppShell.css`
- Delete after migration: `client/src/components/AppShell.jsx`
- Delete after migration: `client/src/components/AppShell.test.jsx`
- Delete after migration: `client/src/components/AsyncState.css`
- Delete after migration: `client/src/components/AsyncState.jsx`
- Delete after migration: `client/src/components/Icon.jsx`
- Delete after migration: `client/src/components/navigation.js`
- Delete after migration: `client/src/components/WarningModal.css`
- Delete after migration: `client/src/components/WarningModal.jsx`
- Delete after migration: `client/src/App.test.jsx`
- Delete after migration: `client/src/index.css`
- Delete after migration: `client/src/logo.svg`, `client/public/LogoACCI.png`, `client/public/logo192.png`, `client/public/logo512.png`, `client/public/favicon.ico`
- Modify: `client/public/manifest.json`
- Modify: `client/package.json`
- Modify: `package-lock.json`
- Create: `client/src/legacy-cleanup.test.js`

**Interfaces:**
- Removes runtime dependencies `bootstrap`, `font-awesome`, and `dayjs` after reference scans are empty.
- Manifest name becomes `ACCI Center`; icons reference only the new SVG brand assets.

- [ ] **Step 1: Write a failing legacy scan test**

```js
it('contains no global page CSS or legacy asset references', () => {
  const source = readClientSource();
  expect(source).not.toMatch(/design\.css|LogoACCI\.png|logo192\.png|dayjs/);
  expect(readAllCss()).not.toMatch(/!important|(^|\n)\s*(body|h[1-6]|button|table|input)\s*\{/m);
});
```

- [ ] **Step 2: Confirm RED**

Run: `npm test --workspace client -- legacy-cleanup.test.js`
Expected: FAIL and list current legacy references.

- [ ] **Step 3: Remove only proven-unused legacy files/packages**

Run `rg -n 'bootstrap|font-awesome|dayjs|LogoACCI|logo192|logo512|design\.css|App\.css' client` first. Replace the final `dayjs` call with `formatDate`, update the manifest, then run `npm uninstall --workspace client bootstrap font-awesome dayjs` and delete assets/styles with zero references.

- [ ] **Step 4: Verify GREEN and production audit**

Run: `npm test --workspace client -- legacy-cleanup.test.js`, `npm run build`, and `npm run audit:prod`
Expected: PASS, no unresolved imports, no high-severity production findings, and the 1.3 MB PNG is absent from build inputs.

- [ ] **Step 5: Commit**

```powershell
git add -A client package-lock.json
git commit -m "chore: remove legacy client surface"
```

### Task 4: Automated accessibility gates

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `playwright.config.js`
- Create: `e2e/accessibility.spec.js`

**Interfaces:**
- Produces: `npm run test:a11y` using `@axe-core/playwright`.
- Scans login, dashboard, registration list/create, payment queue/checkout, exam list/detail, and extension create pages.

- [ ] **Step 1: Write failing accessibility scan**

```js
test('registration creation has no serious accessibility violations', async ({ page }) => {
  await installMockApi(page, registrationScenario);
  await page.goto('/taophieu');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(item => ['serious', 'critical'].includes(item.impact))).toEqual([]);
});
```

- [ ] **Step 2: Confirm RED before installing the scanner**

Run: `npm run test:a11y`
Expected: FAIL because the package/script/spec do not exist.

- [ ] **Step 3: Install and configure axe browser scans**

Run: `npm install --save-dev @axe-core/playwright`. Add a dedicated Playwright project named `accessibility` and a root script `test:a11y` that runs only `e2e/accessibility.spec.js`.

- [ ] **Step 4: Resolve violations and verify GREEN**

Run: `npm run test:a11y`
Expected: PASS with zero serious or critical violations on every listed route in light and dark themes.

- [ ] **Step 5: Commit**

```powershell
git add package.json package-lock.json playwright.config.js e2e/accessibility.spec.js client/src
git commit -m "test: enforce accessible ACCI workflows"
```

### Task 5: Final end-to-end acceptance and documentation

**Files:**
- Modify: `e2e/auth.spec.js`
- Modify: `e2e/reception.spec.js`
- Modify: `e2e/accounting.spec.js`
- Create: `e2e/exam-forms.spec.js`
- Modify: `e2e/extensions.spec.js`
- Modify: `README.md`
- Delete after all migrations: obsolete `client/README.md`

**Interfaces:**
- Documents setup, seed credentials through environment-safe references, quality commands, role routes, design-system structure, migration policy, and browser test prerequisites.
- Full browser suite covers login, logout, role denial, navigation, registration, payment, exam inspection, extension, and responsive drawer behavior.

- [ ] **Step 1: Add failing acceptance cases for any uncovered flow**

```js
test('reception completes registration without shell replacement', async ({ page }) => {
  await loginAs(page, 'reception');
  const shell = page.getByTestId('app-shell');
  await createRegistration(page, receptionFixture);
  await expect(page).toHaveURL(/\/tiepnhan/);
  await expect(shell).toBeVisible();
});
```

- [ ] **Step 2: Confirm RED for uncovered acceptance behavior**

Run: `npm run test:e2e`
Expected: at least the newly added case fails before its missing fixture/helper/behavior is completed.

- [ ] **Step 3: Complete deterministic fixtures and documentation**

Use route-level API fixtures for deterministic visual/interaction tests and retain one optional local-SQL smoke project for true API/database integration. Document exact commands and expected ports without committing passwords or `.env`.

- [ ] **Step 4: Run the final release gate**

```powershell
npm test
npm run test:e2e
npm run test:a11y
npm run lint
npm run build
npm run audit:prod
npm run db:smoke
```

Expected: every command exits `0`; browser console/network assertions are clean; desktop/mobile screenshots are approved; production asset output contains local fonts and SVG branding only.

- [ ] **Step 5: Commit**

```powershell
git add README.md e2e package.json package-lock.json client
git commit -m "docs: finalize ACCI modernization workflow"
```
