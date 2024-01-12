import { Announcement, DatabaseManager, IAnnouncement } from "@togethercrew.dev/db";
import mongoose, { startSession } from "mongoose";
import { addJobToAnnouncementQueue, removeJobFromAnnouncementQueue } from "../bullmq";
import discordService from './discord';
import { Job } from "bullmq";
import config from "../config";
import sagaService from './saga.service';
import platformService from "./platform.service";

const createDraftAnnouncement = async (announcementData: IAnnouncement) => {
    if(announcementData.draft === false) throw new Error('Cannot create a draft announcement with draft set to false');

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

const updateAndRescheduleAnnouncement = async (announcementId: string, oldAnnouncement: IAnnouncement , updatedData: Partial<IAnnouncement>) => {
    const session = await startSession();
    session.startTransaction();
    try {
        const existingJobId = oldAnnouncement.jobId as string | undefined;
        if (existingJobId) {
            await removeJobFromAnnouncementQueue(existingJobId);
        }

        const newScheduledAt = updatedData.scheduledAt || oldAnnouncement.scheduledAt;
        const newJob = await addJobToAnnouncementQueue(announcementId, { announcementId }, newScheduledAt);
        
        const newAnnouncement = await Announcement.findOneAndUpdate({ _id: announcementId }, { ...updatedData, jobId: newJob.id }, { session, new: true });

        await session.commitTransaction();
        return newAnnouncement
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

const updateAnnouncementAndRemoveJob = async (announcementId: string, oldAnnouncement: IAnnouncement, updatedData: Partial<IAnnouncement>) => {
    const session = await startSession();
    session.startTransaction();
    try {
        if (!oldAnnouncement.jobId) {
            throw new Error('Job associated with the announcement not found');
        }

        const newAnnouncement = await Announcement.findOneAndUpdate({ _id: announcementId }, { ...updatedData, jobId: null }, { session, new: true });
        await removeJobFromAnnouncementQueue(oldAnnouncement.jobId as unknown as string);

        await session.commitTransaction();
        return newAnnouncement;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

const updateAnnouncementAndAddJob = async (announcementId: string, oldAnnouncement: IAnnouncement, updatedData: Partial<IAnnouncement>) => {
    const session = await startSession();
    session.startTransaction();
    try {
        if (oldAnnouncement.jobId) {
            throw new Error('Job associated with the announcement already exists');
        }
        
        const newScheduledAt = updatedData.scheduledAt || oldAnnouncement.scheduledAt;
        const newJob = await addJobToAnnouncementQueue(announcementId, { announcementId }, newScheduledAt);
        const newAnnouncement = await Announcement.findOneAndUpdate({ _id: announcementId }, { ...updatedData, jobId: newJob.id }, { session, new: true });

        await session.commitTransaction();
        return newAnnouncement;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

const findOneAnnouncementAndUpdate = async (filter: object, updateBody: Partial<IAnnouncement>) => {
    const announcement = await Announcement.findOneAndUpdate(filter, updateBody, { new: true });
    return announcement
}

/**
 * Query for announcements
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 */
const queryAnnouncements = async (filter: object, options: object) => {
    return Announcement.paginate(filter, options);
}

const getAnnouncementById = async (id: string) => {
    return await Announcement.findById(id);
}

const deleteAnnouncementById = async (announcementId: string) => {
    const announcement = await Announcement.findOne({ _id: announcementId });
    announcement?.remove() //TODO: change it to `deleteOne` once we have event for `deleteOne`/`deleteMany`

    return announcement
}

const onDestroyAnnouncement = async (announcementJobId: string) => {
    if(announcementJobId)
        await removeJobFromAnnouncementQueue(announcementJobId);
}

const bullMQTriggeredAnnouncement = async (job: Job) => {
    const announcementId = job.data.announcementId;

    // TODO: use function that main application use to connect to mongodb
    try {
        await mongoose.connect(config.mongoose.serverURL);
        console.log({ url: config.mongoose.serverURL }, 'Connected to MongoDB!');
    } catch (error) {
        console.log({ url: config.mongoose.serverURL, error }, 'Failed to connect to MongoDB!')
    }

    const announcement = await Announcement.findById(announcementId);

    console.log('$$$$$$$$$$$$$$$$$$')
    console.log("announcement", announcement)
    console.log('$$$$$$$$$$$$$$$$$$')

    announcement?.data.forEach(async (data) => {
        const communityId = announcement?.community
        const platformId = data?.platform
        const options = data?.options

        console.log('>>>>>>>>>>>>>>>>>>')
        console.log("[communityId] ", communityId)
        console.log("[platformId] ", platformId)
        console.log("[options] ", options)
        console.log('<<<<<<<<<<<<<<<<<<')

        const platform = await platformService.getPlatformByFilter({
            _id: platformId,
            disconnectedAt: null
        });
        const connection = await DatabaseManager.getInstance().getTenantDb(platform?.metadata?.id);

        const channelIds = (options as any)?.channelIds
        if(channelIds) {
            console.log("[channelIds] ", channelIds)

            // !Fire event for all channels
            sagaService.createAndStartAnnouncementSendMessageToChannelSaga(announcementId, channelIds)
        }

        const usernames = (options as any)?.usernames
        if(usernames) {
            console.log("[usernames] ", usernames)
            // extract userID from username
            const discordIds = await discordService.guildMemberService.getDiscordIdsFromUsernames(connection, usernames)

            // !Fire event for each userID
            discordIds.forEach((userId: string) => {
                sagaService.createAndStartAnnouncementSendMessageToUserSaga(announcementId, userId)
            })
        }

        const roleIds = (options as any)?.roleIds
        if(roleIds) {
            console.log("[roleIds] ", roleIds)
            // extract userID from roleID
            const discordIds = await discordService.roleService.getDiscordIdsFromRoleIds(connection, roleIds)

            // !Fire event for each userID
            discordIds.forEach((userId: string) => {
                sagaService.createAndStartAnnouncementSendMessageToUserSaga(announcementId, userId)
            })
        }
    })

    return announcement
}


export default {
    createDraftAnnouncement,
    bullMQTriggeredAnnouncement,
    createScheduledAnnouncement,
    updateAndRescheduleAnnouncement,
    updateAnnouncementAndRemoveJob,
    updateAnnouncementAndAddJob,
    findOneAnnouncementAndUpdate,
    deleteAnnouncementById,
    queryAnnouncements,
    getAnnouncementById,
    onDestroyAnnouncement
}
