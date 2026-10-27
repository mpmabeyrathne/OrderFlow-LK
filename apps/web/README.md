# OrderFlow Web — Next.js + Redux Toolkit

This is the customer storefront and staff dashboard for **OrderFlow-LK**.

## Stack
- Next.js App Router + React + TypeScript
- Redux Toolkit for authentication/session UI state
- RTK Query for typed backend API requests, caching, mutations and invalidation
- CSS responsive design + Lucide icons

## Pages

| Page | Purpose |
|---|---|
| `/` | Featured collection and intro |
| `/shop` | Product search, sorting, pagination and filters |
| `/product/[id]` | Product details, quantity and add to cart |
| `/login`, `/register` | Customer and staff login, customer registration |
| `/cart` | Persistent server cart and checkout |
| `/orders`, `/orders/[id]` | Order history, details, simulated payments |
| `/staff` | Admin/manager product creation, stock control and order status |
| `/about` | Portfolio overview |

## Run locally (Windows PowerShell)

From repository root:

```powershell
pnpm install
Copy-Item apps/web/.env.example apps/web/.env.local
# Terminal 1
pnpm --filter @orderflow/api dev
# Terminal 2
pnpm --filter @orderflow/web dev
```

Open **http://localhost:3001**.

The web dev server proxies requests from `/backend/*` to the API at `http://localhost:3000`; this avoids browser CORS configuration. If the API runs on a different host, change `API_INTERNAL_URL` in `apps/web/.env.local` and restart Next.js.

After installation, commit the generated changes to `pnpm-lock.yaml` before treating the repo's frozen-lockfile CI as verified.

### Testing / build

```powershell
pnpm --filter @orderflow/web typecheck
pnpm --filter @orderflow/web build
pnpm --filter @orderflow/web exec playwright install chromium
pnpm --filter @orderflow/web test:e2e
```

## Portfolio caveats
- Checkout creates real order rows in the configured development database; simulated payment does not charge money.
- JWT is held in browser sessionStorage for this demo, not a production hardened HTTP-only session cookie. It expires after approximately 15 minutes.
- Staff accounts are provisioned by the backend, not created through public registration.
- Product visuals are emoji illustrations, not uploaded images: the API has no image field.
- No additional testing database is required for the portfolio demo.
- Do not reuse the session-storage token pattern for an internet-facing production service without a security review.

## Automated UI testing

See [Playwright test guide](e2e/README.md). Mocked network responses mean the suite needs no PostgreSQL instance or test database. It runs on desktop Chromium and mobile Chromium. Coverage includes the availability-badge visual regression, product cards, catalog search, product navigation, guest redirects and customer sign-in/cart behavior.

Before running, install workspace dependencies with `pnpm install` and install the Chromium browser with `pnpm --filter @orderflow/web exec playwright install chromium`. The workspace lockfile must be regenerated and committed by running `pnpm install` locally; otherwise frozen-lockfile CI can fail.
