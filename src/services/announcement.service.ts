import { Announcement, DatabaseManager, IAnnouncement } from "@togethercrew.dev/db";
import mongoose, { startSession } from "mongoose";
import { addJobToAnnouncementQueue, removeJobFromAnnouncementQueue } from "../bullmq";
import discordService from './discord';
import { Job } from "bullmq";
import config from "../config";
import sagaService from './saga.service';
import platformService from "./platform.service";
import Handlebars from "handlebars";
import logger from '../config/logger';

const createDraftAnnouncement = async (announcementData: IAnnouncement) => {
    if (announcementData.draft === false) throw new Error('Cannot create a draft announcement with draft set to false');

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

const updateAndRescheduleAnnouncement = async (announcementId: string, oldAnnouncement: IAnnouncement, updatedData: Partial<IAnnouncement>) => {
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
    if (announcementJobId)
        await removeJobFromAnnouncementQueue(announcementJobId);
}

const bullMQTriggeredAnnouncement = async (job: Job) => {
    const announcementId = job.data.announcementId;

    // TODO: use function that main application use to connect to mongodb
    try {
        await mongoose.connect(config.mongoose.serverURL);
        logger.info({ url: config.mongoose.dbURL }, 'Setuped Message Broker connection!');
    } catch (error) {
        logger.fatal({ url: config.mongoose.dbURL, error }, 'Failed to setup to Message Broker!!');
    }

    const announcement = await Announcement.findById(announcementId);



    announcement?.data.forEach(async (data) => {
        const template = data?.template
        const platformId = data?.platform
        const options = data?.options
        const platform = await platformService.getPlatformByFilter({
            _id: platformId,
            disconnectedAt: null
        });
        const connection = await DatabaseManager.getInstance().getTenantDb(platform?.metadata?.id);

        const channelIds = (options as any)?.channelIds
        if (channelIds) {

            // !Fire event for all channels
            sagaService.createAndStartAnnouncementSendMessageToChannelSaga(announcementId, { channels: channelIds, message: template })
        }

        const userIds = (options as any)?.userIds
        if (userIds) {

            // !Fire event for each discordId
            //!? our userIds are discordIds
            userIds.forEach((discordId: string) => {
                const templateHandlebars = Handlebars.compile(template)
                const compiledTemplate = templateHandlebars({ username: `<@${discordId}>` })

                sagaService.createAndStartAnnouncementSendMessageToUserSaga(announcementId, { discordId, message: compiledTemplate, useFallback: true })
            })
        }

        const roleIds = (options as any)?.roleIds
        if (roleIds) {
            // extract discordId from roleID
            const discordIds = await discordService.roleService.getDiscordIdsFromRoleIds(connection, roleIds)

            // !Fire event for each discordId
            discordIds.forEach((discordId: string) => {
                const templateHandlebars = Handlebars.compile(template)
                const compiledTemplate = templateHandlebars({ username: `<@${discordId}>` })

                sagaService.createAndStartAnnouncementSendMessageToUserSaga(announcementId, { discordId, message: compiledTemplate, useFallback: true })
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
