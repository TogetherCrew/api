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
    type: number,
    allow: string,
    deny: string,
    allow_new: string,
    deny_new: string
}