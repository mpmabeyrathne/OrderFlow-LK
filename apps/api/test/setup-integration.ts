import dotenv from "dotenv";
dotenv.config({ quiet: true });

// Fail closed: tests must point at an explicitly supplied, isolated database.
const testDatabaseUrl = process.env.TEST_DB_URL;
if (!testDatabaseUrl) {
  throw new Error("TEST_DB_URL is required. Use a separate migrated test database.");
}
if (testDatabaseUrl === process.env.DB_URL) {
  throw new Error("TEST_DB_URL must differ from DB_URL (development database).");
}
if (!/^postgres(ql)?:\/\//.test(testDatabaseUrl)) {
  throw new Error("TEST_DB_URL must be a PostgreSQL connection URL.");
}
const dbHost = new URL(testDatabaseUrl).hostname.toLowerCase();
if (!dbHost || dbHost.includes("your_test_database_connection") || dbHost.includes("placeholder") ||
    ["example.com", "localhost", "127.0.0.1"].includes(dbHost)) {
  throw new Error(
    "TEST_DB_URL points to a placeholder or unsupported host. Use a separate, real, migrated Neon test database."
  );
}
process.env.DB_URL = testDatabaseUrl;
