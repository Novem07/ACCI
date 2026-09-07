# ACCI Product Modernization Design

**Date:** 2026-09-08  
**Status:** Approved design direction  
**Product:** ACCI Center certificate-management workspace

## 1. Objective

Modernize ACCI into a professional, calm, trustworthy internal workspace for a training and certification center. The result must be visually coherent, fast on the Windows desktops used at the center, usable for essential tasks on tablet/mobile, and easier to maintain across frontend, API, and SQL Server layers.

The work is an incremental modernization, not a replacement project. Every slice must leave the application runnable, tested, and independently reversible.

## 2. Approved Direction

- Brand personality: professional, refined, trustworthy.
- Logo: geometric `A` monogram plus the `ACCI Center` wordmark.
- Delivery: migrate one complete workflow at a time.
- Scope: business flows and API contracts may change when the audit demonstrates a usability, correctness, or performance problem.
- Primary device: Windows desktop; tablet and mobile retain all essential operations.
- UI implementation: React and Vite with a lightweight in-house design system. Do not introduce a large component framework.

## 3. Success Criteria

### Visual and interaction quality

- Every public and authenticated route uses the same typography, spacing, color, icon, feedback, and focus conventions.
- Navigation between authenticated routes keeps the application shell mounted, with no white flash or layout jump.
- Normal text and interactive controls meet WCAG 2.2 AA contrast: 4.5:1 for normal text and 3:1 for large text and non-text UI boundaries.
- Desktop layouts are designed for 1366x768 and 1920x1080 viewports. Essential flows remain complete at 390x844.
- Loading, empty, error, success, disabled, and submitting states are explicit and do not replace the surrounding page layout.

### Maintainability

- No page stylesheet targets global `body`, heading, table, input, or button selectors.
- No compatibility override sheet and no `!important` declarations remain in application styles.
- Shared UI behavior lives in focused primitives rather than duplicated page CSS.
- Each domain page consumes normalized English-keyed API models; components do not fall back between SQL column names and API names.
- Role names, route paths, status values, and date/currency formatting are centralized.

### Reliability and performance

- Existing backend contract tests continue to pass during migration; intentional contract changes receive new tests before implementation.
- Critical flows have browser-level coverage: login, role navigation, registration creation, payment, exam-form inspection, and extension submission.
- Production dependencies have no high-severity audit findings.
- The 1.3 MB raster brand image is removed. The complete SVG logo set stays below 50 KB.
- Route-level code splitting is introduced without flashing the shell. Font and brand assets are local and do not depend on third-party runtime requests.

## 4. Brand System

### Typography

Use **Be Vietnam Pro** as the single product family. It is a neo-grotesk family designed with refined Vietnamese letterforms and is suitable for technology-oriented products. Self-host one variable WOFF2 file covering weights 400 through 700, with the fallback stack:

```css
font-family: "Be Vietnam Pro", "Segoe UI", Arial, sans-serif;
```

Typography roles:

| Role | Size / line-height | Weight |
| --- | --- | --- |
| Display | `32px / 40px` | 700 |
| Page title | `24px / 32px` | 700 |
| Section title | `18px / 26px` | 600 |
| Body | `14px / 22px` | 400 |
| Label/button | `14px / 20px` | 600 |
| Supporting text | `12px / 18px` | 400–500 |

Use tabular numerals for identifiers, dates, counts, and money. Avoid uppercase Vietnamese copy except short navigation captions.

