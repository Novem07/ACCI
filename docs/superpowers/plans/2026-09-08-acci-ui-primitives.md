# ACCI UI Primitives Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the small, accessible UI vocabulary used by every migrated ACCI workflow.

**Architecture:** Each primitive is behavior-light, domain-independent, styled with a colocated CSS Module, and exported through `ui/index.js`. Domain pages compose these primitives and never override their internals.

**Tech Stack:** React 19, CSS Modules, Vitest, Testing Library, user-event.

**Spec:** `docs/superpowers/specs/2026-09-08-acci-modernization-design.md`

## Global Constraints

- Consume only semantic tokens from the foundation plan.
- Visible copy is Vietnamese; public component props and API wire keys use English names.
- Keyboard focus must remain visible; status cannot be conveyed by color alone.
- Touch targets are at least 40x40px and motion respects `prefers-reduced-motion`.
- No large UI framework, global page selector, or `!important` declaration.
- Every behavior change uses red-green-refactor and a focused commit.

---

### Task 1: Action primitives

**Files:**
- Create: `client/src/ui/actions/Button.jsx`
- Create: `client/src/ui/actions/Button.module.css`
- Create: `client/src/ui/actions/Button.test.jsx`
- Create: `client/src/ui/actions/IconButton.jsx`
- Create: `client/src/ui/icons/Icon.jsx`
- Create: `client/src/ui/icons/Icon.test.jsx`
- Modify: `client/src/ui/index.js`

**Interfaces:**
- Produces: `Button({ variant = 'primary', size = 'md', loading = false, disabled, children, ...buttonProps })`.
- Produces: `IconButton({ label, size = 'md', children, ...buttonProps })`.
- Produces: `Icon({ name, size = 20, decorative = true, title })` from a finite internal SVG path map.
- Allowed variants: `primary`, `secondary`, `quiet`, `danger`.

- [ ] **Step 1: Write failing action-state tests**

```jsx
it('prevents repeat submission while loading', async () => {
  const onClick = vi.fn();
  render(<Button loading onClick={onClick}>Lưu</Button>);
  expect(screen.getByRole('button', { name: /Đang xử lý/ })).toBeDisabled();
  await userEvent.click(screen.getByRole('button'));
  expect(onClick).not.toHaveBeenCalled();
});

it('requires an accessible name for icon-only actions', () => {
  render(<IconButton label="Đóng">×</IconButton>);
  expect(screen.getByRole('button', { name: 'Đóng' })).toBeInTheDocument();
});

it('hides decorative icons from assistive technology', () => {
  render(<Icon name="search" />);
  expect(screen.getByTestId('icon-search')).toHaveAttribute('aria-hidden', 'true');
});
```

- [ ] **Step 2: Confirm RED**

Run: `npm test --workspace client -- Button.test.jsx Icon.test.jsx`
Expected: FAIL because the action components do not exist.

- [ ] **Step 3: Implement the public variants and loading label**

```jsx
export function Button({ variant = 'primary', size = 'md', loading = false, disabled, children, ...props }) {
  return <button {...props} className={`${styles.button} ${styles[variant]} ${styles[size]}`} disabled={disabled || loading} aria-busy={loading || undefined}>{loading ? 'Đang xử lý…' : children}</button>;
}
```

Use a 40px default height, 8px radius, and semantic action/status tokens. Danger is reserved for destructive actions.

- [ ] **Step 4: Verify GREEN**

Run: `npm test --workspace client -- Button.test.jsx Icon.test.jsx`
Expected: PASS with no accessibility warnings.

- [ ] **Step 5: Commit**

```powershell
git add client/src/ui
git commit -m "feat: add accessible action primitives"
```

### Task 2: Form primitives

**Files:**
- Create: `client/src/ui/forms/FormField.jsx`
- Create: `client/src/ui/forms/FormField.module.css`
- Create: `client/src/ui/forms/TextInput.jsx`
- Create: `client/src/ui/forms/Select.jsx`
- Create: `client/src/ui/forms/RadioGroup.jsx`
- Create: `client/src/ui/forms/FormField.test.jsx`
- Modify: `client/src/ui/index.js`

