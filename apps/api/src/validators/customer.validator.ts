import { z } from "zod";

export const createCustomerSchema = z.object({
    name: z.string().trim().min(1, "Name is required"),

    email: z
        .string()
        .trim()
        .min(1, "Email is required")
        .pipe(z.email({ error: "Invalid email address" })),

    phone: z
        .string()
        .trim()
        .optional(),
});

export const getCustomerByIdSchema = z.object({
    id: z
        .string()
        .uuid("Customer ID must be a valid UUID"),
});

export type GetCustomerByIdInput = z.infer<
    typeof getCustomerByIdSchema
>;

export type CreateCustomerInput = z.infer<
    typeof createCustomerSchema
>;