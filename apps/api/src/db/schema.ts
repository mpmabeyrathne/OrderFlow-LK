
import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  timestamp,
  pgEnum,
  index,
  check,
  boolean,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", ["customer", "admin", "manager"]);
export type UserRole = "customer" | "admin" | "manager";
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").default("customer").notNull(),
  customerId: uuid("customer_id").unique().references(() => customers.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [check("users_role_customer_link_check", sql`(${table.role} = 'customer' AND ${table.customerId} IS NOT NULL) OR (${table.role} <> 'customer' AND ${table.customerId} IS NULL)`)]);
export const cartItems = pgTable("cart_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("cart_items_user_product_unique").on(table.userId, table.productId),
  index("cart_items_user_idx").on(table.userId),
  check("cart_items_quantity_positive", sql`${table.quantity} > 0 AND ${table.quantity} <= 100`),
]);

export const paymentStatusEnum = pgEnum("payment_status", ["succeeded", "failed"]);
export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").notNull().unique().references(() => orders.id, { onDelete: "restrict" }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  status: paymentStatusEnum("status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [check("payments_amount_nonnegative", sql`${table.amount} >= 0`)]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 150 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    phone: varchar("phone", { length: 30 }),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),

    status: orderStatusEnum("status").default("pending").notNull(),

    totalAmount: numeric("total_amount", {
      precision: 12,
      scale: 2,
    })
      .default("0.00")
      .notNull(),

    currency: varchar("currency", { length: 3 })
      .default("USD")
      .notNull(),

    notes: text("notes"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("orders_customer_id_idx").on(table.customerId),
    index("orders_status_idx").on(table.status),
    index("orders_created_at_idx").on(table.createdAt),
    check(
      "orders_total_amount_nonnegative",
      sql`${table.totalAmount} >= 0`,
    ),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),

    productName: varchar("product_name", { length: 200 }).notNull(),

    quantity: integer("quantity").notNull(),

    unitPrice: numeric("unit_price", {
      precision: 12,
      scale: 2,
    }).notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
      
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("order_items_order_id_idx").on(table.orderId),
    check("order_items_quantity_positive", sql`${table.quantity} > 0`),
    check("order_items_unit_price_nonnegative", sql`${table.unitPrice} >= 0`),
  ],
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),

    price: numeric("price", {
      precision: 12,
      scale: 2,
    }).notNull(),

    stockQuantity: integer("stock_quantity")
      .notNull()
      .default(0),

    isActive: boolean("is_active")
      .notNull()
      .default(true),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("products_price_nonnegative", sql`${table.price} >= 0`),
    check(
      "products_stock_nonnegative",
      sql`${table.stockQuantity} >= 0`,
    ),
    index("products_name_idx").on(table.name),
    index("products_is_active_idx").on(table.isActive),
  ],
);

export const productsRelations = relations(products, ({ many }) => ({
  orderItems: many(orderItems),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));
