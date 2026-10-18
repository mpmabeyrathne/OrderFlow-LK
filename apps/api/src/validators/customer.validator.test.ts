import { describe, expect, it } from "vitest";
import { createCustomerSchema, getCustomerByIdSchema } from "./customer.validator.js";

describe("createCustomerSchema", () => {
    it("should accept a valid customer", () => {
        const result = createCustomerSchema.safeParse({
            name: 'pasindu',
            email: 'pasindu@gmail.com'
        })

        expect(result.success).toBe(true);
    });

    it("should reject email unavailable", () => {
        const result = createCustomerSchema.safeParse({
            name: 'pasindu',
        })

        expect(result.success).toBe(false);
    });

    it("should reject name unavailable", () => {
        const result = createCustomerSchema.safeParse({
            email: 'pasindu@gmail.com',
        })

        expect(result.success).toBe(false);
    });
})

describe("getAllCustomers", () => {
    it("should accept a valid id", () => {
        const result = getCustomerByIdSchema.safeParse({
            id: '7b241615-0d27-4d58-92c9-8b720479419e',
        })

        expect(result.success).toBe(true);
    });
})