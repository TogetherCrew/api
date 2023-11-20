import { IChannel } from '@togethercrew.dev/db';
import { Connection } from 'mongoose';

export const discordChannel1: IChannel = {
    channelId: '987654321098765432',
    name: 'Channel 1',
    parentId: null,
    permissionOverwrites: [

        {
            id: '9988776655', // another example Snowflake ID for the role or member
            type: 1,
            allow: '1000',
            deny: '0',
        },
    ],
    deletedAt: null
};

export const discordChannel2: IChannel = {
    channelId: '234567890123456789',
    name: 'Channel 2',
    parentId: '987654321098765432',
    permissionOverwrites: [
        {
            id: '1130918826234617968', // example Snowflake ID for the role or member
            type: 1,
            allow: '0',
            deny: '66560',
        },
        {
            id: '9988776655', // another example Snowflake ID for the role or member
            type: 1,
            allow: '10000',
            deny: '0',
        },
    ],
    deletedAt: null
};

export const discordChannel3: IChannel = {
    channelId: '345678901234567890',
    name: 'Channel 3',
    parentId: '987654321098765432',
    permissionOverwrites: [
        {
            id: '9988776655', // another example Snowflake ID for the role or member
            type: 1,
            allow: '10000',
            deny: '0',
        },
        {
            id: '1130918826234617968', // example Snowflake ID for the role or member
            type: 1,
            allow: '66560',
            deny: '0',
        },
    ],
    deletedAt: null
};

export const discordChannel4: IChannel = {
    channelId: '345678901234567000',
    name: 'Channel 4',
    parentId: null,
    deletedAt: null
};

export const discordChannel5: IChannel = {
    channelId: '345678901234567333',
    name: 'Channel 5',
    parentId: '987654321098765432',
    deletedAt: new Date()
};


export const insertChannels = async function <Type>(channels: Array<Type>, connection: Connection) {
    for (const channel of channels) {
        await connection.models.Channel.create(channel);
    }
};