import { Response } from 'express';
import { IAuthRequest } from '../interfaces/Request.interface';
import { ApiError, catchAsync, pick } from "../utils";
import { communityService } from '../services';
import httpStatus from 'http-status';
import { IAnnouncement } from '@togethercrew.dev/db';
import { announcementService } from '../services';
import moment from 'moment';

async function enhanceAnnouncementData(announcementData: Array<any>) {
    const enhancedData = [];
    for (const announcementD of announcementData) {
        const enhancedOptions = await announcementService.enhanceAnnouncementDataOption(announcementD.platform, announcementD.options);
        enhancedData.push({ platform: announcementD.platform, template: announcementD.template, options: enhancedOptions });
    }
    return enhancedData;
}

async function getAnnouncementFieldsToReturn(announcement: IAnnouncement) {
    const newData = await enhanceAnnouncementData(announcement.data)
    
    return {
        id: (announcement as any).id,
        title: announcement.title,
        scheduledAt: announcement.scheduledAt,
        draft: announcement.draft,
        data: newData,
        community: announcement.community,
    };
}

const createAnnouncement = catchAsync(async function (req: IAuthRequest, res: Response) {
    const { title, communityId, scheduledAt, draft, data } = req.body;
    const community = await communityService.getCommunityByFilter({ _id: req.body.communityId, users: req.user.id });
    if (!community) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Community not found');
    }

    const dataToSave = data.map((data: any) => ({ ...data, platform: data.platformId }))
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
    if (draft) announcement = await announcementService.createDraftAnnouncement(announcementData);
    else announcement = await announcementService.createScheduledAnnouncement(announcementData);

    announcement = await getAnnouncementFieldsToReturn(announcement);
    res.status(httpStatus.CREATED).send(announcement);
})

const updateAnnouncement = catchAsync(async function (req: IAuthRequest, res: Response) {
    const { announcementId } = req.params;
    const { title, scheduledAt, draft, data } = req.body;

    const announcement = await announcementService.getAnnouncementById(announcementId);
    if (!announcement) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Announcement not found');
    }

    const community = await communityService.getCommunityByFilter({ _id: announcement.community, users: req.user.id });
    if (!community) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Announcement not found');
    }

    const dataToSave = data?.map((data: any) => ({ ...data, platform: data.platformId }))
    const announcementData = {
        title,
        scheduledAt,
        draft,
        data: dataToSave,
        updatedBy: req.user.id
    };

    // TODO: we can also refactor below condition into two functions, but It's good for now
    let newAnnouncement;
    if (announcement.draft == true) {
        if (draft == true || draft == undefined) {
            newAnnouncement = await announcementService.findOneAnnouncementAndUpdate({ _id: announcementId }, announcementData);
        }
        if (draft == false) {
            newAnnouncement = await announcementService.updateAnnouncementAndAddJob(announcementId, announcement, announcementData)
        }
    }

    if (announcement.draft == false) {
        if (draft == false || draft == undefined) {
            if (scheduledAt == undefined || announcement.scheduledAt.toISOString() == scheduledAt.toISOString()) {
                newAnnouncement = await announcementService.findOneAnnouncementAndUpdate({ _id: announcementId }, announcementData);
            }
            else {
                newAnnouncement = await announcementService.updateAndRescheduleAnnouncement(announcementId, announcement, announcementData)
            }
        }
        if (draft == true) {
            newAnnouncement = await announcementService.updateAnnouncementAndRemoveJob(announcementId, announcement, announcementData)
        }
    }

    res.status(httpStatus.OK).send(await getAnnouncementFieldsToReturn(newAnnouncement as IAnnouncement))
})

const getAnnouncements = catchAsync(async function (req: IAuthRequest, res: Response) {
    const queryFilter = pick(req.query, ['communityId', 'startDate', 'endDate', 'timeZone']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);

    const community = await communityService.getCommunityByFilter({ _id: queryFilter.communityId, users: req.user.id });
    if (!community) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Community not found');
    }

    const utcStartDate = queryFilter.startDate && moment.tz(queryFilter.startDate, queryFilter.timeZone);
    const utcEndDate = queryFilter.endDate && moment.tz(queryFilter.endDate, queryFilter.timeZone);
    const dbFilter: Record<string, any> = {};
    dbFilter.community = queryFilter.communityId;


    if(utcStartDate && utcEndDate) dbFilter.scheduledAt = { $gte: utcStartDate, $lte: utcEndDate };
    else if(utcStartDate) dbFilter.scheduledAt = { $gte: utcStartDate };
    else if(utcEndDate) dbFilter.scheduledAt = { $lte: utcEndDate };

    const paginatedAnnouncement = await announcementService.queryAnnouncements(dbFilter, options);
    paginatedAnnouncement.results = await Promise.all( paginatedAnnouncement.results.map(async (announcement: any) => await getAnnouncementFieldsToReturn(announcement as IAnnouncement)))
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

    res.status(httpStatus.OK).send(await getAnnouncementFieldsToReturn(announcement));
})

const deleteAnnouncement = catchAsync(async function (req: IAuthRequest, res: Response) {
    const { announcementId } = req.params;
    // TODO: check with Cryil we should either hard delete or soft delete the announcement

    const announcement = await announcementService.getAnnouncementById(announcementId);
    if (!announcement) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Announcement not found');
    }

    const community = await communityService.getCommunityByFilter({ _id: announcement.community, users: req.user.id });
    if (!community) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Announcement not found');
    }

    await announcementService.deleteAnnouncementById(announcementId);
    res.status(httpStatus.NO_CONTENT).send();
})

export default {
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    getAnnouncements,
    getOneAnnouncement
};
