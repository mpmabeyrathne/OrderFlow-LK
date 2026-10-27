# OrderFlow-LK

OrderFlow-LK is a full-stack e-commerce portfolio project. The backend is a Node.js + TypeScript REST API with PostgreSQL/Drizzle ORM, and `apps/web` is a Next.js + Redux Toolkit storefront with customer checkout and a staff dashboard. Simulated payments do not move money.

## Get started

Requires Node.js 22+, pnpm 11+, and a PostgreSQL database supported by the Neon driver.

```sh
pnpm install --frozen-lockfile
# Configure apps/api/.env from apps/api/.env.example
pnpm --filter @orderflow/api db:migrate
pnpm --filter @orderflow/api dev
```

The API starts on port 3000 by default. Check `GET /health`.\n\n## Run the Next.js storefront\n\n```powershell\npnpm install\nCopy-Item apps/web/.env.example apps/web/.env.local\n# With the API running in another terminal:\npnpm --filter @orderflow/web dev\n```\n\nOpen http://localhost:3001. The Next.js server proxies `/backend/*` to the API. Staff accounts are created using the backend's provisioning workflow. See [web app setup and routes](apps/web/README.md).\n\n**First install after adding the web workspace:** generate and commit the updated `pnpm-lock.yaml` with `pnpm install`. CI uses `--frozen-lockfile`.

## Quality checks

```sh
pnpm --filter @orderflow/api typecheck
pnpm --filter @orderflow/api test
pnpm --filter @orderflow/api build\npnpm --filter @orderflow/web typecheck\npnpm --filter @orderflow/web build\n```

Optional database-backed acceptance tests (not required for this CV portfolio) require a separately migrated `TEST_DB_URL`, distinct from `DB_URL`. Never run these tests against your main development data:

```sh
pnpm --filter @orderflow/api test:integration
```

See [OpenAPI specification](apps/api/openapi.json), [release checklist](apps/api/RELEASE_CHECKLIST.md), and [operations/deployment guide](apps/api/OPERATIONS.md).

## Feature notes
- [Authentication](apps/api/AUTHENTICATION.md)
- [Inventory consistency](apps/api/INVENTORY_CONSISTENCY.md)
- [Cart and checkout](apps/api/CART_CHECKOUT.md)
- [Simulated payments](apps/api/PAYMENTS.md)
- [Pagination, filtering, search](apps/api/PAGINATION_SEARCH.md)

**Portfolio scope:** This repository demonstrates backend API architecture, role-based access, stock concurrency and automated mock acceptance testing. The user-reported baseline was 88 passing unit/mock tests plus successful TypeScript build. These results do not validate real database transaction behavior. Payment outcomes are simulated; no money moves. Deployment, database integration verification, and production controls are optional follow-up work, not portfolio-completion requirements.
