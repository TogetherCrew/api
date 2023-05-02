import httpStatus from "http-status";
import { ApiError } from "../utils";
import { Request, Response, NextFunction } from "express";
import config from '../config';

const apiKey = () => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const apiKey = req.get('API-Key');
        if (!apiKey || apiKey !== config.bridgeAPIKeys) {
            return next(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'))
        } else {
            return next()
        }
    }
}

export default apiKey;