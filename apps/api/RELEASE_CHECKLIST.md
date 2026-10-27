# Release checklist

## Blocking verification
1. Merge prerequisite PRs in order (Cart #3, Payments #4, Search #5, Release hardening #6) **only after relevant test results have been reviewed**.
2. Check typecheck, unit/mock tests, and build with CI.
3. Provision an isolated database and set `TEST_DB_URL`. It MUST NOT equal `DB_URL`. Apply all migrations to that test database before running `pnpm --filter @orderflow/api test:integration`.
4. Verify live customer cart -> checkout -> stock deduction -> saved order items -> empty cart, and failing checkout rollback.
5. Verify simulated payment ownership, immutable repeat result, and conflicting-result rejection. Confirm paid-order cancellation returns 409.
6. Verify product/order filtering with real SQL, including customer isolation and expected row counts.
7. Confirm environment variables (`DB_URL`, strong `JWT_SECRET`, `NODE_ENV=prod`) and never commit secrets.
8. Smoke test health, authentication, checkout, simulated payment and error responses after deployment.

## Deployment
Build the repository-root `Dockerfile` with `docker build -t orderflow-api .`.
Start locally using a development database:
```sh
docker run --rm -p 3000:3000 -e NODE_ENV=prod -e DB_URL="$DB_URL" -e JWT_SECRET="$JWT_SECRET" orderflow-api
```
Use a managed platform that supports Node.js and outbound connections to Neon PostgreSQL. Configure port 3000 (or override with PORT). Apply migrations as a separate, controlled release step with the project tooling; the runtime image intentionally does not apply migrations automatically.

## Known limitations / separate roadmap
- Payments are simulations, not real charges or refunds.
- Checkout has per-user transactional protection but no independent client idempotency key.
- No distributed rate limiting, Redis cache, queue worker, production tracing or alerting yet. Add those only with a concrete requirement and a compatible hosting service.
- The JWT service is homegrown; replacing it with a maintained audited library and adding session/revocation strategy is strongly recommended before exposing the API publicly.
- The current search uses offset pagination; large-data performance/load testing is outstanding.
- Database and production deployment checks cannot be inferred from mock tests.
