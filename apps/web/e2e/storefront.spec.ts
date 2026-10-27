import { expect, test } from "@playwright/test";
import { mockCatalog, product } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await mockCatalog(page);
});

test("renders available product with a correctly sized stock badge", async ({ page }) => {
  await page.goto("/");
  const card = page.locator(".product-card").filter({ hasText: product.name });
  await expect(card).toBeVisible();
  const badge = card.locator(".product-image .pill");
  await expect(badge).toHaveText("In stock");

  // Regression: broad .product-image span rules previously made badge text 74px.
  const fontSize = await badge.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(fontSize).toBeLessThanOrEqual(14);

  const badgeBox = await badge.boundingBox();
  const imageBox = await card.locator(".product-image").boundingBox();
  expect(badgeBox).not.toBeNull();
  expect(imageBox).not.toBeNull();
  if (!badgeBox || !imageBox) return;
  expect(badgeBox.x).toBeGreaterThanOrEqual(imageBox.x);
  expect(badgeBox.y).toBeGreaterThanOrEqual(imageBox.y);
  expect(badgeBox.x + badgeBox.width).toBeLessThanOrEqual(imageBox.x + imageBox.width + 1);
  expect(badgeBox.y + badgeBox.height).toBeLessThanOrEqual(imageBox.y + imageBox.height + 1);
  expect(badgeBox.height).toBeLessThan(40);
});

test("product card has title, price and add button without visual overlap", async ({ page }) => {
  await page.goto("/");
  const card = page.locator(".product-card").filter({ hasText: product.name });
  await expect(card.getByRole("heading", { name: product.name })).toBeVisible();
  await expect(card.getByText("$4,000.00")).toBeVisible();
  await expect(card.getByRole("button", { name: /add/i })).toBeEnabled();
  const titleBox = await card.getByRole("heading", { name: product.name }).boundingBox();
  const imageBox = await card.locator(".product-image").boundingBox();
  expect(titleBox).not.toBeNull();
  expect(imageBox).not.toBeNull();
  if (titleBox && imageBox) expect(titleBox.y).toBeGreaterThanOrEqual(imageBox.y + imageBox.height);
});

test("shop search filters the catalog", async ({ page }) => {
  await page.goto("/shop");
  await expect(page.getByRole("heading", { name: product.name })).toBeVisible();
  await page.getByRole("textbox", { name: "Search products" }).fill("not-found-keyword");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.getByText("No products found")).toBeVisible();
});

test("product card navigates to product detail", async ({ page }) => {
  await page.route("**/backend/products/" + product.id, route =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: product }) }),
  );
  await page.goto("/shop");
  await page.getByRole("link", { name: "View " + product.name }).click();
  await expect(page).toHaveURL(new RegExp("/product/" + product.id));
  await expect(page.getByRole("heading", { name: product.name })).toBeVisible();
});
