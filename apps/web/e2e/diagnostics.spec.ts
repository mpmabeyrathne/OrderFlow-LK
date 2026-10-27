import { test, expect } from "@playwright/test";
import { product } from "./fixtures";

test("Next.js hydrates, sends catalog request and renders mocked product", async ({ page }) => {
  const browserErrors: string[] = [];
  const requests: string[] = [];
  page.on("pageerror", error => browserErrors.push(error.stack ?? error.message));
  page.on("console", message => {
    if (message.type() === "error") browserErrors.push("console: " + message.text());
  });
  page.on("request", request => {
    if (request.url().includes("/backend/")) requests.push(request.method() + " " + request.url());
  });
  await page.route(/\/backend\/products(?:\?.*)?$/, async route => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [product],
        pagination: { page: 1, limit: 8, total: 1, totalPages: 1 },
      }),
    });
  });
  await page.goto("/");
  const card = page.locator(".product-card").filter({ hasText: product.name });
  try {
    await expect(card).toBeVisible({ timeout: 15000 });
  } catch (error) {
    throw new Error(
      "Product did not render.\nAPI requests:\n" + (requests.join("\n") || "(none)") +
      "\nBrowser errors:\n" + (browserErrors.join("\n") || "(none)") +
      "\nVisible page text:\n" + (await page.locator("body").innerText()).slice(0, 1600) +
      "\nOriginal assertion: " + String(error)
    );
  }
  expect(requests.some(url => url.includes("/backend/products"))).toBe(true);
  expect(browserErrors).toEqual([]);
});
