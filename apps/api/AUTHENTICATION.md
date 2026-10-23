# Authentication & Authorization

## Setup
Set `DB_URL` and a random `JWT_SECRET` (at least 32 characters) in `apps/api/.env`. Generate one with:
`node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`

Run `pnpm --filter @orderflow/api db:migrate` from the repository root before starting.

## API
- POST /auth/register: {name,email,password}; creates a customer and its separate login account, returns a 15-minute Bearer access token.
- POST /auth/login: {email,password}; returns a Bearer access token.
- GET /auth/me: current verified user (requires Bearer token).
- Public product GET endpoints remain available.
- Admin/manager can create/update products, update stock, list/create customers, change order status.
- Customer can read their own customer and orders, create an order only with their own customerId.
- Admin/manager may list/read/create orders for any customer.

Existing legacy customers do not have login accounts; migration/claiming requires a trusted, verified procedure. Public signup must not link an existing email.

## Role provisioning
Only customer accounts can self-register. No public role-selector or admin provisioning endpoint exists. Admin and manager setup requires a separate trusted mechanism and secure operational procedure.

## Security notes
Passwords are salted and hashed with Node scrypt. JWTs use HS256 with explicit algorithm, issuer, audience, expiry and HMAC verification. User state/role is loaded from the database on each request; expired tokens are rejected.

Not included: refresh tokens, password reset, email verification, MFA, account lockout, request-rate limiting, or administrative provisioning. Run behind TLS and apply rate limiting before production exposure.

## Verification
Run `pnpm --filter @orderflow/api typecheck` and `pnpm --filter @orderflow/api test` with a **dedicated test DB**. Existing transaction integration tests use DB_URL and write test records. Do not point tests at production DB.
