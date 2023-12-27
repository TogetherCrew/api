import { Response } from 'express';
import { IAuthRequest } from '../interfaces/Request.interface';
import { ApiError, catchAsync } from "../utils";
import { communityService } from '../services';
import httpStatus from 'http-status';

const createAnnouncement = catchAsync(async function (req: IAuthRequest, res: Response) {
    const community = await communityService.getCommunityByFilter({ _id: req.body.community, users: req.user.id });
    if (!community) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Community not found');
    }
    
    console.log(req.body)
    res.send({ status: 'ok' })
})

export default {
    createAnnouncement
};
