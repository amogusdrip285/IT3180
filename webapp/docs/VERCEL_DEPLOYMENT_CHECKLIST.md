# Vercel Deployment Checklist (Phase 8)

Last updated: 2026-04-06

## Pre-Deploy

- [x] `npm run lint` passes.
- [x] `npm run build` passes.
- [x] Database migrations are committed.
- [x] Seed script compatible with latest schema.
- [ ] Run smoke regression against staging (`npm run test:e2e:smoke`).

## Vercel Project Setup

- [ ] Framework preset: Next.js.
- [ ] Root Directory: `webapp`.
- [ ] Build Command: `npm run build`.
- [ ] Install Command: `npm install`.
- [ ] Runtime Node version aligned with local (Node >= 22).

## Environment Variables

- [ ] `DATABASE_URL` set for production database.
- [ ] `NODE_ENV=production` (managed by platform, verify behavior).
- [ ] Optional: `APP_BASE_URL` for external smoke checks.

## Database Operations

- [ ] Apply migrations in deploy pipeline (`prisma migrate deploy`).
- [ ] Avoid `migrate dev` in CI/CD.
- [ ] Seed only in non-production/staging unless explicitly required.

## Production Safety

- [ ] Disable or protect `/api/seed/reset` in production.
- [ ] Verify secure cookie behavior over HTTPS.
- [ ] Validate RBAC by role in production-like environment.
- [ ] Verify audit logs are generated for key actions.

## Post-Deploy Verification

- [ ] Login/logout success for admin/accountant/team leader.
- [ ] CRUD sanity checks for residents/fees/payments.
- [ ] CSV export endpoint returns valid data.
- [ ] Dashboard and list endpoints work with pagination.
