import { Announcement, IAnnouncement } from "@togethercrew.dev/db";
import { startSession } from "mongoose";
import { addJobToAnnouncementQueue, removeJobFromAnnouncementQueue } from "../bullmq";

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
    const deleteResult = Announcement.deleteOne({ _id: announcementId });
    return deleteResult
}


export default {
    createDraftAnnouncement,
    createScheduledAnnouncement,
    updateAndRescheduleAnnouncement,
    updateAnnouncementAndRemoveJob,
    updateAnnouncementAndAddJob,
    findOneAnnouncementAndUpdate,
    deleteAnnouncementById,
    queryAnnouncements,
    getAnnouncementById
}
