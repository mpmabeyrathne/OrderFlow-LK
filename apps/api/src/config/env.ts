import z from "zod";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

const testMode = process.env.NODE_ENV === "test";
const ENV = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  NODE_ENV: z.enum(["dev", "prod", "stage", "test"]).default("dev"),
  // Unit tests never connect to this placeholder DB. Integration tests require a real DB_URL.
  DB_URL: z.string().min(1).default(testMode ? "postgresql://unused:unused@localhost:5432/orderflow_test_placeholder" : undefined),
  // Only the test process can use this non-production default.
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters")
    .default(testMode ? "orderflow-unit-tests-only-do-not-use-this-secret-in-production" : undefined),
});
const env = ENV.parse(process.env);
export default env;
