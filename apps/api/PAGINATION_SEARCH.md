# Task 5 — Pagination, Filtering & Search

## Product listing (public)
`GET /products?page=1&limit=20&search=chair&isActive=true&minPrice=10&maxPrice=100&sortBy=price&sortOrder=asc`

- `page`: 1–100000 (default 1); `limit`: 1–100 (default 20).
- `search`: case-insensitive substring match against product name, max 100 characters. Literal `%` and `_` are escaped; user input is parameterized.
- `isActive`: true or false.
- `minPrice`, `maxPrice`: optional inclusive numeric bounds.
- `sortBy`: `name`, `price`, `createdAt` (default).
- `sortOrder`: `asc` or `desc`.
- Invalid parameters return HTTP 400.

## Order listing (authenticated)
`GET /orders?page=2&limit=10&status=pending&sortOrder=desc`

- Supports `page`, `limit`, optional `status` and `sortOrder`.
- Customers only see their **own** orders. Manager/admin accounts can list all orders.
- Ownership filtering happens in SQL **before** counting and pagination.

## Response format
```json
{
  "data": [{ "id": "..." }],
  "pagination": { "page": 1, "limit": 20, "total": 43, "totalPages": 3 }
}
```
The response retains `data` as the list, and adds `pagination`. Existing clients expecting an unbounded list must switch to requesting pages. Counts are evaluated with the same filters as the returned rows.

## Design choices
- PostgreSQL handles `WHERE`, ordering, `LIMIT`, and `OFFSET` to avoid loading all records into API memory.
- Deterministic secondary ordering on product/order ID avoids ambiguous ordering of equal values.
- Sort fields are enumerated; raw client SQL is never executed.
- `OFFSET` pagination is a good initial approach, but offset pages can shift when records are inserted or deleted. Cursor/keyset pagination is a later option for large or rapidly changing datasets.

## Verify without a second database
```sh
pnpm --filter @orderflow/api typecheck
pnpm --filter @orderflow/api test
pnpm --filter @orderflow/api test src/acceptance/listing.acceptance.mock.test.ts
```
The mock API tests exercise HTTP response contracts and access-scoping arguments. SQL correctness and performance still require live PostgreSQL integration and query-plan verification.
