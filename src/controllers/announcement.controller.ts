import { Response } from 'express';
import { IAuthRequest } from '../interfaces/Request.interface';
import { ApiError, catchAsync } from "../utils";
import { communityService } from '../services';
import httpStatus from 'http-status';
import { addJobToAnnouncementQueue } from '../bullmq';
import { Announcement, IAnnouncement } from '@togethercrew.dev/db';
import { startSession } from 'mongoose';

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
        createdBy: "5f9f9b9b9b9b9b9b9b9b9b9b" as any,
        updatedBy: "5f9f9b9b9b9b9b9b9b9b9b9b" as any
    };

    let announcement;
    if(draft)announcement = await createDraftAnnouncement(announcementData);
    else announcement = await createScheduledAnnouncement(announcementData);

    announcement = getAnnouncementFieldsToReturn(announcement);
    res.status(httpStatus.CREATED).send(announcement);
})

const createDraftAnnouncement = async (announcementData: IAnnouncement) => {
    if(announcementData.draft === false) throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot create a draft announcement with draft set to false');

    const announcement = await Announcement.create(announcementData);
    return announcement;
}

const createScheduledAnnouncement = async (announcementData: IAnnouncement) => {
    const session = await startSession();
    session.startTransaction();
    try {
        const announcement = new Announcement(announcementData);
        await announcement.save({ session });

        // create a job and assign it to the announcement
        const job = await addJobToAnnouncementQueue(announcement.id, { announcementId: announcement.id }, announcementData.scheduledAt);
        announcement.jobId = job.id as number | undefined;

        await announcement.save({ session });

        await session.commitTransaction();
        return announcement;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
}

export default {
    createAnnouncement
};
