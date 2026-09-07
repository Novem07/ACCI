# ACCI Accounting Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the accounting queue and payment page with a paginated, auditable invoice workflow backed by one coherent checkout contract.

**Architecture:** The server exposes a paginated queue and a single checkout read model containing payment state and calculated quote. The client feature adapter formats no business values; domain components compose shared primitives and submit only payment method and validated invoice date.

**Tech Stack:** React 19, CSS Modules, Vitest, Testing Library, Express 5, Zod 4, mssql, SQL Server.

**Spec:** `docs/superpowers/specs/2026-09-08-acci-modernization-design.md`

## Global Constraints

- Monetary calculations remain server-owned and use VND integer values at the wire boundary.
- Invoice date is user-selectable but validated; registration identity, discount, total, status, and creator are server-owned.
- Lists use server pagination and URL-backed state.
- Preserve serializable transaction and duplicate-invoice protection.
- Every contract/behavior change uses red-green-refactor and a focused commit.

---

### Task 1: Paginated payment queue API

**Files:**
- Modify: `server/src/payments/payment.schema.js` to add `paymentListQuerySchema`
- Modify: `server/src/payments/payment.routes.js`
- Modify: `server/src/payments/payment.service.js`
- Modify: `server/test/payments.test.js`

**Interfaces:**
- `GET /api/payments?page=1&pageSize=20&query=&status=` returns `{ items, page, pageSize, totalItems, totalPages }`.
- Search covers registration ID, customer ID, and customer name; status is `paid` or `unpaid` at the API boundary.

- [ ] **Step 1: Write failing queue contract tests**

```js
test('returns a filtered payment page with numeric metadata', async () => {
  const response = await request(app).get('/api/payments?page=2&pageSize=10&query=KH&status=unpaid').set('Cookie', accountantCookie);
  assert.equal(response.status, 200);
  assert.equal(response.body.page, 2);
  assert.equal(response.body.pageSize, 10);
  assert.ok(Array.isArray(response.body.items));
});
```

- [ ] **Step 2: Confirm RED**

Run: `npm test --workspace server -- test/payments.test.js`
Expected: FAIL because the endpoint returns an unpaginated `payments` array.

- [ ] **Step 3: Implement parameterized count/page queries**

Map database invoice presence to API status `paid`/`unpaid`. Use the common pagination parser and parameterized filtering; never interpolate `query`, `status`, offset, or page size. Also return `payments: items` during migration so the existing queue remains compatible until Task 3 switches adapters.

- [ ] **Step 4: Verify GREEN**

Run: `npm test --workspace server -- test/payments.test.js test/pagination.test.js`
Expected: PASS for role restriction, filters, defaults, invalid queries, and metadata.

- [ ] **Step 5: Commit**

```powershell
git add server/src/payments server/test
git commit -m "refactor: paginate accounting queue"
```

### Task 2: Unified checkout read model and invoice-date validation

**Files:**
- Modify: `server/src/payments/payment.routes.js`
- Modify: `server/src/payments/payment.schema.js`
- Modify: `server/src/payments/payment.service.js`
- Modify: `server/test/payments.test.js`
- Modify: `server/test/api-contract.test.js`

**Interfaces:**
- Adds `GET /api/payments/:registrationId/checkout` returning `{ payment, quote }` from one service call.
- `getCheckout(registrationId) -> { payment, quote }` reuses one registration/customer aggregate where possible.
- `POST /api/payments/:registrationId/invoices` accepts `{ paymentMethod, invoiceDate }`; invoice date must be on or after the registration date and no later than today in `Asia/Ho_Chi_Minh`.

- [ ] **Step 1: Write failing checkout and date tests**

```js
test('returns payment and quote from one checkout request', async () => {
  const response = await request(app).get('/api/payments/PDK000001/checkout').set('Cookie', accountantCookie);
  assert.equal(response.status, 200);
  assert.equal(response.body.payment.registrationId, 'PDK000001');
  assert.equal(response.body.quote.currency, 'VND');
});

test('rejects an invoice date outside the operational range', async () => {
  const response = await request(app).post('/api/payments/PDK000001/invoices').set('Cookie', accountantCookie).send({ paymentMethod: 'Tiền mặt', invoiceDate: '2020-01-01' });
  assert.equal(response.status, 400);
});
```

- [ ] **Step 2: Confirm RED**

Run: `npm test --workspace server -- test/payments.test.js test/api-contract.test.js`
Expected: FAIL because checkout and bounded date validation do not exist.

- [ ] **Step 3: Implement checkout and injected-clock validation**

