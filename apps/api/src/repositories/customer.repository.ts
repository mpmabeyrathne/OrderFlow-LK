
import { eq } from "drizzle-orm";
import { query } from "../db/index.js";
import { customers } from "../db/schema.js";

export type CreateCustomerData = {
    name: string;
    email: string;
    phone?: string | null;
};

class CustomerRepository {
    async create(data: CreateCustomerData) {
        const [customer] = await query
            .insert(customers)
            .values(data)
            .returning();

        return customer;
    }

    async findAll() {
        return query.select().from(customers);
    }

    async findById(id: string) {
        const [customer] = await query
            .select()
            .from(customers)
            .where(eq(customers.id, id))
            .limit(1);

        return customer ?? null;
    }
}

export default new CustomerRepository();
