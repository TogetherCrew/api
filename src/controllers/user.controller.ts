import { Response } from 'express';
import { Types } from 'mongoose';
import { userService, communityService } from '../services';
import { IAuthRequest } from '../interfaces/Request.interface';
import { catchAsync, ApiError, roleUtil } from '../utils';
import httpStatus from 'http-status';

const getUser = catchAsync(async function (req: IAuthRequest, res: Response) {
  res.send(req.user);
});
const updateUser = catchAsync(async function (req: IAuthRequest, res: Response) {
  const user = await userService.updateUserById(new Types.ObjectId(req.user.id), req.body);
  res.send(user);
});

const getUserRolesInCommunity = catchAsync(async function (req: IAuthRequest, res: Response) {
  const community = await communityService.getCommunityByFilter({ _id: req.params.communityId });
  if (!community) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Community not found');
  }
  const userRolesInCommunity = await roleUtil.getUserRolesForCommunity(req.user, new Types.ObjectId(req.params.communityId))
  res.send(userRolesInCommunity);
});

export default {
  getUser,
  updateUser,
  getUserRolesInCommunity
};
