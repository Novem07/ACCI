# ACCI Modernization Roadmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Coordinate six independently testable plans that modernize ACCI's brand, frontend architecture, business workflows, API, SQL access, accessibility, and performance.

**Architecture:** Build the shared brand, route shell, and UI primitives first; then migrate each business workflow as a vertical frontend/API/database slice. Finish by removing compatibility code and running full browser, accessibility, database, and dependency gates.

**Tech Stack:** React 19, React Router 7, Vite 8, CSS Modules, Vitest, Testing Library, Playwright, Express 5, Zod 4, SQL Server.

**Spec:** `docs/superpowers/specs/2026-09-08-acci-modernization-design.md`

## Global Constraints

- Node.js remains `>=22.14 <23`; React, Vite, Express, and SQL Server are retained.
- Bundle Be Vietnam Pro weights 400, 500, 600, and 700 locally through `@fontsource/be-vietnam-pro@5.3.0`; no runtime font CDN request.
- Do not add a large component framework, CSS-in-JS runtime, or global state library.
- Use CSS Modules for page/component styles; global CSS is limited to tokens, reset, and small accessibility/layout utilities.
- No application stylesheet may contain `!important` or unscoped page selectors for `body`, headings, tables, inputs, or buttons.
- API wire fields use English names; visible product copy remains Vietnamese.
- Normal text contrast is at least 4.5:1 and large text/non-text UI contrast is at least 3:1.
- Optimize first for 1366x768 and 1920x1080; essential workflows must work at 390x844.
- Preserve data through additive numbered migrations and backward-compatible API transitions.
- Every behavior change follows red-green-refactor and every task ends in a focused commit.

---

## Ordered plans

1. `2026-09-08-acci-foundation-brand-shell.md`
2. `2026-09-08-acci-ui-primitives.md`
3. `2026-09-08-acci-reception-workflow.md`
4. `2026-09-08-acci-accounting-workflow.md`
5. `2026-09-08-acci-exam-extension-workflows.md`
6. `2026-09-08-acci-quality-cleanup.md`

Plans are executed in order. Within a plan, tasks are executed in order. Do not begin a later plan while an earlier plan has failing gates.

## Program gates

- [ ] **Gate 1: Establish the baseline**

Run:

```powershell
npm test
npm run lint
npm run build
npm run audit:prod
npm run db:smoke
```

Expected: every command exits `0`. Record the client bundle sizes printed by Vite and retain before screenshots of login, dashboard, registration, accounting, exam forms, and extension pages at 1366x768.

- [ ] **Gate 2: Execute each linked plan**

After each plan, run its targeted tests followed by the five baseline commands. Commit only when all applicable commands exit `0`.

- [ ] **Gate 3: Final acceptance**

Run:

```powershell
npm test
npm run test:e2e
npm run test:a11y
npm run lint
npm run build
npm run audit:prod
npm run db:smoke
```

Expected: all commands exit `0`; no browser console errors or failed API requests; no route-content flash under Playwright's slow-network profile; no serious or critical accessibility violations.

- [ ] **Gate 4: Program commit**

```powershell
git status --short
git log --oneline --decorate -20
```

Expected: clean worktree and one or more focused commits for every linked plan. Do not squash database migrations into unrelated UI commits.
