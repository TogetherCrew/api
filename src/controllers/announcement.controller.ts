import { Response } from 'express';
import { IAuthRequest } from '../interfaces/Request.interface';
import { ApiError, catchAsync, pick } from "../utils";
import { communityService } from '../services';
import httpStatus from 'http-status';
import { IAnnouncement } from '@togethercrew.dev/db';
import { announcementService } from '../services';

function getAnnouncementFieldsToReturn(announcement: IAnnouncement): object {
    return {
        id: (announcement as any).id,
        title: announcement.title,
        scheduledAt: announcement.scheduledAt,
        draft: announcement.draft,
        data: announcement.data,
        community: announcement.community,
    };
}

const createAnnouncement = catchAsync(async function (req: IAuthRequest, res: Response) {
    const { title, communityId, scheduledAt, draft, data } = req.body;
    const community = await communityService.getCommunityByFilter({ _id: req.body.communityId, users: req.user.id });
    if (!community) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Community not found');
    }

    const dataToSave = data.map((data: any) => ({...data, platform: data.platformId }))
    const announcementData = { 
        title, 
        community: communityId, 
        scheduledAt, 
        draft, 
        data: dataToSave,
        createdBy: req.user.id,
        updatedBy: req.user.id
    };

    let announcement;
    if(draft)announcement = await announcementService.createDraftAnnouncement(announcementData);
    else announcement = await announcementService.createScheduledAnnouncement(announcementData);

    announcement = getAnnouncementFieldsToReturn(announcement);
    res.status(httpStatus.CREATED).send(announcement);
})

const getAnnouncements = catchAsync(async function (req: IAuthRequest, res: Response) {
    const queryFilter = pick(req.query, ['communityId', 'startDate', 'endDate']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);

    const community = await communityService.getCommunityByFilter({ _id: queryFilter.communityId, users: req.user.id });
    if (!community) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Community not found');
    }

    const dbFilter: Record<string, any> = {};
    dbFilter.community = queryFilter.communityId;
    
    if(queryFilter.startDate && queryFilter.endDate) dbFilter.scheduledAt = { $gte: queryFilter.startDate, $lte: queryFilter.endDate };
    else if(queryFilter.startDate) dbFilter.scheduledAt = { $gte: queryFilter.startDate };
    else if(queryFilter.endDate) dbFilter.scheduledAt = { $lte: queryFilter.endDate };

    const paginatedAnnouncement = await announcementService.queryAnnouncements(dbFilter, options);
    paginatedAnnouncement.results = paginatedAnnouncement.results.map(getAnnouncementFieldsToReturn);
    res.status(httpStatus.OK).send(paginatedAnnouncement);
})

const getOneAnnouncement = catchAsync(async function (req: IAuthRequest, res: Response) {
    const { announcementId } = req.params;

    const announcement = await announcementService.getAnnouncementById(announcementId);
    if (!announcement) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Announcement not found');
    }

    const community = await communityService.getCommunityByFilter({ _id: announcement.community, users: req.user.id });
    if (!community) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Announcement not found');
    }

    res.status(httpStatus.OK).send(getAnnouncementFieldsToReturn(announcement));
})

export default {
    createAnnouncement,
    getAnnouncements,
    getOneAnnouncement
};
