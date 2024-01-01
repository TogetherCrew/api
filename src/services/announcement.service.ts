import { Announcement, IAnnouncement } from "@togethercrew.dev/db";
import { startSession } from "mongoose";
import { addJobToAnnouncementQueue } from "../bullmq";

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

export default {
    createDraftAnnouncement,
    createScheduledAnnouncement,
    queryAnnouncements,
    getAnnouncementById
}
