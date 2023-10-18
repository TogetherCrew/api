import { Types } from 'mongoose';
import { Platform } from '@togethercrew.dev/db';

interface PlatformFixture {
    _id: Types.ObjectId;
    name: string;
    community?: Types.ObjectId;
    disconnectedAt?: Date | null;
    metadata: object
}

export const platformOne: PlatformFixture = {
    _id: new Types.ObjectId(),
    name: "discord",
    metadata: {
        guildId: "1111",
    },
    disconnectedAt: null,
};

export const platformTwo: PlatformFixture = {
    _id: new Types.ObjectId(),
    name: "twitter",
    metadata: {
        id: "4444",
    },
    disconnectedAt: new Date(),
};

export const platformThree: PlatformFixture = {
    _id: new Types.ObjectId(),
    name: "discord",
    metadata: {
        guildId: "2222",
    }
};



export const insertPlatforms = async function <Type>(platforms: Array<Type>) {
    await Platform.insertMany(platforms.map((platform) => (platform)));
};