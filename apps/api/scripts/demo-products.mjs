/**
 * Seed an intentionally small catalog via the existing authorized product API.
 * DRY-RUN by default. No direct SQL, no truncation and no stock resets.
 *
 * API_BASE_URL=http://localhost:3000
 * DEMO_ADMIN_TOKEN=<an existing admin or manager access token>
 * node apps/api/scripts/demo-products.mjs          # preview
 * node apps/api/scripts/demo-products.mjs --apply  # create missing records
 */
const base = (process.env.API_BASE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
const apply = process.argv.includes("--apply");
const token = process.env.DEMO_ADMIN_TOKEN;
const names = [
  ["Everyday Wireless Headphones", "Comfortable wireless audio for daily focus and travel.", "89.00", 22],
  ["Minimalist Desk Lamp", "Compact LED desk lighting for a calm workspace.", "49.00", 18],
  ["Ceramic Coffee Mug", "Durable ceramic mug for your morning coffee or tea.", "18.50", 45],
  ["Ergonomic Desk Chair", "Supportive office chair with adjustable height.", "249.00", 9],
  ["Canvas Everyday Backpack", "Lightweight everyday bag for work and short trips.", "69.00", 24],
  ["Classic Analog Watch", "Minimal everyday watch with a clean dial.", "125.00", 13],
  ["Pocket Notebook Set", "Three compact notebooks for notes and ideas.", "14.00", 55],
  ["Indoor Plant Pot", "Simple ceramic plant pot for an inviting home.", "26.00", 37],
  ["Running Sneakers", "Comfortable lightweight trainers for everyday movement.", "110.00", 16],
  ["Portable Bluetooth Speaker", "Compact portable speaker with clear sound.", "72.00", 21],
  ["Smartphone Stand", "Stable desktop stand for video calls and reading.", "22.00", 38],
  ["Reusable Water Bottle", "Refillable everyday bottle with a leak-resistant lid.", "32.00", 30],
].map(([name, description, price, stockQuantity]) => ({
  name: `[DEMO] ${name}`, description, price, stockQuantity, isActive: true,
}));

if (!/^https?:\/\//i.test(base)) throw new Error("API_BASE_URL must start with http:// or https://");
if (apply && !token) throw new Error("Set DEMO_ADMIN_TOKEN to a valid admin/manager JWT before using --apply.");
if (apply && !/^https:\/\//i.test(base) && !/^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(base)) {
  throw new Error("For non-local API hosts use HTTPS to protect the bearer token.");
}

async function listExisting() {
  const names = new Set();
  for (let page = 1; page < 100; page++) {
    const response = await fetch(`${base}/products?page=${page}&limit=100`, { signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error(`Catalog fetch failed: HTTP ${response.status}`);
    const json = await response.json();
    if (!Array.isArray(json.data) || !json.pagination) throw new Error("Unexpected catalog API response");
    json.data.forEach(p => names.add(p.name));
    if (page >= json.pagination.totalPages) return names;
  }
  throw new Error("Catalog too large for safe idempotence check; aborting.");
}

try {
  const existing = await listExisting();
  const missing = names.filter(p => !existing.has(p.name));
  console.log(`Catalog: ${existing.size} existing products; ${missing.length} demo products missing.`);
  if (!apply) {
    missing.forEach(p => console.log(`[DRY RUN] Would create: ${p.name} ($${p.price}, stock ${p.stockQuantity})`));
    console.log("No data was changed. To write missing products, add --apply and DEMO_ADMIN_TOKEN.");
  } else {
    for (const p of missing) {
      const response = await fetch(`${base}/products`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify(p),
        signal: AbortSignal.timeout(12000),
      });
      if (!response.ok) {
        const errorText = (await response.text()).slice(0, 300);
        throw new Error(`Create failed for ${p.name}: HTTP ${response.status} ${errorText}`);
      }
      console.log(`Created: ${p.name}`);
    }
    console.log("Done. Existing products and stock quantities were left unchanged.");
  }
} catch (error) {
  console.error("Demo seed failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
