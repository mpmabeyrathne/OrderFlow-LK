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
process.env.DB_URL = testDatabaseUrl;
