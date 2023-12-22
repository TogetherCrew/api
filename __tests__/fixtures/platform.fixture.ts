import { Types } from 'mongoose';
import { Platform } from '@togethercrew.dev/db';

interface PlatformFixture {
    _id: Types.ObjectId;
    name: string;
    community?: Types.ObjectId;
    disconnectedAt?: Date | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata?: Record<string, any>,
}

export const platformOne: PlatformFixture = {
    _id: new Types.ObjectId(),
    name: "discord",
    metadata: {
        id: "681946187490000901",
    },
    disconnectedAt: null,
};

export const platformTwo: PlatformFixture = {
    _id: new Types.ObjectId(),
    name: "discord",
    metadata: {
        id: "681946187490000803",
    },
    disconnectedAt: null,
};

export const platformThree: PlatformFixture = {
    _id: new Types.ObjectId(),
    name: "discord",
    metadata: {
        id: "681946187490000802",
    }
};

export const platformFour: PlatformFixture = {
    _id: new Types.ObjectId(),
    name: "twitter",
    metadata: {
        id: "681946187490000801",
    },
    disconnectedAt: null,

};

export const platformFive: PlatformFixture = {
    _id: new Types.ObjectId(),
    name: "twitter",
    metadata: {
        id: "681946187490000888",
    },
    disconnectedAt: new Date(),

};



export const insertPlatforms = async function <Type>(platforms: Array<Type>) {
    for (const platform of platforms) {
        await Platform.create(platform);
    }
};