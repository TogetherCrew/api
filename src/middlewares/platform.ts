import httpStatus from "http-status";
import { Types } from "mongoose";
import { ApiError } from "../utils";
import { Request, Response, NextFunction } from "express";
import { IAuthRequest } from "../interfaces";
import { platformService } from '../services';


const platform = () => async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as IAuthRequest;
    try {
        if (!authReq.params.platformId) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'PlatformId is required');
        }
        if (!Types.ObjectId.isValid(authReq.params.platformId)) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid platformId');
        }
        const platform = await platformService.getPlatformByFilter({
            _id: authReq.params.platformId,
            community: { $in: authReq.user?.communities },
        });
        if (!platform) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Platform not found');
        }
        authReq.platform = platform;
        return next();
    } catch (error) {
        return next(error);
    }
};

export default platform;