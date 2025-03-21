import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import { Types } from 'mongoose';
import passport from 'passport';

import { UserRole } from '../interfaces';
import { communityService, moduleService, platformService } from '../services';
import { ApiError, pick, roleUtil } from '../utils';

const verifyCallback =
  (req: Request, resolve: Function, reject: Function, requiredRights: any) =>
  async (err: Error | null, user: any, info: any): Promise<void> => {
    if (err || info || !user) {
      return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
    }

    req.user = user;

    if (requiredRights.length) {
      await verifyRights(req, user, requiredRights, reject);
    }

    resolve();
  };

async function verifyRights(req: Request, user: any, requiredRights: UserRole[], reject: Function): Promise<void> {
  let community = await getCommunity(req, reject);
  if (!community) return;

  const userRolesInCommunity = await roleUtil.getUserRolesForCommunity(user, community);
  const hasRequiredRights = requiredRights.some((requiredRight) => userRolesInCommunity.includes(requiredRight));

  if (!hasRequiredRights) {
    return reject(new ApiError(httpStatus.FORBIDDEN, 'Forbidden!'));
  }
}

async function getCommunity(req: Request, reject: Function): Promise<any | null> {
  try {
    const ids = pick({ ...req.query, ...req.body, ...req.params }, [
      'communityId',
      'community',
      'platformId',
      'moduleId',
    ]);
    let communityId: string | null = null,
      platformId: string | null = null,
      moduleId: string | null = null;

    if (ids.communityId) {
      communityId = ids.communityId;
    } else if (ids.community) {
      communityId = ids.community;
    } else if (ids.platformId) {
      platformId = ids.platformId;
    } else if (ids.moduleId) {
      moduleId = ids.moduleId;
    }

    if (communityId !== null && !Types.ObjectId.isValid(communityId)) {
      reject(new ApiError(httpStatus.BAD_REQUEST, 'Invalid communityId'));
    }

    if (platformId !== null && !Types.ObjectId.isValid(platformId)) {
      reject(new ApiError(httpStatus.BAD_REQUEST, 'Invalid platformId'));
    }

    if (moduleId !== null && !Types.ObjectId.isValid(moduleId)) {
      reject(new ApiError(httpStatus.BAD_REQUEST, 'Invalid moduleId'));
    }
    if (communityId) {
      const community = await communityService.getCommunityById(new Types.ObjectId(communityId));
      if (community) {
        req.community = community;
        return community;
      } else {
        reject(new ApiError(httpStatus.NOT_FOUND, 'Community not found!'));
      }
    } else if (platformId) {
      const platform = await platformService.getPlatformById(new Types.ObjectId(platformId));
      if (!platform) {
        reject(new ApiError(httpStatus.NOT_FOUND, 'Platform not found!'));
        return null;
      }

      const community = await communityService.getCommunityById(new Types.ObjectId(platform.community));
      if (community) {
        req.platform = platform;
        req.community = community;
        return community;
      } else {
        reject(new ApiError(httpStatus.NOT_FOUND, 'Community not found!'));
      }
    } else if (moduleId) {
      const module = await moduleService.getModuleById(new Types.ObjectId(moduleId));
      if (!module) {
        reject(new ApiError(httpStatus.NOT_FOUND, 'Module not found!'));
        return null;
      }

      const community = await communityService.getCommunityById(new Types.ObjectId(module.community));
      if (community) {
        req.module = module;
        req.community = community;
        return community;
      } else {
        reject(new ApiError(httpStatus.NOT_FOUND, 'Community not found!'));
      }
    }
  } catch (error) {
    reject(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'An error occurred'));
  }
  return null;
}

const auth = (...requiredRights: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    return new Promise((resolve, reject) => {
      passport.authenticate('jwt', { session: false }, verifyCallback(req, resolve, reject, requiredRights))(
        req,
        res,
        next,
      );
    })
      .then(() => next())
      .catch((err) => next(err));
  };
};
export default auth;
