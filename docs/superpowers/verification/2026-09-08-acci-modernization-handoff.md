# ACCI Modernization Handoff

**Branch:** `feat/acci-modernization`  
**Merge base:** `main`  
**Latest verification:** 2026-09-08

## Delivered

- ACCI SVG brand, local Be Vietnam Pro, semantic light/dark tokens, persistent app shell, responsive navigation, and lazy feature routes.
- Rebuilt login, reception registration/customer/candidate flow, accounting queue/checkout, exam-form list/detail, and extension eligibility flow.
- Server-owned registration dates, paginated list contracts, set-based exam validation, guarded schedule capacity updates, additive workflow indexes, request IDs, shared validation, and domain constants.
- Removed legacy CRA pages, raster branding, global compatibility CSS, and unused Bootstrap/Font Awesome/dayjs dependencies.
- Browser coverage for authentication, authorization, shell, registration, payment, exam-form, extension, desktop/mobile layouts, and serious/critical accessibility violations.

## Database rollout

Apply these in order after a backup:

1. `database/migrations/001_baseline.sql`
2. `database/migrations/002_auth_and_workflow_integrity.sql`
3. `database/migrations/003_workflow_indexes.sql`
4. `Trigger.sql`

Migration `003` is additive and supplies the workflow uniqueness and schedule lookup indexes required by the current server implementation.

## Verified gates

| Command | Result |
| --- | --- |
| `npm test` | 31 client tests and 33 server tests passed |
| `npm run lint` | Passed for client and server |
| `npm run build` | Passed; feature-level Vite chunks emitted |
| `npm run audit:prod` | No production vulnerabilities found |
| `npm run test:e2e` | 19 Playwright tests passed on desktop, mobile, and accessibility projects |
| `npm run test:a11y` | 5 Axe workflow scans passed with no serious/critical violations |
| `npm run db:smoke` | Passed against isolated `ACCI_CI_SMOKE` database |

## Intentional scope boundaries

`Nhập liệu` and `Coi thi` remain authenticated unavailable modules. Their real workflows have not been defined in the domain model, so the UI exposes no placeholder actions and the server grants no speculative permissions.
