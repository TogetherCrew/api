import { Response } from 'express';
import { communityService, userService } from '../services';
import { IAuthRequest } from '../interfaces/Request.interface';
import { catchAsync, pick, ApiError } from "../utils";
import httpStatus from 'http-status';


const createCommunity = catchAsync(async function (req: IAuthRequest, res: Response) {
    const community = await communityService.createCommunity({ ...req.body, users: [req.user.id] });
    await userService.addCommunityToUserById(req.user.id, community.id);
    res.status(httpStatus.CREATED).send(community);
});

const getCommunities = catchAsync(async function (req: IAuthRequest, res: Response) {
    const filter = pick(req.query, ['name']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    if (filter.name) {
        filter.name = {
            $regex: filter.name,
            $options: 'i'
        };
    }
    options.populate = 'platforms';
    const result = await communityService.queryCommunities({ ...filter, users: req.user.id }, options);
    res.send(result);
});
const getCommunity = catchAsync(async function (req: IAuthRequest, res: Response) {
    const community = await communityService.getCommunityByFilter({ _id: req.params.communityId, users: req.user.id });
    if (!community) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Community not found');
    }
    res.send(community);
});
const updateCommunity = catchAsync(async function (req: IAuthRequest, res: Response) {
    const community = await communityService.updateCommunityByFilter({ _id: req.params.communityId, users: req.user.id }, req.body);
    res.send(community);
});
const deleteCommunity = catchAsync(async function (req: IAuthRequest, res: Response) {
    await communityService.deleteCommunityByFilter({ _id: req.params.communityId, users: req.user.id });
    res.status(httpStatus.NO_CONTENT).send();
});

export default {
    createCommunity,
    getCommunities,
    getCommunity,
    updateCommunity,
    deleteCommunity
}

