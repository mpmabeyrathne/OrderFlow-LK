import { describe, expect, it } from "vitest";
import { productListSchema, orderListSchema } from "./list-query.validator.js";

describe("product catalog filters", () => {
  it("supplies safe defaults", () => {
    expect(productListSchema.parse({})).toMatchObject({ page:1, limit:20, sortBy:"createdAt", sortOrder:"desc" });
  });
  it("accepts supported query parameters", () => {
    expect(productListSchema.parse({ page:"2", limit:"5", search:"  chair  ", minPrice:"0", maxPrice:"99.99", isActive:"true", sortBy:"price", sortOrder:"asc" }))
      .toMatchObject({ page:2, limit:5, search:"chair", minPrice:0, maxPrice:99.99 });
  });
  it.each([{page:"0"},{limit:"101"},{page:"1.5"},{sortBy:"stockQuantity"},{sortOrder:"DROP TABLE"},{isActive:"yes"},{minPrice:"-1"},{minPrice:"10",maxPrice:"1"},{unknown:"x"},{search:"x".repeat(101)}])("rejects bad product query %j", q => {
    expect(productListSchema.safeParse(q).success).toBe(false);
  });
  it("validates order status and pages", () => {
    expect(orderListSchema.parse({ status:"pending", page:"3" })).toMatchObject({ status:"pending", page:3 });
    expect(orderListSchema.safeParse({status:"invalid"}).success).toBe(false);
  });
});
