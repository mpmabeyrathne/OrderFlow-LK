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

## HTTP authentication acceptance suite
The suite `src/integration/auth.acceptance.test.ts` sends real HTTP requests to an ephemeral local Express server, uses the linked PostgreSQL database, and cleans up its unique test accounts, orders and products. It covers registration, duplicate signup, correct/wrong login, authenticated profile, RBAC and order ownership, and both admin/manager operations.

Use a separate **migrated disposable database**. Add `TEST_DB_URL` to `apps/api/.env`, different from `DB_URL`. Vitest's integration setup refuses to run without it or if the two URLs match. The tests use TEST_DB_URL; do not point it at a real shared/production database.

From repository root:
```sh
pnpm --filter @orderflow/api test:acceptance
pnpm --filter @orderflow/api test:integration
```
The first runs the acceptance suite only; the second runs both the order repository integration tests and authentication acceptance tests. The ordinary `test` command remains unit-only.

If running on PowerShell and TEST_DB_URL is not in your .env file, provide it as an environment variable for the current session (do not commit it). Apply Drizzle migrations to that test database first.


## No-database acceptance tests (quick start)
If you don't want to set up TEST_DB_URL yet, run from the repository root:
```sh
pnpm --filter @orderflow/api test:acceptance:mock
```
These HTTP tests use the real Express routes, token/password functions and authorization middleware, but **mock the persistence and business services** with temporary in-memory data. No PostgreSQL database is created or modified. They test the requested response/status security cases but **do not verify real DB queries, transactions or migrations**; use `test:acceptance` with TEST_DB_URL later for full integration confidence.
