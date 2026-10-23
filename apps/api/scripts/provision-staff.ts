import { eq } from "drizzle-orm";
import { z } from "zod";
import { query, pool } from "../src/db/index.js";
import { users } from "../src/db/schema.js";
import { hashPassword } from "../src/services/password.service.js";

// Run with ORDERFLOW_STAFF_PASSWORD supplied from a secure source (not a CLI argument).
const role = z.enum(["admin", "manager"]).parse(process.argv[2]);
const email = z.email().trim().toLowerCase().parse(process.argv[3]);
const password = z.string().min(12).max(128).parse(process.env.ORDERFLOW_STAFF_PASSWORD);
async function main() {
  const [existing] = await query.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) throw new Error("Account already exists; refusing to change role");
  const passwordHash = await hashPassword(password);
  await query.insert(users).values({ email, passwordHash, role, customerId: null });
  console.log("Provisioned staff account:", email, role);
}
try { await main(); }
catch (error) { console.error("Staff provisioning failed:", error instanceof Error ? error.message : "Unknown error"); process.exitCode = 1; }
finally { delete process.env.ORDERFLOW_STAFF_PASSWORD; await pool.end(); }
