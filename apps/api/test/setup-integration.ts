// Runs before any application imports. Prevents HTTP integration tests from
// accidentally using the normal DB_URL loaded by the development environment.
const testDatabaseUrl = process.env.TEST_DB_URL;
if (!testDatabaseUrl) {
  throw new Error("TEST_DB_URL is required for integration tests. Use a separate migrated test database.");
}
if (testDatabaseUrl === process.env.DB_URL) {
  throw new Error("TEST_DB_URL must not equal DB_URL; refusing to use the development database.");
}
process.env.DB_URL = testDatabaseUrl;
