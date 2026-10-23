import { eq } from "drizzle-orm";
import { query } from "../db/index.js";
import { customers, users } from "../db/schema.js";
class AuthRepository {
  async findByEmail(email: string) {
    const [user] = await query.select().from(users).where(eq(users.email, email)).limit(1);
    return user ?? null;
  }
  async findById(id: string) {
    const [user] = await query.select().from(users).where(eq(users.id, id)).limit(1);
    return user ?? null;
  }
  async register(data: { name: string; email: string; passwordHash: string }) {
    return query.transaction(async tx => {
      const [customer] = await tx.insert(customers).values({ name: data.name, email: data.email }).returning();
      if (!customer) throw new Error("Customer registration failed");
      const [user] = await tx.insert(users).values({
        email: data.email, passwordHash: data.passwordHash, role: "customer", customerId: customer.id,
      }).returning();
      if (!user) throw new Error("User registration failed");
      return { id: user.id, email: user.email, role: user.role, customerId: customer.id };
    });
  }
}
export default new AuthRepository();
