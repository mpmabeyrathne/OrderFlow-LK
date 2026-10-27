import { expect, test, type Page } from "@playwright/test";
import { product } from "./fixtures";

const manager = {
  userId: "c05941df-9d34-410c-95a3-d25f4a691bae",
  customerId: null,
  role: "manager",
};
const customer = {
  userId: "8a31fb04-c62e-4c10-944a-1b303ececc63",
  customerId: "f2ac4ac3-ad59-480b-8956-3e1331ad812d",
  role: "customer",
};
const order = {
  id: "bbb1a326-9758-4a84-8c6b-762de790642f",
  customerId: customer.customerId,
  totalAmount: product.price,
  currency: "USD",
  status: "pending",
  createdAt: "2026-10-27T09:00:00.000Z",
};
async function session(page: Page, user: { userId: string; customerId: string | null; role: string }) {
  await page.addInitScript(() => sessionStorage.setItem("orderflow_token", "pw-role-token"));
  await page.route(/\/backend\/auth\/me$/, route =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: user }) }),
  );
}
function pageData<T>(data: T[]) {
  return { data, pagination: { page: 1, limit: 10, total: data.length, totalPages: data.length ? 1 : 0 } };
}

test("customer cannot access staff dashboard", async ({ page }) => {
  await session(page, customer);
  await page.goto("/staff");
  await expect(page.getByRole("heading", { name: "Restricted area" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add product" })).toHaveCount(0);
});

test("manager creates a product and updates stock", async ({ page }) => {
  await session(page, manager);
  const products = [product];
  let createCount = 0;
  let stockPatch: { stockQuantity: number; expectedStockQuantity: number } | undefined;
  await page.route(/\/backend\/products(?:\?.*)?$/, route =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(pageData(products)) }),
  );
  await page.route(/\/backend\/orders\?.*$/, route =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(pageData([order])) }),
  );
  await page.route(/\/backend\/products$/, async route => {
    const input = route.request().postDataJSON() as typeof product;
    createCount++;
    const created = { ...input, id: "cc6ec716-915e-42a9-abdc-dd7370a4a5f5", createdAt: product.createdAt };
    products.push(created);
    await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ success: true, data: created }) });
  });
  await page.route(new RegExp("/backend/products/" + product.id + "/stock$"), async route => {
    stockPatch = route.request().postDataJSON() as typeof stockPatch;
    await route.fulfill({ status: 200, contentType: "application/json",
      body: JSON.stringify({ data: { ...product, stockQuantity: stockPatch?.stockQuantity } }) });
  });

  await page.goto("/staff");
  await expect(page.getByRole("heading", { name: "Store dashboard" })).toBeVisible();
  await page.getByLabel("Product name").fill("Compact Desk Lamp");
  await page.getByLabel("Description").fill("Modern LED lighting");
  await page.getByLabel("Price (USD)").fill("39.99");
  await page.getByLabel("Stock quantity").fill("15");
  await page.getByRole("button", { name: "Add product" }).click();
  await expect(page.getByText("Product added to catalog.")).toBeVisible();
  expect(createCount).toBe(1);
  await page.getByLabel("Stock for " + product.name).fill("10");
  await page.getByRole("button", { name: "Update stock" }).click();
  await expect(page.getByText("Stock updated.")).toBeVisible();
  expect(stockPatch).toEqual({ stockQuantity: 10, expectedStockQuantity: 12 });
});

test("manager updates order status", async ({ page }) => {
  await session(page, manager);
  await page.route(/\/backend\/products\?.*$/, route =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(pageData([product])) }),
  );
  await page.route(/\/backend\/orders\?.*$/, route =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(pageData([order])) }),
  );
  let submitted = "";
  await page.route(new RegExp("/backend/orders/" + order.id + "/status$"), async route => {
    submitted = (route.request().postDataJSON() as { status: string }).status;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: { ...order, status: submitted } }) });
  });
  await page.goto("/staff");
  await page.getByRole("button", { name: "Orders", exact: true }).click();
  await page.getByLabel("Status for order " + order.id).selectOption("confirmed");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Order status updated.")).toBeVisible();
  expect(submitted).toBe("confirmed");
});
