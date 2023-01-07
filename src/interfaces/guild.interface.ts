import { Snowflake } from "discord.js"

export interface IGuildUpdateBody {
    selectedChannels?: [
        {
            channelId: Snowflake,
            channelName?: string
        }
    ],
    period?: Date
}
