
import type { Request, Response } from "express";
import customerService from "../services/customer.service.js";
import logger from "../config/logger.js";

class CustomerController {
    createCustomer = async (req: Request, res: Response) => {
        const { name, email, phone } = req.body ?? {};

        if (
            typeof name !== "string" ||
            !name.trim() ||
            typeof email !== "string" ||
            !email.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Name and email are required",
            });
        }

        const customer = await customerService.createCustomer({
            name: name.trim(),
            email: email.trim(),
            ...(typeof phone === "string" ? { phone: phone.trim() } : {}),
        });

        logger.info({ customerId: customer.id }, "Customer created");

        return res.status(201).json({
            success: true,
            data: customer,
        });
    };

    getCustomers = async (_req: Request, res: Response) => {
        const customers = await customerService.getCustomers();

        return res.status(200).json({
            success: true,
            data: customers,
        });
    };

    getCustomerById = async (req: Request, res: Response) => {
        const { id } = req.params;

        if (typeof id !== "string") {
            return res.status(400).json({
                success: false,
                message: "Invalid customer ID",
            });
        }

        const uuidPattern =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

        if (!uuidPattern.test(id)) {
            return res.status(400).json({
                success: false,
                message: "Customer ID must be a valid UUID",
            });
        }

        const customer = await customerService.getCustomerById(id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: customer,
        });
    };
}

export default new CustomerController();
