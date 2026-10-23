import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/repositories/order.repository.test.ts", "src/integration/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    setupFiles: ["./test/setup-integration.ts"],
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 60000,
  },
});
