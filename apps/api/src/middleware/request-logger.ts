import type { Request, Response, NextFunction } from "express";
import logger from "../config/logger.js";
import crypto from "crypto"

const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const startHrTime = process.hrtime();
    const requestId = crypto.randomUUID();
    req.requestId = requestId;
    res.setHeader("x-request-id", requestId);

    res.on('finish', () => {
        const diff = process.hrtime(startHrTime);
        const durationInMs = (diff[0] * 1e3) + (diff[1] / 1e6);
        logger.info(
            {
                reqId: requestId,
                method: req.method,
                url: req.url,
                statusCode: res.statusCode,
                responseTime: Number(durationInMs.toFixed(2)),
            }
        );
    })
    next();
}
export default loggerMiddleware;