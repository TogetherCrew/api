import { Announcement, IAnnouncement } from '@togethercrew.dev/db';
import { Types } from 'mongoose';

type AnnouncementFixture = Pick<IAnnouncement, 'title' | 'scheduledAt' | 'draft' | 'community' | 'data' | 'createdBy' | 'updatedBy'> & { _id: Types.ObjectId };

export const announcementOne: AnnouncementFixture = {
    _id: new Types.ObjectId(),
    title: "Announcement One",
    scheduledAt: new Date(),
    draft: false,
    community: new Types.ObjectId(),
    data: [{
        platform: new Types.ObjectId(),
        template: "Hello World",
        options: {
            channelIds: ["123456789"],
        },
    }],
    createdBy: new Types.ObjectId(),
    updatedBy: new Types.ObjectId(),
};

export const announcementTwo: AnnouncementFixture = {
    _id: new Types.ObjectId(),
    title: "Announcement Two",
    scheduledAt: new Date(),
    draft: false,
    community: new Types.ObjectId(),
    data: [{
        platform: new Types.ObjectId(),
        template: "Hello api world",
        options: {
            userIds: ["1345345226789"],
        },
    }],
    createdBy: new Types.ObjectId(),
    updatedBy: new Types.ObjectId(),
};

export const announcementThree: AnnouncementFixture = {
    _id: new Types.ObjectId(),
    title: "Announcement Three",
    scheduledAt: new Date(),
    draft: false,
    community: new Types.ObjectId(),
    data: [{
        platform: new Types.ObjectId(),
        template: "Sample Template",
        options: {
            userIds: ["2094844"],
        },
    }],
    createdBy: new Types.ObjectId(),
    updatedBy: new Types.ObjectId(),
};

export const insertAnnouncement = async (announcements: AnnouncementFixture[]) => {
    for (const announcement of announcements) {
        await Announcement.create(announcement);
    }
}

