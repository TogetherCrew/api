import { Announcement, IAnnouncement } from "@togethercrew.dev/db";
import { startSession } from "mongoose";
import { addJobToAnnouncementQueue } from "src/bullmq";

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

export default {
    createDraftAnnouncement,
    createScheduledAnnouncement
}