Pass `clock` into `createPaymentService`. Compare the parsed date with the checkout registration date and `toBusinessDate(clock())`; return `INVOICE_DATE_OUT_OF_RANGE` outside those inclusive boundaries. Keep amount/discount calculation solely in `quoteQuery` or its extracted aggregate helper.

- [ ] **Step 4: Verify GREEN and transaction tests**

Run: `npm test --workspace server -- test/payments.test.js test/api-contract.test.js`
Expected: PASS for checkout, date boundaries, duplicate invoice conflict, rollback, and role ownership.

- [ ] **Step 5: Commit**

```powershell
git add server/src/payments server/test
git commit -m "feat: expose validated payment checkout"
```

### Task 3: Accounting queue client

**Files:**
- Create: `client/src/features/payments/api.js`
- Create: `client/src/features/payments/PaymentQueuePage.jsx`
- Create: `client/src/features/payments/PaymentQueuePage.module.css`
- Create: `client/src/features/payments/PaymentQueuePage.test.jsx`
- Modify: `client/src/app/AppRouter.jsx`

**Interfaces:**
- `listPayments(params, { signal } = {}) -> Promise<Page<PaymentSummary>>`.
- Payment summary: `{ registrationId, customerId, customerName, organization, registrationDate, invoiceId, status }`.

- [ ] **Step 1: Write failing page behavior test**

```jsx
it('shows unpaid rows as actionable and paid rows as receipts', async () => {
  mockPayments([unpaidPayment, paidPayment]);
  renderRoute('/ketoan');
  expect(await screen.findByRole('link', { name: /Xử lý PDK000001/ })).toBeInTheDocument();
  expect(screen.getByText('Đã thanh toán')).toBeInTheDocument();
});
```

- [ ] **Step 2: Confirm RED**

Run: `npm test --workspace client -- PaymentQueuePage.test.jsx`
Expected: FAIL because the new feature page does not exist.

- [ ] **Step 3: Build the queue with shared primitives**

Use `Page`, `SearchToolbar`, `DataTable`, `StatusBadge`, and `Pagination`. Persist page/query/status in the URL and format all dates through `shared/format.js`.

- [ ] **Step 4: Verify GREEN**

Run: `npm test --workspace client -- PaymentQueuePage.test.jsx`
Expected: PASS for loading, error, empty, status filter, pagination, and row actions.

- [ ] **Step 5: Commit**

```powershell
git add client/src/features/payments client/src/app
git commit -m "feat: modernize accounting queue"
```

### Task 4: Payment checkout and receipt page

**Files:**
- Create: `client/src/features/payments/PaymentCheckoutPage.jsx`
- Create: `client/src/features/payments/PaymentCheckoutPage.module.css`
- Create: `client/src/features/payments/PaymentCheckoutPage.test.jsx`
- Modify: `client/src/features/payments/api.js`
- Modify: `client/src/app/AppRouter.jsx`
- Create: `e2e/accounting.spec.js`

**Interfaces:**
- `getCheckout(registrationId, { signal } = {}) -> Promise<{ payment, quote }>`.
- `createInvoice(registrationId, { paymentMethod, invoiceDate }) -> Promise<Invoice>`.

- [ ] **Step 1: Write failing checkout test**

```jsx
it('shows the server quote and becomes a read-only receipt after payment', async () => {
  renderCheckout('PDK000001', unpaidCheckout);
  expect(await screen.findByText(formatCurrency(900000))).toBeInTheDocument();
  await userEvent.selectOptions(screen.getByLabelText('Phương thức thanh toán'), 'Chuyển khoản');
  await userEvent.click(screen.getByRole('button', { name: 'Xác nhận thanh toán' }));
  expect(await screen.findByRole('status')).toHaveTextContent('Thanh toán thành công');
  expect(screen.getByRole('button', { name: 'Đã thanh toán' })).toBeDisabled();
});
```

- [ ] **Step 2: Confirm RED**

Run: `npm test --workspace client -- PaymentCheckoutPage.test.jsx`
Expected: FAIL because the checkout page/adapter do not exist.

- [ ] **Step 3: Implement grouped checkout and receipt states**

Render customer, registration, price, discount, and total sections. Use `formatCurrency`, a labelled native select/date input, disabled repeat submission, inline API error, success toast, and a stable paid receipt state.

- [ ] **Step 4: Verify GREEN and browser path**

Run: `npm test --workspace client -- PaymentCheckoutPage.test.jsx` and `npm run test:e2e -- --grep "accounting"`
Expected: PASS for quote, submit, duplicate protection, error, paid receipt, and keyboard operation.

- [ ] **Step 5: Commit**

```powershell
git add client/src/features/payments client/src/app e2e/accounting.spec.js
git commit -m "feat: rebuild payment checkout workflow"
```
