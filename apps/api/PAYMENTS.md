# Task 4 — Simulated Payments

Simulation only: no payment gateways, payment-card data, money movements, refunds, or webhooks.

## Endpoints (customer Bearer token)
- `POST /payments/orders/:orderId/simulate` with `{"outcome":"success"}` or `{"outcome":"failure"}`
- `GET /payments/orders/:orderId` retrieves payment status for your own order

## Behavior
- Orders are scoped to the authenticated customer's linked customerId.
- The server copies amount and currency from the order; clients cannot specify either.
- The order row is locked for the full transaction, and `payments.order_id` is unique.
- First simulation returns 201; repeating the same result returns 200 with `replayed:true`.
- Attempting to change an already recorded result returns 409.
- Cancelled orders cannot be simulated.
- Success and failure both create an immutable record; failure cannot be retried with another outcome in this simplified design.
- Simulations **do not** modify the order's fulfillment status.

## Setup and tests
Apply the new `0004_simulated_payments` migration to your development DB before using these endpoints:
```sh
pnpm --filter @orderflow/api db:migrate
pnpm --filter @orderflow/api typecheck
pnpm --filter @orderflow/api test
```
Mock/unit tests are not a substitute for real database verification. Review the dependency: this branch is based on unmerged PR #3 Cart & Checkout.
