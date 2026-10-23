
import { and, eq, gte, inArray, sql } from "drizzle-orm";
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
        const [product] = await query
            .insert(products)
            .values(data)
            .returning();

        return product;
    }

    async findAll() {
        return query.select().from(products);
    }

    async findById(id: string) {
        const [product] = await query
            .select()
            .from(products)
            .where(eq(products.id, id))
            .limit(1);

        return product ?? null;
    }

    async updateProduct(id: string, data: UpdateProductData) {
        const [product] = await query
            .update(products)
            .set({
                ...data,
                updatedAt: new Date(),
            })
            .where(eq(products.id, id))
            .returning();

        return product ?? null;
    }

    async updateStock(id: string, stockQuantity: number, expectedStockQuantity: number) {
        const [product] = await query
            .update(products)
            .set({
                stockQuantity,
                updatedAt: new Date(),
            })
            .where(and(eq(products.id, id), eq(products.stockQuantity, expectedStockQuantity)))
            .returning();

        return product ?? null;
    }

    async decreaseStock(id: string, quantity: number) {
        const [product] = await query
            .update(products)
            .set({
                stockQuantity: sql`${products.stockQuantity} - ${quantity}`,
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(products.id, id),
                    gte(products.stockQuantity, quantity),
                ),
            )
            .returning();

        return product ?? null;
    }

    async increaseStock(id: string, quantity: number) {
        const [product] = await query
            .update(products)
            .set({
                stockQuantity: sql`${products.stockQuantity} + ${quantity}`,
                updatedAt: new Date(),
            })
            .where(eq(products.id, id))
            .returning();

        return product ?? null;
    }

}

export default new ProductRepository();
