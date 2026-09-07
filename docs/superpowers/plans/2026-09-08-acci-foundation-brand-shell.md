# ACCI Foundation, Brand, and Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install the approved typography and logo system, establish leak-free global styling, and keep one authenticated application shell mounted across route navigation.

**Architecture:** Brand assets and semantic tokens form the only global visual foundation. React Router nested layouts own authentication, role checks, and the persistent shell; feature pages render through an `Outlet` and never instantiate their own shell.

**Tech Stack:** React 19, React Router 7, Vite 8, CSS Modules, Vitest, Testing Library, SVG, `@fontsource/be-vietnam-pro@5.3.0`.

**Spec:** `docs/superpowers/specs/2026-09-08-acci-modernization-design.md`

## Global Constraints

- Node.js remains `>=22.14 <23`; React, Vite, Express, and SQL Server are retained.
- Bundle local Be Vietnam Pro weights 400, 500, 600, and 700 through `@fontsource/be-vietnam-pro@5.3.0` and use the approved Professional Navy tokens.
- No large UI framework, runtime font request, global page selector, or `!important` declaration.
- Desktop targets are 1366x768 and 1920x1080; essential navigation works at 390x844.
- All behavior changes use red-green-refactor and focused commits.

---

### Task 1: Brand assets and component

**Files:**
- Modify: `client/package.json`
- Modify: `package-lock.json`
- Create: `client/public/brand/acci-mark.svg`
- Create: `client/public/brand/acci-logo-horizontal.svg`
- Create: `client/public/brand/acci-logo-mono.svg`
- Create: `client/public/brand/favicon.svg`
- Create: `client/src/ui/brand/BrandLogo.jsx`
- Create: `client/src/ui/brand/BrandLogo.module.css`
- Create: `client/src/ui/brand/BrandLogo.test.jsx`
- Modify: `client/index.html`

**Interfaces:**
- Produces: `BrandLogo({ compact = false, monochrome = false, className = '', decorative = false })`.
- Produces: SVG assets whose viewBoxes do not crop at 16px, 32px, or horizontal sidebar sizes.

- [ ] **Step 1: Write the failing component test**

```jsx
it('renders the compact mark without redundant accessible text', () => {
  render(<BrandLogo compact decorative />);
  expect(screen.getByTestId('brand-logo')).toHaveAttribute('aria-hidden', 'true');
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
});

it('renders the product name for a non-decorative full logo', () => {
  render(<BrandLogo />);
  expect(screen.getByRole('img', { name: 'ACCI Center' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test and confirm RED**

Run: `npm test --workspace client -- BrandLogo.test.jsx`
Expected: FAIL because `BrandLogo.jsx` does not exist.

- [ ] **Step 3: Create the SVG set and minimal component**

```jsx
const sources = {
  full: '/brand/acci-logo-horizontal.svg',
  mark: '/brand/acci-mark.svg',
  mono: '/brand/acci-logo-mono.svg',
};

export default function BrandLogo({ compact = false, monochrome = false, className = '', decorative = false }) {
  const src = monochrome ? sources.mono : compact ? sources.mark : sources.full;
  return <img data-testid="brand-logo" className={className} src={src} alt={decorative ? '' : 'ACCI Center'} aria-hidden={decorative || undefined} />;
}
```

Run `npm install --workspace client @fontsource/be-vietnam-pro@5.3.0`. Set `client/index.html` favicon to `/brand/favicon.svg`, theme color to `#17233B`, and Vietnamese description to `Hệ thống quản lý chứng chỉ ACCI Center`.

- [ ] **Step 4: Verify GREEN and inspect SVGs**

Run: `npm test --workspace client -- BrandLogo.test.jsx`
Expected: PASS. Open each SVG directly and confirm clear rendering on light/dark backgrounds at its intended size.

- [ ] **Step 5: Commit**

```powershell
git add client/public/brand client/src/ui/brand client/index.html client/package.json package-lock.json
git commit -m "feat: add ACCI brand assets"
```

### Task 2: Semantic tokens and global reset

**Files:**
- Rewrite: `client/src/styles/tokens.css`
- Create: `client/src/styles/reset.css`
- Create: `client/src/styles/utilities.css`
- Modify: `client/src/index.jsx`
- Test: `client/src/styles/styles.test.jsx`

**Interfaces:**
- Produces: CSS variables prefixed `--color-`, `--font-`, `--space-`, `--radius-`, `--shadow-`, `--duration-`, and `--z-`.
- Produces: `.srOnly` accessibility utility and `.tabularNumbers` numeric utility.

- [ ] **Step 1: Write a failing stylesheet contract test**

```jsx
it('loads the approved visual tokens without legacy overrides', async () => {
  const css = await import('./tokens.css?raw').then((module) => module.default);
  expect(css).toContain('--color-action-primary: #356AE6');
  expect(css).toContain('--font-family-sans: "Be Vietnam Pro"');
  expect(css).not.toContain('!important');
});
```

- [ ] **Step 2: Confirm RED**

Run: `npm test --workspace client -- styles.test.jsx`
Expected: FAIL because the approved variables and test file do not exist.

- [ ] **Step 3: Implement tokens/reset and import order**

