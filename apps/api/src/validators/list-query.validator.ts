import { z } from "zod";
import { AppError } from "../utils/app-error.js";

// Hard caps bound work per request and prevent huge offset/limit allocations.
const pagination = {
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};
export const productListSchema = z.strictObject({
  ...pagination,
  search: z.string().trim().max(100).optional(),
  isActive: z.enum(["true", "false"]).optional(),
  minPrice: z.coerce.number().nonnegative().finite().max(9999999999.99).multipleOf(0.01).optional(),
  maxPrice: z.coerce.number().nonnegative().finite().max(9999999999.99).multipleOf(0.01).optional(),
  sortBy: z.enum(["name", "price", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
}).refine(v => v.minPrice === undefined || v.maxPrice === undefined || v.minPrice <= v.maxPrice,
  { path: ["maxPrice"], message: "maxPrice must be at least minPrice" });
export const orderListSchema = z.strictObject({
  ...pagination,
  status: z.enum(["pending","confirmed","processing","shipped","delivered","cancelled"]).optional(),
  sortOrder: z.enum(["asc","desc"]).default("desc"),
});
export type ProductListQuery = z.infer<typeof productListSchema>;
export type OrderListQuery = z.infer<typeof orderListSchema>;
export function parseListQuery<T>(schema: z.ZodType<T>, query: unknown): T {
  const result = schema.safeParse(query);
  if (!result.success) {
    // Reject rather than silently ignoring unexpected or malformed filters.
    throw new AppError(400, "Invalid query parameters: " + result.error.issues.map(issue => issue.path.join(".") + " " + issue.message).join("; "));
  }
  return result.data;
}
