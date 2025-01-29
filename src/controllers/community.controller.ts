import { Response } from 'express';
import httpStatus from 'http-status';

import { PlatformNames } from '@togethercrew.dev/db';

import { IAuthRequest } from '../interfaces/Request.interface';
import { communityService, discordServices, platformService, userService } from '../services';
import { catchAsync, pick, roleUtil } from '../utils';

const createCommunity = catchAsync(async function (req: IAuthRequest, res: Response) {
  const community = await communityService.createCommunity({ ...req.body, users: [req.user.id] });
  await userService.addCommunityToUserById(req.user.id, community.id);
  res.status(httpStatus.CREATED).send(community);
});

const getCommunities = catchAsync(async function (req: IAuthRequest, res: Response) {
  const filter = pick(req.query, ['name']);
  const { includeAllCommunities } = req.query as { includeAllCommunities?: boolean };

  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  if (filter.name) {
    filter.name = {
      $regex: filter.name,
      $options: 'i',
    };
  }
  options.populate = {
    path: 'platforms',
    select: '_id name metadata disconnectedAt createdAt updatedAt',
  };

  if (!includeAllCommunities) {
    const allMatchedCommunities = await communityService.getCommunities(filter);

    const userCommunities = await roleUtil.getUserCommunities(req.user, allMatchedCommunities);
    const userCommunityIds = userCommunities.map((community) => community?.id);

    filter._id = { $in: userCommunityIds };

    const paginatedResult = await communityService.queryCommunities(filter, options);

    paginatedResult.results = paginatedResult.results.map((communityDoc: any) => {
      const docObj = communityDoc.toObject();
      docObj.userHasAccess = true;
      return docObj;
    });

    return res.status(httpStatus.OK).send(paginatedResult);
  }

  const paginatedAllCommunities = await communityService.queryCommunities(filter, options);

  paginatedAllCommunities.results = await Promise.all(
    paginatedAllCommunities.results.map(async (communityDoc: any) => {
      const docObj = communityDoc.toObject();
      const userRoles = await roleUtil.getUserRolesForCommunity(req.user, communityDoc);
      docObj.userHasAccess = userRoles.length > 0;
      return docObj;
    }),
  );

  return res.status(httpStatus.OK).send(paginatedAllCommunities);
});
const getCommunity = catchAsync(async function (req: IAuthRequest, res: Response) {
  let community = req.community;
  if (community) {
    await community?.populate({
      path: 'platforms',
      select: '_id name metadata disconnectedAt createdAt updatedAt',
    });
    community = await communityService.populateRoles(community);
  }
  res.send(community);
});
const updateCommunity = catchAsync(async function (req: IAuthRequest, res: Response) {
  if (req.body.roles && req.community) {
    await communityService.validateRoleChanges(req.user, req.community, req.body.roles);
  }
  const community = await communityService.updateCommunityByFilter({ _id: req.params.communityId }, req.body);
  res.send(community);
});
const deleteCommunity = catchAsync(async function (req: IAuthRequest, res: Response) {
  const platforms = await platformService.queryPlatforms({ community: req.params.communityId }, {});
  for (let i = 0; i < platforms.results.length; i++) {
    if (platforms.results[i].name === PlatformNames.Discord) {
      await discordServices.coreService.leaveBotFromGuild(platforms.results[i].metadata.id);
    }
  }
  await communityService.deleteCommunityByFilter({ _id: req.params.communityId });
  res.status(httpStatus.NO_CONTENT).send();
});

export default {
  createCommunity,
  getCommunities,
  getCommunity,
  updateCommunity,
  deleteCommunity,
};
