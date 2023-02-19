/* eslint-disable @typescript-eslint/no-explicit-any */
import passport from "passport";
import httpStatus from "http-status";
import { ApiError } from "../utils";
import { Request, Response, NextFunction } from "express";

// Verify Callback
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const verifyCallback = (req: Request, resolve: any, reject: any, requiredRights: any) => async (err: any, user: any, info: any) => {
    if (err || info || !user) {
        return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
    }
    req.user = user;
    resolve();
};

const auth = (...requiredRights: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        return new Promise((resolve, reject) => {
            passport.authenticate('jwt', { session: false }, verifyCallback(req, resolve, reject, requiredRights))(req, res, next);
        })
            .then(() => next())
            .catch((err) => next(err));
    }
}
export default auth;