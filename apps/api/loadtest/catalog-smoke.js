// Run with: k6 run -e BASE_URL=http://localhost:3000 apps/api/loadtest/catalog-smoke.js
// Read-only smoke/load test: no orders or payments are created.
import http from "k6/http";
import { check, sleep } from "k6";
export const options = {
  scenarios: {
    catalog: { executor: "constant-vus", vus: 20, duration: "30s" },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1000"],
  },
};
const base = (__ENV.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
export default function () {
  const health = http.get(base + "/health");
  const catalog = http.get(base + "/products?page=1&limit=20&sortOrder=desc");
  check(health, { "health 200": response => response.status === 200 });
  check(catalog, { "catalog 200": response => response.status === 200 });
  sleep(1);
}
