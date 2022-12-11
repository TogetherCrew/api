import { Snowflake } from 'discord.js';
import { Document } from 'mongoose';

export interface IGuild {
    guildId: Snowflake,
    user: Snowflake,
    name: string,
    selectedChannels?: [
        {
            channelId: Snowflake,
            channelName?: string
        }
    ],
    period?: Date

}


export interface IGuildModel extends IGuild, Document { }
