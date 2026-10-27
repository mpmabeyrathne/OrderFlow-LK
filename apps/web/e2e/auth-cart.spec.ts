import { test, expect } from "@playwright/test";
import { mockCatalog, product } from "./fixtures";

const user = {
  id: "8a31fb04-c62e-4c10-944a-1b303ececc63",
  customerId: "f2ac4ac3-ad59-480b-8956-3e1331ad812d",
  email: "demo@example.com",
  role: "customer",
};
test("guest add-to-cart action redirects to sign-in", async ({ page }) => {
  await mockCatalog(page);
  await page.goto("/shop");
  await page.getByRole("button", { name: "Add", exact: true }).first().click();
  await expect(page).toHaveURL(/\/login\?next=%2Fshop|\/login\?next=\/shop/);
  await expect(page.getByRole("heading", { name: "Sign in to OrderFlow" })).toBeVisible();
});

test("login and cart use Redux session and backend endpoints", async ({ page }) => {
  await mockCatalog(page);
  await page.route("**/backend/auth/login", route =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
      success: true, data: { user, accessToken: "demo-playwright-token" },
    }) }),
  );
  await page.route("**/backend/auth/me", route =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
      success: true, data: { userId: user.id, customerId: user.customerId, role: "customer" },
    }) }),
  );
  await page.route("**/backend/cart", route =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
      success: true, data: [{ productId: product.id, quantity: 1, name: product.name,
        price: product.price, stockQuantity: product.stockQuantity, isActive: true }],
    }) }),
  );
  await page.goto("/login");
  await page.getByLabel("Email address").fill("demo@example.com");
  await page.getByLabel("Password").fill("long-test-password");
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await expect(page).toHaveURL(/\/shop/);
  await page.getByRole("link", { name: /View cart:/ }).click();
  await expect(page.getByRole("heading", { name: "Shopping cart" })).toBeVisible();
  await expect(page.getByText(product.name)).toBeVisible();
});
