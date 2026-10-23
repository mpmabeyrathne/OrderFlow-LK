# Task 2: Inventory Consistency & Concurrency

## Problem
A staff member reads stock=10, an order purchases 3 units (stock=7), then the staff member overwrites the quantity using the stale value 10. Without an update precondition, the staff write can discard legitimate order activity.

## Solution: optimistic concurrency control (compare-and-swap)
`PATCH /products/:id/stock` now requires:
```json
{ "stockQuantity": 12, "expectedStockQuantity": 10 }
```
The database performs one conditional statement (not a read followed by write):
```sql
UPDATE products
SET stock_quantity = 12, updated_at = NOW()
WHERE id = :product_id AND stock_quantity = 10
RETURNING id;
```
If the current stock no longer equals 10, the update changes **zero rows**, and the API returns `409 Conflict` (or `404` if the product does not exist). The client should GET the product again and decide on the correct replacement quantity. This is an absolute stock correction, **not** an add/subtract operation.

## Existing order-level protection
Order creation already reduces stock conditionally within a database transaction, requiring `stock_quantity >= quantity`. Competing purchases cannot decrement a row below zero; an insufficient-stock update returns 409 and the transaction rolls back. Cancellation uses a row lock on the order and restores stock only once.

## Test without an additional database
From repository root:
```sh
pnpm --filter @orderflow/api typecheck
pnpm --filter @orderflow/api test
pnpm --filter @orderflow/api test:acceptance:mock
```
New tests cover successful compare-and-swap, stale writes, nonexistent product, concurrent requests and HTTP validation for negative/missing expected stock. The in-memory concurrency simulation is **not** proof of database locking under real concurrent transactions. Database-level race tests should still be run in a dedicated test environment before production.

## API compatibility
This intentionally changes the staff stock-update request body; clients sending only `stockQuantity` now receive 400. Update Postman examples, API clients and UI forms to read the latest stock and send `expectedStockQuantity`.

## Limitations
Comparing only the quantity cannot detect the ABA case (10 -> 7 -> 10). A dedicated `stock_version` column, or a timestamp/version-based ETag with an enforced precondition, is needed if every intermediate stock change must be detected. No migration is required for this simpler approach.
