# Playwright E2E UI tests

Playwright runs against the Next.js UI at `http://localhost:3001` and intercepts `/backend/*` API requests. This keeps visual/functional regression tests **independent of the database**.

## Install on Windows PowerShell

From the repository root:

```powershell
pnpm install
pnpm --filter @orderflow/web exec playwright install chromium
pnpm --filter @orderflow/web test:e2e
```

Playwright starts its **own** Next.js dev server at `http://127.0.0.1:3101` and does not reuse the storefront server at port 3001. No API or test database is needed for these mock-based UI tests.

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
- Customer checkout, successful/failed simulated payments, payment persistence after reload
- Checkout rejection with cart preserved and server validation message
- Order history filtering
- Customer restrictions on staff dashboard
- Manager product creation, stock optimistic-concurrency request, and order status update

The mock tests demonstrate UI behavior, not PostgreSQL transaction correctness. Add a separate live-API smoke suite only if a safe set of development test records is available.

## Investigating failures

Run the focused browser diagnostic first:

```powershell
pnpm --filter @orderflow/web exec playwright test e2e/diagnostics.spec.ts --project=chromium --workers=1
```

If it fails, the diagnostic prints browser JavaScript errors, observed `/backend/*` requests, and visible page text. Check the trace and screenshot in `apps/web/test-results`. Stop existing Next.js servers if they hold stale `.next` build artifacts, and confirm you pulled the latest `feature/nextjs-redux-web` branch.
