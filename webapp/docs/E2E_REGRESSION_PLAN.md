# E2E Regression Plan (Phase 8)

Last updated: 2026-04-06

## Scope

Smoke coverage for critical flows:

1. Authentication (login, me, logout)
2. Permission-protected system endpoint (`/api/bootstrap`)
3. Core read APIs (`households`, `residents`, `fee-types`, `periods`, `obligations`, `payments`)
4. Report export (`/api/reports/payments`)
5. Audit log retrieval

## Script

- Command: `npm run test:e2e:smoke`
- File: `webapp/scripts/e2e-regression.mjs`
- Inputs:
  - `APP_BASE_URL` (default `http://localhost:3000`)
  - `E2E_USER` (default `admin`)
  - `E2E_PASSWORD` (default `admin`)

## Local Run Sequence

1. `npm run db:generate`
2. `npx prisma migrate deploy`
3. `npm run db:seed`
4. Start app (`npm run dev` or production server)
5. In a second terminal run `npm run test:e2e:smoke`

## Exit Criteria

- All smoke endpoints return success.
- Session cookie is issued on login and accepted in subsequent requests.
- No permission failure for admin smoke user.

## Next Expansion

- Add role-based negative tests (`ACCOUNTANT` and `TEAM_LEADER` denied for system admin endpoints).
- Add write-path tests for create/update/delete flows.
- Add UI-level E2E tests (Playwright/Cypress) for core user journeys.