```css
:root {
  --color-brand-navy: #17233B;
  --color-action-primary: #356AE6;
  --color-canvas: #F5F7FA;
  --color-surface: #FFFFFF;
  --color-text-primary: #172033;
  --color-text-secondary: #667085;
  --color-border: #DCE2EA;
  --font-family-sans: "Be Vietnam Pro", "Segoe UI", Arial, sans-serif;
}
```

Import `@fontsource/be-vietnam-pro/400.css`, `500.css`, `600.css`, and `700.css` from `index.jsx`, followed by `tokens.css`, `reset.css`, then `utilities.css`. Apply the dark token set under `html[data-theme='dark']`.

- [ ] **Step 4: Verify styles and build**

Run: `npm test --workspace client -- styles.test.jsx` and `npm run build`
Expected: PASS and production build exits `0`.

- [ ] **Step 5: Commit**

```powershell
git add client/src/styles client/src/index.jsx
git commit -m "refactor: establish semantic visual tokens"
```

### Task 3: Persistent nested route shell

**Files:**
- Create: `client/src/app/routes.js`
- Create: `client/src/app/AppRouter.jsx`
- Move/modify: `client/src/components/AppShell.jsx` to `client/src/app/AppShellLayout.jsx`
- Create: `client/src/app/AppShellLayout.module.css`
- Modify: `client/src/App.jsx`
- Modify: `client/src/auth/ProtectedRoute.jsx`
- Modify: `client/src/auth/RoleRoute.jsx`
- Test: `client/src/app/AppRouter.test.jsx`

**Interfaces:**
- Produces: `ROLES`, `PATHS`, and `navigationByRole` from `app/routes.js`.
- Produces: `ProtectedRoute()` and `RoleRoute({ roles })` as `<Outlet />` guards.
- Produces: `AppShellLayout()` with one `<Outlet />` content boundary.
- Produces: stable `data-testid="app-shell"` and `data-testid="app-content"` browser-test boundaries.

- [ ] **Step 1: Write the failing persistence test**

```jsx
it('keeps the same shell node while navigating between authenticated pages', async () => {
  render(<AppRouter initialEntries={['/home']} />);
  const shell = screen.getByTestId('app-shell');
  await userEvent.click(screen.getByRole('link', { name: 'Phiếu đăng ký' }));
  expect(screen.getByTestId('app-shell')).toBe(shell);
});
```

- [ ] **Step 2: Confirm RED**

Run: `npm test --workspace client -- AppRouter.test.jsx`
Expected: FAIL because routes currently mount an `AppShell` inside each page.

- [ ] **Step 3: Implement nested routes and one shell**

```jsx
<Route element={<ProtectedRoute />}>
  <Route element={<AppShellLayout />}>
    <Route path={PATHS.home} element={<HomePage />} />
    <Route element={<RoleRoute roles={[ROLES.reception]} />}>
      <Route path={PATHS.registrations} element={<ViewRegisterPage />} />
      <Route path={PATHS.registrationCreate} element={<CreateRegisterPage />} />
    </Route>
  </Route>
</Route>
```

Remove every page-level `<AppShell>` wrapper. Apply theme before paint using a short inline script in `index.html`; `AppShellLayout` only updates `data-theme` after user interaction.

- [ ] **Step 4: Verify route behavior**

Run: `npm test --workspace client -- AppRouter.test.jsx AppShell.test.jsx`
Expected: PASS; unauthorized roles redirect to `/home`; the shell element identity remains unchanged.

- [ ] **Step 5: Commit**

```powershell
git add client/src/app client/src/auth client/src/components client/src/pages client/src/App.jsx client/index.html
git commit -m "refactor: persist authenticated application shell"
```

### Task 4: Foundation browser regression coverage

**Files:**
- Modify: `client/package.json`
- Modify: `package.json`
- Create: `playwright.config.js`
- Create: `e2e/helpers/mock-api.js`
- Create: `e2e/shell.spec.js`

**Interfaces:**
- Produces: `npm run test:e2e` and `installMockApi(page, { user, responses })`.

- [ ] **Step 1: Add a browser test that detects shell replacement and paint gaps**

```js
test('navigation keeps the shell and painted content background', async ({ page }) => {
  await installMockApi(page, { user: receptionUser, responses: registrationResponses });
  await page.goto('/home');
  const shell = page.getByTestId('app-shell');
  await shell.getByRole('link', { name: 'Lập phiếu đăng ký' }).click();
  await expect(shell).toBeVisible();
  await expect(page.getByTestId('app-content')).toHaveCSS('background-color', 'rgb(245, 247, 250)');
});
```

- [ ] **Step 2: Confirm RED before configuration**

Run: `npm run test:e2e`
Expected: FAIL because Playwright/config/scripts do not exist.

- [ ] **Step 3: Install and configure Playwright**

Run: `npm install --save-dev @playwright/test` and `npx playwright install chromium`. Configure desktop Chrome at 1366x768 and mobile Chrome at 390x844; use Vite's dev server and deterministic mocked API responses for foundation tests.

- [ ] **Step 4: Verify browser tests and all foundation gates**

Run: `npm run test:e2e`, `npm test`, `npm run lint`, and `npm run build`
Expected: all exit `0`; screenshots contain the persistent navy shell and no white content frame.

- [ ] **Step 5: Commit**

```powershell
git add package.json package-lock.json client/package.json playwright.config.js e2e
git commit -m "test: cover persistent shell navigation"
```