**Interfaces:**
- Produces: `FormField({ id, label, hint, error, required, children })` using `aria-describedby`.
- Produces: native-control wrappers `TextInput`, `Select`, and `RadioGroup` that forward refs and HTML attributes.

- [ ] **Step 1: Write failing field association tests**

```jsx
it('associates label, hint, and error with the native input', () => {
  render(<FormField id="phone" label="Số điện thoại" hint="10 chữ số" error="Không hợp lệ" required><TextInput id="phone" /></FormField>);
  const input = screen.getByLabelText(/Số điện thoại/);
  expect(input).toHaveAttribute('aria-invalid', 'true');
  expect(input.getAttribute('aria-describedby')).toMatch(/phone-hint/);
  expect(input.getAttribute('aria-describedby')).toMatch(/phone-error/);
});
```

- [ ] **Step 2: Confirm RED**

Run: `npm test --workspace client -- FormField.test.jsx`
Expected: FAIL because form primitives do not exist.

- [ ] **Step 3: Implement native accessible controls**

Use `React.cloneElement(children, { id, required, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy })`. Do not hide labels or replace native select/radio semantics.

- [ ] **Step 4: Verify GREEN**

Run: `npm test --workspace client -- FormField.test.jsx`
Expected: PASS for normal, required, hinted, invalid, and disabled cases.

- [ ] **Step 5: Commit**

```powershell
git add client/src/ui/forms client/src/ui/index.js
git commit -m "feat: add form field primitives"
```

### Task 3: Feedback and dialog primitives

**Files:**
- Create: `client/src/ui/feedback/Alert.jsx`
- Create: `client/src/ui/feedback/LoadingState.jsx`
- Create: `client/src/ui/feedback/EmptyState.jsx`
- Create: `client/src/ui/feedback/Dialog.jsx`
- Create: `client/src/ui/feedback/ToastProvider.jsx`
- Create: `client/src/ui/feedback/feedback.module.css`
- Create: `client/src/ui/feedback/Dialog.test.jsx`
- Modify: `client/src/ui/index.js`

**Interfaces:**
- Produces: `Alert({ tone, title, children })`, `LoadingState({ label })`, and `EmptyState({ title, description, action })`.
- Produces: `Dialog({ open, title, description, onClose, children, footer })` with Escape and focus restoration.
- Produces: `useToast().notify({ tone, title, message })` and one polite live region.

- [ ] **Step 1: Write failing dialog behavior tests**

```jsx
it('moves focus into the dialog and restores it on Escape', async () => {
  render(<DialogHarness />);
  const trigger = screen.getByRole('button', { name: 'Mở' });
  await userEvent.click(trigger);
  expect(screen.getByRole('dialog')).toContainElement(document.activeElement);
  await userEvent.keyboard('{Escape}');
  expect(trigger).toHaveFocus();
});
```

- [ ] **Step 2: Confirm RED**

Run: `npm test --workspace client -- Dialog.test.jsx`
Expected: FAIL because `Dialog` does not exist.

- [ ] **Step 3: Implement feedback semantics**

Use the native `<dialog>` element where supported by jsdom/browser tests, call `showModal()` only when `open` changes to true, and preserve the trigger element before opening. `LoadingState` uses `role="status"`; error alerts use `role="alert"`.

- [ ] **Step 4: Verify GREEN**

Run: `npm test --workspace client -- Dialog.test.jsx`
Expected: PASS for open, Escape, close button, focus restoration, and accessible title.

- [ ] **Step 5: Commit**

```powershell
git add client/src/ui/feedback client/src/ui/index.js
git commit -m "feat: add shared feedback primitives"
```

### Task 4: Page and data-display primitives

**Files:**
- Create: `client/src/ui/layout/Page.jsx`
- Create: `client/src/ui/layout/Page.module.css`
- Create: `client/src/ui/layout/Card.jsx`
- Create: `client/src/ui/data/DataTable.jsx`
- Create: `client/src/ui/data/DataTable.module.css`
- Create: `client/src/ui/data/StatusBadge.jsx`
- Create: `client/src/ui/data/Pagination.jsx`
- Create: `client/src/ui/data/SearchToolbar.jsx`
- Create: `client/src/ui/data/DataTable.test.jsx`
- Modify: `client/src/ui/index.js`

