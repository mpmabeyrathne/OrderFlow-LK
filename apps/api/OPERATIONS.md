# OrderFlow-LK operations

## Build and local development
- Install: `pnpm install --frozen-lockfile`.
- Set `DB_URL` and `JWT_SECRET` using `apps/api/.env.example`.
- Migrate the intended development DB: `pnpm --filter @orderflow/api db:migrate`.
- Run locally: `pnpm --filter @orderflow/api dev`.
- Static checks: `pnpm --filter @orderflow/api typecheck`, `pnpm --filter @orderflow/api test`, `pnpm --filter @orderflow/api build`.
- Optional only: integration testing requires a separate migrated PostgreSQL database and `TEST_DB_URL` distinct from development `DB_URL`. For this CV portfolio, use the mock suite and build as your baseline. Do not run destructive integration tests against the development database.

## API and monitoring
- `GET /health`: process-level health; note this does **not** query PostgreSQL for readiness.
- See [openapi.json](openapi.json) for the request/response endpoints (the repository contains the spec; no Swagger UI is hosted).
- Request logging uses Pino and logs method, URL, status, latency and request IDs.
- Perform read-only k6 smoke/load test: `k6 run -e BASE_URL=http://localhost:3000 apps/api/loadtest/catalog-smoke.js`.
- Load thresholds are initial hypotheses, not established performance service-level agreements.

## Production deployment
- Build image at repository root: `docker build -t orderflow-api .`.
- Set `NODE_ENV=prod`, a securely generated `JWT_SECRET` (>=32 chars) and secret `DB_URL` via the hosting platform.
- Keep `DB_URL` encrypted; never embed it in the Docker image or Git.
- Run Drizzle migrations as an explicit controlled release job **before** starting the new code.
- Start the container exposing port 3000; the server verifies database connection at startup.
- Prefer a managed TLS reverse proxy. Configure HTTPS, secure headers, request-rate limits and access logs at the edge.
- Define uptime/error-rate alerts, database monitoring and backup/restore exercises with the hosting provider.
- No cloud environment has been provisioned as part of this project; actual domain, TLS certificate, backups, deployment pipeline and monitors remain operator tasks.

## Optional expansion
Redis caching and background workers are intentionally not required for the initial synchronous API. They need an actual target workload, queue semantics and operational ownership; adding them for their own sake is not release readiness.
