
import type { ErrorRequestHandler } from "express";
import logger from "../config/logger.js";
import { AppError } from "../utils/app-error.js";

const errorHandler: ErrorRequestHandler = (
    err: unknown,
    req,
    res,
    next,
) => {
    if (res.headersSent) {
        return next(err);
    }

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            requestId: req.requestId,
        });
    }

    logger.error(
        { err, requestId: req.requestId },
        "Request failed",
    );

    return res.status(500).json({
        success: false,
        message: "Internal server error",
        requestId: req.requestId,
    });
};

export default errorHandler;