**Interfaces:**
- Produces: `Page({ title, description, actions, children })` and `Card({ as = 'section', children })`.
- Produces: `DataTable({ label, columns, rows, getRowKey, renderRow })` with a narrow-screen scroll container.
- Produces: `StatusBadge({ tone, children })`, `Pagination({ page, totalPages, onPageChange })`, and `SearchToolbar({ query, onQueryChange, children })`.

- [ ] **Step 1: Write failing table/pagination tests**

```jsx
it('labels the table and prevents pagination outside the valid range', async () => {
  const onPageChange = vi.fn();
  render(<><DataTable label="Phiếu đăng ký" columns={['Mã']} rows={[]} getRowKey={row => row.id} renderRow={() => null} /><Pagination page={1} totalPages={3} onPageChange={onPageChange} /></>);
  expect(screen.getByRole('table', { name: 'Phiếu đăng ký' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Trang trước' })).toBeDisabled();
});
```

- [ ] **Step 2: Confirm RED**

Run: `npm test --workspace client -- DataTable.test.jsx`
Expected: FAIL because data-display primitives do not exist.

- [ ] **Step 3: Implement layout/data primitives**

Render a real `<table>` with `<caption className="srOnly">`, `<thead>`, and caller-provided rows. Pagination labels include current/total pages and disabled boundaries. Search uses a native search input with a visible label.

- [ ] **Step 4: Verify GREEN and primitive suite**

Run: `npm test --workspace client -- src/ui`
Expected: every primitive test passes.

- [ ] **Step 5: Commit**

```powershell
git add client/src/ui
git commit -m "feat: add page and data primitives"
```

### Task 5: Branded login and authentication feedback

**Files:**
- Create: `client/src/features/auth/LoginPage.jsx`
- Create: `client/src/features/auth/LoginPage.module.css`
- Create: `client/src/features/auth/LoginPage.test.jsx`
- Modify: `client/src/auth/AuthContext.jsx`
- Modify: `client/src/app/AppRouter.jsx`
- Create: `e2e/auth.spec.js`

**Interfaces:**
- `LoginPage()` uses `location.state.from` as the successful destination when present, otherwise `getLandingPath(user.role)` from the route registry.
- Authentication errors render as inline `Alert`; submit uses `Button loading` and remains disabled until the request settles.

- [ ] **Step 1: Write failing redirect and feedback tests**

```jsx
it('returns the user to the requested protected route after login', async () => {
  renderLogin({ state: { from: '/giahan' } });
  await userEvent.type(screen.getByLabelText('Mã nhân viên'), 'NV001');
  await userEvent.type(screen.getByLabelText('Mật khẩu'), 'secret');
  await userEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));
  expect(screen.getByTestId('location')).toHaveTextContent('/giahan');
});

it('shows a failed login inline without opening a dialog', async () => {
  mockLoginFailure();
  renderLogin();
  await submitCredentials();
  expect(await screen.findByRole('alert')).toHaveTextContent('Sai tài khoản hoặc mật khẩu');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Confirm RED**

Run: `npm test --workspace client -- LoginPage.test.jsx`
Expected: FAIL because the current login always chooses a role route and uses `WarningModal`.

- [ ] **Step 3: Implement the branded login**

Compose `BrandLogo`, `FormField`, `TextInput`, `Button`, and `Alert`. Preserve the password reveal action with `IconButton`, use `autocomplete="username"` and `autocomplete="current-password"`, and never trim password input.

- [ ] **Step 4: Verify GREEN and responsive rendering**

Run: `npm test --workspace client -- LoginPage.test.jsx AuthContext.test.jsx` and `npm run test:e2e -- --grep "login"`
Expected: PASS for requested-route redirect, role fallback, pending submit, bad credentials, password reveal, and 390x844 layout.

- [ ] **Step 5: Commit**

```powershell
git add client/src/features/auth client/src/auth client/src/app e2e/auth.spec.js
git commit -m "feat: rebuild branded login experience"
```
