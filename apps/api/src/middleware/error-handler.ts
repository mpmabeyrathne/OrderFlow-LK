import type { ErrorRequestHandler, Request, Response, NextFunction } from "express";
import logger from "../config/logger.js";

const errorHandler: ErrorRequestHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
        return next(err);
    }

    logger.error(
        { err, requestId: req.requestId },
        "Request failed"
    );

    return res.status(500).json({
        success: false,
        message: "Internal server error",
        requestId: req.requestId,
    });
}

export default errorHandler;