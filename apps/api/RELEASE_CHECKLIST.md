# CV portfolio completion checklist

## Portfolio scope (no dedicated test DB required)
- [x] Implement authentication/RBAC, stock concurrency, cart checkout, simulated payments, catalog filtering/pagination.
- [x] Add TypeScript unit tests, mocked HTTP acceptance tests, CI, OpenAPI, Dockerfile and project README.
- [x] Capture the last user-reported result: 88/88 unit/mock tests passed, and TypeScript build succeeded.
- [ ] Review/merge PRs #3, #4, #5, #6 in order.
- [ ] Check GitHub Actions for the final main branch and document the results.
- [ ] Optional: Manually exercise cart/checkout/payment on existing development DB using disposable records (avoid destructive tests on shared data).
- [ ] Optional: Run isolated PostgreSQL integration suite only if a separate database becomes available.

**Scope note:** `test:integration` is deliberately NOT a portfolio sign-off requirement. Its suite writes/deletes data and requires a separate database. Mock tests do not prove live transactional correctness.

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
