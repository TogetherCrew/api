import { Announcement, IAnnouncement } from '@togethercrew.dev/db';
import { Types } from 'mongoose';

type AnnouncementDataFixture = Array<IAnnouncement['data'][0] & { type: string }>
type AnnouncementFixture = Pick<IAnnouncement, 'title' | 'scheduledAt' | 'draft' | 'community' | 'createdBy' | 'updatedBy'> & { _id: Types.ObjectId, data: AnnouncementDataFixture };

export const generatePublicDiscordAnnouncement = (communityId: Types.ObjectId, platformId: Types.ObjectId, channelIds: string[]): AnnouncementFixture => ({
    _id: new Types.ObjectId(),
    title: "Announcement One",
    scheduledAt: new Date(),
    draft: false,
    community: communityId,
    data: [{
        platform: platformId,
        type: "discord_public",
        template: "Hello World",
        options: {
            channelIds: channelIds,
        },
    }],
    createdBy: new Types.ObjectId(),
    updatedBy: new Types.ObjectId(),
});

export const generatePrivateUserDiscordAnnouncement = (communityId: Types.ObjectId, platformId: Types.ObjectId, userIds: any[]): AnnouncementFixture => ({
    _id: new Types.ObjectId(),
    title: "Announcement Two",
    scheduledAt: new Date(),
    draft: false,
    community: communityId,
    data: [{
        platform: platformId,
        type: "discord_private",
        template: "Hello api world",
        options: {
            userIds: userIds,
        },
    }],
    createdBy: new Types.ObjectId(),
    updatedBy: new Types.ObjectId(),
})

export const generatePrivateRoleDiscordAnnouncement = (communityId: Types.ObjectId, platformId: Types.ObjectId, roleIds: any[]): AnnouncementFixture => ({
    _id: new Types.ObjectId(),
    title: "Announcement Three",
    scheduledAt: new Date(),
    draft: false,
    community: communityId,
    data: [{
        platform: platformId,
        type: "discord_private",
        template: "Sample Template",
        options: {
            roleIds: roleIds,
        },
    }],
    createdBy: new Types.ObjectId(),
    updatedBy: new Types.ObjectId(),
})

export const insertAnnouncement = async (announcements: AnnouncementFixture[]) => {
    for (const announcement of announcements) {
        await Announcement.create(announcement);
    }
}

