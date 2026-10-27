
import { and, eq, gte, lte, ilike, asc, desc, sql, type SQL } from "drizzle-orm";
import type { ProductListQuery } from "../validators/list-query.validator.js";
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

    async findAll(filters: ProductListQuery) {
        const conditions: SQL[] = [];
        if (filters.search) conditions.push(ilike(products.name, "%" + filters.search.replace(/[\\%_]/g, (char) => "\\" + char) + "%"));
        return query.select().from(products);
    }") + "%"));
        if (filters.isActive) conditions.push(eq(products.isActive, filters.isActive === "true"));
        if (filters.minPrice !== undefined) conditions.push(gte(products.price, filters.minPrice.toFixed(2)));
        if (filters.maxPrice !== undefined) conditions.push(lte(products.price, filters.maxPrice.toFixed(2)));
        const where = conditions.length ? and(...conditions) : undefined;
        const col = filters.sortBy === "price" ? products.price : filters.sortBy === "name" ? products.name : products.createdAt;
        const sort = filters.sortOrder === "asc" ? asc(col) : desc(col);
        const offset = (filters.page - 1) * filters.limit;
        const [rows, countRows] = await Promise.all([
            query.select().from(products).where(where).orderBy(sort, asc(products.id))
                .limit(filters.limit).offset(offset),
            query.select({ total: sql<number>`count(*)::int` }).from(products).where(where),
        ]);
        const total = countRows[0]?.total ?? 0;
        return { data: rows, pagination: { page: filters.page, limit: filters.limit,
            total, totalPages: Math.ceil(total / filters.limit) } };
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
