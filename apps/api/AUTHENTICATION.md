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
- Customer can read their own customer and orders (orders filtered in SQL), create an order only with their own customerId.
- Admin/manager may list/read/create orders for any customer.

Existing legacy customers do not have login accounts; migration/claiming requires a trusted, verified procedure. Public signup must not link an existing email.

## Role provisioning
Only customer accounts can self-register. There is no public role selector. A trusted local CLI is available:

```sh
cd apps/api
read -rsp 'New staff password: ' ORDERFLOW_STAFF_PASSWORD; echo
export ORDERFLOW_STAFF_PASSWORD
pnpm exec tsx scripts/provision-staff.ts admin admin@example.com
unset ORDERFLOW_STAFF_PASSWORD
```

Use `manager` instead of `admin` when appropriate. Run from a trusted terminal, never place the password in command arguments or Git, and use a unique, strong password. This creates a **new** staff account and refuses to change existing accounts. MFA and staff invites are future improvements.

## Security notes
Passwords are salted and hashed with Node scrypt. JWTs use HS256 with explicit algorithm, issuer, audience, expiry and HMAC verification. User state/role is loaded from the database on each request; expired tokens are rejected.

Not included: refresh tokens, password reset, email verification, MFA, account lockout, request-rate limiting, or administrative provisioning. Run behind TLS and apply rate limiting before production exposure.

## Test commands
From the repository root:
```sh
pnpm --filter @orderflow/api typecheck
pnpm --filter @orderflow/api test
```
The default Vitest configuration includes source unit tests, excludes compiled `dist` output, and excludes the database-backed order repository suite. For database integration tests, explicitly configure `DB_URL` for a dedicated, disposable test database, apply migrations, and run:
```sh
pnpm --filter @orderflow/api test:integration
```
Never run DB-backed tests against production. If changing branches locally, pull the latest feature branch before running commands.

## Verification
Run `pnpm --filter @orderflow/api typecheck` and `pnpm --filter @orderflow/api test` with a **dedicated test DB**. Existing transaction integration tests use DB_URL and write test records. Do not point tests at production DB.
