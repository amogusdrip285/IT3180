# Security Checklist (Phase 8)

Last updated: 2026-04-06

## Authentication and Sessions

- [x] Passwords stored as PBKDF2 hashes (`passwordHash`), not plaintext.
- [x] Failed login lockout policy enabled (temporary lock after repeated failures).
- [x] Session tokens stored server-side in `Session` table.
- [x] Session cookie is `httpOnly` and `sameSite=lax`.
- [x] Session cookie `secure` flag enabled in production (`NODE_ENV=production`).
- [ ] Consider rotating session token on privilege-sensitive actions.

## Authorization

- [x] API endpoints enforce authentication through `requireAuth`.
- [x] Function-level permission matrix enforced with `requirePermission`.
- [x] System admin operations restricted to `SYSTEM/ADMIN`.
- [ ] Add permission integration tests for each role/module/action path.

## Input Validation and Error Contract

- [x] Centralized API error contract `{ code, message, details }`.
- [x] Strong password policy enforced on user create/reset.
- [x] Common validation helpers used for email, phone, numeric values.
- [x] Pagination limits added to reduce unbounded reads.
- [ ] Add stricter validation for all enum/date inputs (defensive parsing).

## Data and Auditability

- [x] Audit logs capture key security/business operations.
- [x] Login/logout/password reset actions are audited.
- [x] Payment collection and destructive actions are audited.
- [ ] Add retention/archival policy for audit logs.

## Deployment Hardening (Vercel)

- [ ] Set production `DATABASE_URL` to managed database.
- [ ] Set `NODE_ENV=production` in deployment environment.
- [ ] Restrict seed/reset endpoints in production (disable or internal guard).
- [ ] Configure monitoring/alerts for auth errors and repeated lockouts.
- [ ] Document incident-response contact and rollback procedure.
