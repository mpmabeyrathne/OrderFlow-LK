# Playwright E2E UI tests

Playwright runs against the Next.js UI at `http://localhost:3001` and intercepts `/backend/*` API requests. This keeps visual/functional regression tests **independent of the database**.

## Install on Windows PowerShell

From the repository root:

```powershell
pnpm install
pnpm --filter @orderflow/web exec playwright install chromium
pnpm --filter @orderflow/web test:e2e
```

The Playwright config starts the Next.js dev server automatically if port 3001 is unused. No API or test database is needed for these mock-based UI tests.

## Run individual tests

```powershell
pnpm --filter @orderflow/web test:e2e -- --project=chromium
pnpm --filter @orderflow/web test:e2e:ui
pnpm --filter @orderflow/web exec playwright show-report
```

## Coverage
- Availability badge sizing and bounding rectangle (specific regression reported in screenshot)
- Product title, price, add button, card layout
- Product search and zero-results state
- Product detail navigation
- Guest add-to-cart redirects to login
- Customer sign-in, Redux session and cart display

The mock tests demonstrate UI behavior, not PostgreSQL transaction correctness. Add a separate live-API smoke suite only if a safe set of development test records is available.
