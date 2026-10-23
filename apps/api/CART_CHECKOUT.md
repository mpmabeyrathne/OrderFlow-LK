# Cart & Checkout — Task 3

## API (customer Bearer token required)
- `GET /cart` — list current customer's cart items and live product information
- `PUT /cart/items/:productId` — set quantity (1–100): `{"quantity":2}`
- `DELETE /cart/items/:productId` — remove the selected item
- `POST /cart/checkout` — empty JSON object `{}`, returns a newly created order (201)

Admin and manager accounts receive 403. Customer/user IDs and prices are not taken from checkout request bodies. Each account has up to 50 distinct product entries.

## Persistence and transactional guarantees
Cart items persist in PostgreSQL, linked to a user and product, with a unique user/product index and quantity constraint. Adding to the cart **does not reserve stock**.

Every cart mutation and checkout locks the same user row inside a transaction, preventing simultaneous checkout from creating multiple orders from one cart. During checkout:
1. Lock customer user row
2. Read all cart items
3. Deduct each product's stock via conditional SQL UPDATE (only active products with enough stock)
4. Calculate total from current database prices, in integer cents
5. Create order and order-item snapshots
6. Delete cart rows and commit together

If a product is unavailable or stock is insufficient, the entire operation rolls back and the cart remains available. A second checkout with an empty cart returns 400. Checkout does not charge a payment instrument; payment flows are a future task.

## Migration
Run `pnpm --filter @orderflow/api db:migrate` on your **development** database before starting the upgraded API. This migrates the new `cart_items` table. Back up important data before schema migrations.

## Testing
```sh
pnpm --filter @orderflow/api typecheck
pnpm --filter @orderflow/api test
pnpm --filter @orderflow/api test:acceptance:mock
```
These tests do not require TEST_DB_URL. Real transactional checkout still requires testing against a disposable migrated PostgreSQL database before production deployment.

## Limitations
- This is synchronous checkout without payment or shipping.
- It is not idempotent with a cross-request idempotency key. The per-user lock prevents concurrent checkout from duplicating a **single** cart, but a client that refills the cart and retries could place another order.
- Cart GET returns current products/prices and does not promise availability.
- Decimal totals assume the existing order currency/price representation and two decimal places. Multi-currency support is not included.
