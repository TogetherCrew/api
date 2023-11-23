import httpStatus from "http-status";
import { Types } from "mongoose";
import { ApiError } from "../utils";
import { Request, Response, NextFunction } from "express";
import { IAuthAndPlatform } from "../interfaces";
import { platformService } from '../services';


const platform = (platformName?: string) => async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as IAuthAndPlatform;
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
            disconnectedAt: null
        });
        if (!platform) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Platform not found');
        }
        if (platformName && platformName !== platform.name) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Platform is not valid for this API');

        }
        authReq.platform = platform;
        return next();
    } catch (error) {
        return next(error);
    }
};

export default platform;