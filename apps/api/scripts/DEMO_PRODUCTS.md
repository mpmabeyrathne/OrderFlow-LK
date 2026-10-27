# Sample catalog for portfolio demos

The seeder uses the **existing** `POST /products` endpoint; it does not open PostgreSQL connections, change schema, delete records, or reset stock. The 12 products are marked with `[DEMO]` in their names and use the current product fields: name, description, price, stockQuantity, isActive.

## 1. Start your existing development API

```powershell
pnpm --filter @orderflow/api dev
```

## 2. Preview what would be inserted (no credentials required)

In another terminal from the repo root:

```powershell
node apps/api/scripts/demo-products.mjs
```

The script compares catalog product names and previews missing records. It does **not** write data without `--apply`.

## 3. Apply using a manager/admin account

Log in with an existing **admin or manager** account via `POST http://localhost:3000/auth/login` in Postman. Copy the `data.accessToken` value privately. Do not share it in chat, commit it, or paste it into screenshots.

In the same PowerShell terminal:

```powershell
$env:DEMO_ADMIN_TOKEN = "<your-admin-or-manager-access-token>"
node apps/api/scripts/demo-products.mjs --apply
Remove-Item Env:DEMO_ADMIN_TOKEN
```

The access token expires after about 15 minutes. If it expires, sign in again.

The seeder skips names already present in the product catalog; re-running it does not intentionally duplicate products. It creates only missing `[DEMO]` items. If any existing product has the same name, it is left unchanged. Use a disposable development environment, not production. **No separate test database is needed.**

## 4. View the sample items

Visit `http://localhost:3001/shop` and search for `[DEMO]`. The app uses emoji illustrations selected from product names; the backend does not yet store product images.

**Limitations:** This utility does not provision staff accounts, update existing products, restore consumed stock, or guarantee atomicity across all 12 HTTP requests. It is meant for a local CV portfolio demonstration.
