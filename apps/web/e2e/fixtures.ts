import type { Page } from "@playwright/test";

export const product = {
  id: "4a8993b8-aa6c-4f78-b56b-a8da3034425d",
  name: "Ergonomic Wireless Mouse",
  description: "Ergonomic wireless mouse with Bluetooth and USB receiver new",
  price: "4000.00",
  stockQuantity: 12,
  isActive: true,
  createdAt: "2026-10-20T12:00:00.000Z",
};

export async function mockCatalog(page: Page, items = [product]) {
  await page.route("**/backend/products?*", async (route) => {
    const url = new URL(route.request().url());
    const search = (url.searchParams.get("search") ?? "").toLowerCase();
    const filtered = items.filter(p => p.name.toLowerCase().includes(search));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: filtered,
        pagination: { page: 1, limit: 12, total: filtered.length, totalPages: 1 },
      }),
    });
  });
}