Reference: [Be Vietnam Pro on Google Fonts](https://fonts.google.com/specimen/Be+Vietnam+Pro).

### Color roles

Colors are consumed only through semantic tokens. Pages must not own raw brand or status colors.

#### Light theme

| Token | Value | Use |
| --- | --- | --- |
| `brand.navy` | `#17233B` | Sidebar and primary brand field |
| `action.primary` | `#356AE6` | Primary button, link, active state |
| `canvas` | `#F5F7FA` | Application background |
| `surface` | `#FFFFFF` | Cards, forms, tables |
| `surface.subtle` | `#EEF2F7` | Hover, selected-neutral, table header |
| `text.primary` | `#172033` | Main content |
| `text.secondary` | `#667085` | Supporting content |
| `border` | `#DCE2EA` | Dividers and control boundaries |
| `status.success` | `#17875F` | Success messaging |
| `status.warning` | `#B45309` | Warnings and pending states |
| `status.danger` | `#C2413B` | Destructive actions and errors |

White text on `action.primary` has a 4.82:1 contrast ratio. Primary and secondary text on their intended surfaces meet or exceed 4.5:1.

#### Dark theme

| Token | Value |
| --- | --- |
| `canvas` | `#0F172A` |
| `surface` | `#182338` |
| `surface.subtle` | `#22304A` |
| `text.primary` | `#F4F7FB` |
| `text.secondary` | `#AAB4C3` |
| `border` | `#2C3A52` |
| `action.primary` | `#82A7FF` |

Dark mode is supported, but light mode remains the default. Theme selection is applied before React paints to avoid a theme flash.

References: [Material Design color roles](https://m3.material.io/styles/color/roles) and [WCAG 2.2 contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

### Logo system

Create the brand as native SVG, not AI-generated raster artwork:

- `acci-mark.svg`: rounded-square geometric `A`; its negative-space crossbar forms a subtle check mark representing validation and certification.
- `acci-logo-horizontal.svg`: mark plus `ACCI Center` wordmark.
- `acci-logo-mono.svg`: one-color form for print and constrained contexts.
- `favicon.svg`: simplified mark that remains recognizable at 16px.

The mark uses navy and blue, has no gradients at favicon size, works on light and dark surfaces, and never embeds body copy. Replace `LogoACCI.png`, Create React App sample icons, and the temporary CSS letter mark only after all references have migrated.

## 5. Information Architecture and Application Shell

Use a persistent nested route layout:

```text
BrowserRouter
├── Public routes
│   └── Login
└── AuthenticatedRoute
    └── AppShellLayout
        ├── Dashboard
        ├── Reception workflows
        ├── Accounting workflows
        ├── Exam organization workflows
        ├── Data-entry workflows
        └── Proctor workflows
```

`AppShellLayout` owns the sidebar, top bar, footer, theme, responsive navigation, and an `<Outlet />`. Pages render only page content. Role gates become nested route guards and do not wrap every page in a new shell. This keeps navigation stable and removes the architectural source of route flashes.

The desktop sidebar remains 240–248px wide. On screens below 820px it becomes a modal drawer with a scrim, Escape handling, focus return, and scroll lock. The header contains page context, theme control, user identity, and logout. Navigation is generated from one role-aware route registry.

Unsupported role areas currently represented by placeholder headings receive an honest empty-state page describing that the module is not yet available; they must not appear as functioning workflows.

## 6. Frontend Structure

### Styling boundaries

Use CSS Modules for components and pages, plus three global files:

```text
client/src/styles/
├── tokens.css       # semantic colors, typography, spacing, radii, shadows, z-index
├── reset.css        # box sizing, body defaults, reduced-motion behavior
└── utilities.css    # a very small set of accessibility/layout helpers
```

Component and page styles use `*.module.css`. Delete `design.css`, unused `App.css`, global page selectors, and obsolete page styles as their owners migrate. Use a 4px spacing base with named tokens from 4px to 48px. Radius, shadow, transition, and z-index values are tokens.

### Shared UI primitives

Create focused primitives with documented props and tests:

- Brand: `BrandLogo` and `BrandMark`.
- Actions: `Button`, `IconButton`, and `LinkButton` with primary, secondary, quiet, and danger variants.
- Forms: `FormField`, `TextInput`, `Select`, and `RadioGroup` with label, hint, required, invalid, and disabled states.
- Feedback: `Alert`, `ToastRegion`, `LoadingState`, `EmptyState`, and an accessible `Dialog` replacing `WarningModal`.
- Layout: `Page`, `PageHeader`, `Section`, `Card`, and `Stack`.
- Data: `DataTable`, `StatusBadge`, `Pagination`, and `SearchToolbar`.

Primitives do not contain domain decisions. Domain components compose them.

### Data and domain boundaries

Split the client by domain while retaining the current repository shape:

```text
client/src/
├── app/             # router, route registry, providers
├── auth/            # session provider and route guards
├── api/             # transport, cancellation, error normalization
├── ui/              # shared design-system primitives
├── features/
│   ├── registrations/
│   ├── customers/
│   ├── payments/
│   ├── exam-forms/
│   └── extensions/
├── shared/          # roles, statuses, formatting, validation helpers
└── styles/
```

Each feature owns its API adapter, hooks, components, page, styles, and tests. The generic API client accepts `AbortSignal`, handles 204 responses, and emits one normalized `ApiError`. Feature adapters map wire models to UI models once.

Do not add a remote-state framework in this iteration. The dataset and interaction model do not justify a large dependency. Small feature hooks handle loading, abort, retry, and mutation state; list search and pagination live in the URL so refresh/back navigation preserve context.

## 7. Workflow Designs

### Login

- Compact two-column desktop card and one-column mobile layout.
- Horizontal ACCI logo, concise product description, visible labels, password reveal, submitting state, and inline authentication error.
- Redirect to the original protected destination after successful login; otherwise use the role landing route.
- Remove the generic warning modal from authentication failures.

### Dashboard

- Greeting, role badge, and compact task cards sourced from the route registry.
- Show only actions the user can perform.
- Avoid decorative metrics until real backend metrics exist.

### Reception: registration list

- Page header with primary “Lập phiếu đăng ký” action.
- Search by registration/customer identifier and filter by status.
- Server-side pagination with URL-backed query parameters.
- Consistent status badges and row action menu.

### Reception: create registration

Optimize for rapid desktop entry without turning the form into a multi-screen wizard:

1. Search/select an existing customer or open the new-customer form.
2. Add candidates in a focused form with explicit labels and field-level validation.
3. Review candidates in a compact table, with edit/remove actions.
4. Submit from a sticky summary bar showing customer, candidate count, and validation status.

Split the current 207-line page into `CustomerSelector`, `CustomerForm`, `CandidateEditor`, `CandidateTable`, and `RegistrationSummary`. Unsaved input receives a leave-page confirmation. Submission is idempotent at the UI level by disabling repeat actions and at the API level through transactional invariants.

### Accounting

- Paginated payment queue with search and status filter.
- Processing page groups customer, registration, quote, discount, and final total into clear sections.
- VND values use `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })`.
- Invoice creation provides a success confirmation and a stable read-only receipt state.

### Exam forms and extensions

- Exam-form list supports server-side search and pagination already exposed by the API.
- Detail page uses a definition-list card rather than loose paragraphs.
- Extension selection shows current schedule and compares eligible schedules in a table. Full schedules or schedules inside the 24-hour cutoff are disabled with a reason.
- Loading/error states remain inside the persistent page frame.

## 8. API and Backend Modernization

The current Express service structure is sound and remains CommonJS. Refactoring focuses on repeated boundaries, query efficiency, and clearer contracts.

### Shared boundaries

- Centralize role strings and workflow status values in server constants.
- Add reusable Zod validation middleware for body, path, and query input.
- Add a small async route wrapper or rely consistently on Express 5 rejected-promise handling; remove repeated route-level `try/catch` blocks only after contract tests prove identical errors.
- Return the existing named resource envelopes to avoid unnecessary churn. Paginated list endpoints use the common shape `{ items, page, pageSize, totalItems, totalPages }`.
- Validate all identifiers and pagination before a database request.
- Add a request ID to error logs and responses for support diagnostics without exposing stack traces.

### Correctness changes

- Make registration creation date server-owned; the browser must not decide `registrationDate`.
- Keep invoice date user-selectable because it is an accounting input, but validate it against the allowed operational date range.
- Treat role and status values as exact domain constants, while display labels remain Vietnamese.
- Normalize all API output fields to English names. Remove client fallbacks such as `MaKhachHang || id`.
- Preserve database transactions and row locks for registration, payment, exam issuance, and extension operations.

### Query optimization

- Add server-side pagination and search to customers, registrations, payments, and candidates. Do not load 100 rows merely to filter in the browser.
- Replace registration certificate validation inside the candidate loop with one set-based certificate lookup before inserts.
- Replace exam issuance duplicate/schedule checks inside the assignment loop with set-based validation, while retaining locked capacity updates inside the transaction.
- Inspect SQL Server execution plans for the migrated list/search queries before adding indexes. Add migrations only for indexes supported by measured query patterns.
- Check affected-row counts for seat and status updates so concurrent changes fail explicitly rather than silently creating inconsistent state.

### Database policy

- Existing data remains intact; every schema/index change is an additive numbered migration.
- Never edit an already-applied migration.
- Migrations run through UTF-8-safe scripts and receive a smoke assertion.
- API migrations land with backward-compatible server behavior first, then the frontend switches, then obsolete compatibility paths are removed in a later commit.

## 9. Accessibility and Interaction Rules

- Every input has a persistent visible label; placeholders are examples, not labels.
- Focus rings remain visible and use the brand focus token.
- Dialogs trap focus, close on Escape where safe, label their title, and restore focus to the trigger.
- Sidebar drawer and menus are keyboard operable.
- Status is never communicated by color alone.
- Loading animation respects `prefers-reduced-motion`; route and component transitions are limited to opacity/color/transform under 200ms.
- Tables expose captions or associated headings and remain horizontally scrollable at narrow widths.
- Touch targets are at least 40x40px on mobile.

## 10. Testing and Quality Gates

### Automated tests

- Keep Vitest/Testing Library for components and feature behavior.
- Add contract tests before each intentional API change.
- Add SQL service tests for transaction rollback, set-based validation, concurrent seat/status guards, and pagination validation.
- Add Playwright as a development-only browser test runner for the six critical flows and desktop/mobile smoke viewports.
- Add accessibility assertions to shared primitives and run an automated accessibility scan on login, dashboard, registration, and payment pages.

### Required checks per migration slice

```powershell
npm test
npm run lint
npm run build
npm run audit:prod
npm run db:smoke
```

Browser verification checks console errors, failed network requests, keyboard navigation, layout at 1366x768 and 390x844, theme persistence, and route transitions under throttled network conditions.

## 11. Delivery Slices

The modernization is split into independently reviewable programs:

1. **Foundation and brand:** local font, SVG logo set, semantic tokens, reset, route constants, persistent shell, and baseline browser tests.
2. **UI primitives:** buttons, fields, feedback, page layout, tables, dialog, and accessibility tests.
3. **Reception workflow:** registration list and creation flow, customer/registration API pagination, normalized models, and query optimization.
4. **Accounting workflow:** queue, quote, invoice flow, formatting, validation, and API contract cleanup.
5. **Exam and extension workflow:** lists, details, schedule comparison, set-based issuance validation, and concurrency guards.
6. **Remaining roles and cleanup:** intentional empty states, remove legacy CSS/assets/dependencies, route lazy loading, documentation, and final performance/accessibility audit.

Each slice follows test-first development, ends with all quality gates green, and is committed separately. A later slice must not be required to make an earlier slice usable.

## 12. Rollout and Rollback

- Work on a dedicated modernization branch or worktree.
- Keep commits aligned to the delivery slices and avoid mixed frontend/backend changes outside the active workflow.
- For API changes, deploy compatibility first and remove old behavior only after the migrated UI passes browser tests.
- Database migrations are additive and receive explicit down/compensating instructions when reversal cannot be automatic.
- Retain the previous logo and styles in Git history rather than parallel runtime feature flags.
- If a slice fails acceptance, revert that slice's commits; earlier completed slices remain operational.

## 13. Explicit Non-Goals

- Replacing SQL Server, Express, React, or Vite.
- Adding analytics dashboards without real data requirements.
- Inventing functionality for the unfinished data-entry or proctor modules.
- Introducing a large UI framework, CSS-in-JS runtime, or global state library.
- Rebranding the legal/product name beyond `ACCI Center`.
