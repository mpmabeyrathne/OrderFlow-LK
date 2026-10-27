import { expect, test, type Page } from "@playwright/test";
import { product } from "./fixtures";

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
const cartItem = {
  productId: product.id,
  name: product.name,
  price: product.price,
  quantity: 1,
  stockQuantity: product.stockQuantity,
  isActive: true,
};

async function customerSession(page: Page) {
  await page.addInitScript(() => sessionStorage.setItem("orderflow_token", "pw-customer-token"));
  await page.route(/\/backend\/auth\/me(?:\?.*)?$/, route =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: customer }) }),
  );
}

test("customer checks out and records a successful simulated payment", async ({ page }) => {
  await customerSession(page);
  let cart = [cartItem];
  let checkouts = 0;
  let paymentRequests = 0;
  let payment: Record<string, unknown> | undefined;
  await page.route(/\/backend\/cart(?:\?.*)?$/, route =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: cart }) }),
  );
  await page.route(/\/backend\/cart\/checkout$/, route => {
    checkouts++;
    cart = [];
    return route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ success: true, data: order }) });
  });
  await page.route(new RegExp("/backend/orders/" + order.id + "$"), route =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: order }) }),
  );
  await page.route(new RegExp("/backend/payments/orders/" + order.id + "$"), route =>
    route.fulfill({ status: payment ? 200 : 404, contentType: "application/json",
      body: JSON.stringify(payment ? { success: true, data: payment } : { success: false, message: "Payment not found" }) }),
  );
  await page.route(new RegExp("/backend/payments/orders/" + order.id + "/simulate$"), async route => {
    paymentRequests++;
    const body = route.request().postDataJSON() as { outcome: string };
    payment = { id: "104959c3-b699-4259-beb3-6357a1c168e5", orderId: order.id, status: body.outcome === "success" ? "succeeded" : "failed", amount: product.price, currency: "USD", createdAt: order.createdAt };
    await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ success: true, data: payment }) });
  });

  await page.goto("/cart");
  await expect(page.getByRole("heading", { name: "Shopping cart" })).toBeVisible();
  await expect(page.getByText(product.name)).toBeVisible();
  await page.getByRole("button", { name: /place demo order/i }).click();
  await expect(page).toHaveURL(new RegExp("/orders/" + order.id));
  await expect(page.getByRole("heading", { name: "Simulated payment" })).toBeVisible();
  await page.getByRole("button", { name: "Simulate successful payment" }).click();
  await expect(page.getByRole("heading", { name: "Payment succeeded" })).toBeVisible();
  expect(checkouts).toBe(1);
  expect(paymentRequests).toBe(1);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Payment succeeded" })).toBeVisible();
  await page.goto("/cart");
  await expect(page.getByText("Your cart is looking a little empty.")).toBeVisible();
});

test("failed payment outcome is displayed and cannot be resubmitted from the UI", async ({ page }) => {
  await customerSession(page);
  await page.route(new RegExp("/backend/orders/" + order.id + "$"), route =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: order }) }),
  );
  let payment: Record<string, unknown> | undefined;
  await page.route(new RegExp("/backend/payments/orders/" + order.id + "$"), route =>
    route.fulfill({ status: payment ? 200 : 404, contentType: "application/json",
      body: JSON.stringify(payment ? { success: true, data: payment } : { success: false, message: "Payment not found" }) }),
  );
  await page.route(new RegExp("/backend/payments/orders/" + order.id + "/simulate$"), route => {
    payment = { id: "104959c3-b699-4259-beb3-6357a1c168e5", orderId: order.id, status: "failed", amount: product.price, currency: "USD", createdAt: order.createdAt };
    return route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ success: true, data: payment }) });
  });
  await page.goto("/orders/" + order.id);
  await page.getByRole("button", { name: "Simulate failed payment" }).click();
  await expect(page.getByRole("heading", { name: "Payment failed" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Simulate successful payment" })).toHaveCount(0);
});

test("checkout failure keeps cart visible and displays a message", async ({ page }) => {
  await customerSession(page);
  await page.route(/\/backend\/cart(?:\?.*)?$/, route =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: [cartItem] }) }),
  );
  await page.route(/\/backend\/cart\/checkout$/, route =>
    route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({ success: false, message: "Insufficient stock" }) }),
  );
  await page.goto("/cart");
  await page.getByRole("button", { name: /place demo order/i }).click();
  await expect(page.getByRole("alert")).toContainText("Insufficient stock");
  await expect(page.getByText(product.name)).toBeVisible();
});

test("order history filters orders by status", async ({ page }) => {
  await customerSession(page);
  await page.route(/\/backend\/orders\?.*$/, route => {
    const url = new URL(route.request().url());
    const selected = url.searchParams.get("status");
    const rows = selected && selected !== order.status ? [] : [order];
    return route.fulfill({ status: 200, contentType: "application/json",
      body: JSON.stringify({ data: rows, pagination: { page: 1, limit: 10, total: rows.length, totalPages: rows.length ? 1 : 0 } }) });
  });
  await page.goto("/orders");
  await expect(page.getByText("ORDER #" + order.id.slice(0, 8).toUpperCase())).toBeVisible();
  await page.getByLabel("Filter by status").selectOption("delivered");
  await expect(page.getByText("No orders yet")).toBeVisible();
  await page.getByLabel("Filter by status").selectOption("pending");
  await expect(page.getByText("ORDER #" + order.id.slice(0, 8).toUpperCase())).toBeVisible();
});
