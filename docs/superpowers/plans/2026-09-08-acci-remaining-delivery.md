# ACCI Remaining Modernization Delivery Plan

**Status:** Proposed for approval  
**Goal:** Complete the approved ACCI modernization safely from the current foundation, then deliver a clean, tested branch ready to merge into main.

## Current baseline

Completed on feat/acci-modernization:

- Brand SVG assets, local Be Vietnam Pro, semantic tokens, light/dark theme, and persistent authenticated shell.
- Desktop/mobile Playwright regression coverage for shell persistence.
- Shared action, form, feedback, dialog, toast, page, table, search, pagination, and status primitives.

The remaining work starts with the branded login, then migrates each business workflow as a vertical frontend/API/SQL slice. Existing data remains intact; database changes are additive migrations only.

## Delivery sequence

### 1. Finish shared UI and rebuild authentication

**Outcome:** One polished, accessible login experience that uses the new ACCI brand system and never opens the legacy warning modal.

- Build features/auth/LoginPage from BrandLogo, FormField, TextInput, Button, IconButton, and Alert.
- Preserve password reveal, add browser autocomplete attributes, disable duplicate submits, and show authentication errors inline.
- Redirect a successful login to the protected route originally requested; otherwise resolve the role landing path from the central route registry.
- Replace the raster logo and WarningModal references in the login route.
- Add unit coverage for redirect, bad credentials, pending submit, and password reveal; add a responsive Playwright login flow.

**Approval checkpoint:** login at 1366x768 and 390x844, dark-mode toggle, and an invalid-password state.

### 2. Migrate the reception workflow

**Outcome:** Reception can find, filter, create, and review registrations without client-side data-shape fallbacks or duplicate submissions.

- Add server validation middleware, canonical English-keyed registration/customer models, and abort-aware feature API adapters.
- Move registrations and customers to server-side search and pagination with URL-backed query state.
- Split the create-registration page into focused customer selection, customer form, candidate editor, candidate table, and sticky submission summary components.
- Make registration date server-owned; preserve transactional registration creation and prevent repeated submission.
- Replace per-page global CSS with CSS Modules composed from the shared primitives.
- Add contract, unit, browser, and SQL rollback tests; inspect SQL Server execution plans before adding any measured index migration.

**Approval checkpoint:** empty/list/filter/create/error flows with one demo customer and multiple candidates.

### 3. Migrate accounting and invoice processing

**Outcome:** Accounting has a searchable payment queue and a clear, safe invoice flow.

- Normalize payment/quote API models and validate identifiers, payment method, and date boundaries in the business timezone.
- Add server pagination/search for the queue and URL-backed filters.
- Rebuild the processing page with customer, registration, quote, discount, and total sections using VND formatting.
- Keep invoice date selectable only within the allowed range; disable re-submission after an invoice exists and present a stable receipt state.
- Add API contract tests, client interaction tests, browser payment flow coverage, and transaction/affected-row guards.

**Approval checkpoint:** queue, quote, invoice validation error, successful invoice, and already-issued receipt states.

### 4. Migrate exam forms and certificate extensions

**Outcome:** Exam-form and extension decisions are understandable, validated, and concurrency-safe.

- Rebuild exam-form list/detail around server paging, a definition-list detail card, normalized models, and reusable status badges.
- Show extension eligibility as a schedule comparison; disable full or cutoff-ineligible schedules with an explicit reason.
- Convert duplicate/capacity validation in exam issuance to set-based checks while retaining locked capacity updates.
- Centralize date-only and schedule timestamp handling around Asia/Ho_Chi_Minh.
- Add contract tests for pagination and eligibility, service tests for 24-hour/capacity rollback, and Playwright coverage for detail and extension submission.

**Approval checkpoint:** eligible schedule, no eligible schedules, 24-hour cutoff, full capacity, and concurrent-seat rejection.

### 5. Complete remaining roles and remove legacy compatibility

**Outcome:** Every role has either a usable workflow or an honest, polished unavailable state; no legacy visual/transport compatibility remains.

- Replace temporary role placeholder pages with intentional empty states and support guidance.
- Migrate all remaining page styles to CSS Modules; delete design.css, legacy index.css, legacy AppShell.css, global page selectors, and all !important declarations once no owners remain.
- Remove LogoACCI.png, old Create React App assets, WarningModal, deprecated Bootstrap/Font Awesome dependencies, and duplicated icon/navigation implementations after reference scans show zero runtime use.
- Introduce route-level lazy loading while retaining the shell and a painted canvas during suspense.
- Update README with Node/SQL setup, local commands, test commands, demo accounts, roles, and troubleshooting.

**Approval checkpoint:** role navigation map, no legacy assets in production output, and reload/back-navigation behavior.

### 6. Final quality, performance, and merge readiness

**Outcome:** A reproducible branch with documented evidence that it is ready for review and merge.

- Run full unit/contract/browser/a11y/lint/build/audit/database smoke gates.
- Run desktop and mobile visual checks for login, dashboard, registration, payment, exam form, and extension flows; inspect browser console and failed requests.
- Measure production bundle output and use route splitting or asset cleanup where it materially improves the initial load without regressing UX.
- Review SQL execution plans for each newly paginated/searchable query and add only justified additive indexes.
- Review migration order, backup/rollback notes, and API compatibility removal before merge.
- Produce a final change summary with commit list, database migration instructions, verified commands, and residual risks.

## Mandatory quality gates

Each delivery checkpoint must be independently green before the next begins:

```powershell
npm test
npm run lint
npm run build
npm run audit:prod
npm run db:smoke
```

At the final checkpoint, also run:

```powershell
npm run test:e2e
npm run test:a11y
git status --short
git log --oneline --decorate -20
```

## Execution discipline

- Work remains isolated on feat/acci-modernization; no merge or push to main occurs without your instruction.
- Every behavior change follows red-green-refactor and lands in a focused commit.
- API and SQL changes arrive backward-compatible first; client migration follows; obsolete paths are removed only in the cleanup slice.
- Visual and interaction design decisions continue to follow the approved professional, refined, trustworthy direction without waiting for additional micro-approvals.

## Plan sources

This delivery plan orchestrates the detailed task plans already in the repository:

1. 2026-09-08-acci-ui-primitives.md — remaining Task 5.
2. 2026-09-08-acci-reception-workflow.md.
3. 2026-09-08-acci-accounting-workflow.md.
4. 2026-09-08-acci-exam-extension-workflows.md.
5. 2026-09-08-acci-quality-cleanup.md.
