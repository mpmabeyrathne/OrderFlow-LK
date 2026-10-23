import z from "zod";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

// Vitest sets NODE_ENV=test. Provide non-production placeholders for isolated unit tests.
// Database integration tests must explicitly supply their own dedicated DB_URL.
const testMode = process.env.NODE_ENV === "test";
const values = { ...process.env };
if (testMode) {
  values.DB_URL ??= "postgresql://unused:unused@localhost:5432/orderflow_test_placeholder";
  values.JWT_SECRET ??= "orderflow-unit-tests-only-do-not-use-this-secret-in-production";
}

const ENV = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  NODE_ENV: z.enum(["dev", "prod", "stage", "test"]).default("dev"),
  DB_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
});

const env = ENV.parse(values);
export default env;
