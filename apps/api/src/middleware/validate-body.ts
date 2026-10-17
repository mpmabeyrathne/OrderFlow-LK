import type { RequestHandler } from "express";
import type { z } from "zod";

export const validateBody = (
    schema: z.ZodType,
): RequestHandler => {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: result.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message,
                })),
                requestId: req.requestId,
            });
        }

        req.body = result.data;
        next();
    };
};