import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/repositories/order.repository.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    fileParallelism: false,
  },
});
