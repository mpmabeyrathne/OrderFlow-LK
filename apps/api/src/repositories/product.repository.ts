import { eq } from "drizzle-orm";
import { query } from "../db/index.js";
import { products } from "../db/schema.js";

export type CreateProductData = {
    name: string;
    description?: string;
    stockQuantity: number;
    price: string;
    isActive: boolean;
};

export type UpdateProductData = {
    name?: string;
    description?: string;
    price?: string;
    isActive?: boolean;
};

class ProductRepository {
    async create(data: CreateProductData) {
        const [prodcut] = await query
            .insert(products)
            .values(data)
            .returning();

        return prodcut;
    }

    async findAll() {
        return query.select().from(products);
    }

    async findById(id: string) {
        const [prodcut] = await query
            .select()
            .from(products)
            .where(eq(products.id, id))
            .limit(1);

        return prodcut ?? null;
    }

    async updateProduct(id: string, data: UpdateProductData) {
        const [product] = await query
            .update(products)
            .set(data)
            .where(eq(products.id, id))
            .returning();
    
        return product ?? null;
    }
}

export default new ProductRepository();