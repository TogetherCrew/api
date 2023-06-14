import { Snowflake } from "discord.js"

export interface IGuildUpdateBody {
    selectedChannels?: [
        {
            channelId: Snowflake,
            channelName?: string
        }
    ],
    period?: Date,
    isDisconnected?: boolean,
}


export interface IPermissionOverwrite {
    id: string,
    type: 'role' | 'member';
    allow: string,
    deny: string,
    allow_new: string,
    deny_new: string
}


export interface ICustomChannel {
    id: string;
    name: string;
    parent_id: string;
    guild_id: string;
    canReadMessageHistoryAndViewChannel: boolean;
}