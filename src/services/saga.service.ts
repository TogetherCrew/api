import { Types } from 'mongoose';
import { ChoreographyDict, MBConnection, Status } from "@togethercrew.dev/tc-messagebroker"
import { Snowflake } from "discord.js"

async function createAndStartGuildSaga(platformId: Types.ObjectId, other: { created: boolean, discordId: Snowflake, message: string, useFallback: boolean }) {
    const saga = await MBConnection.models.Saga.create({
        status: Status.NOT_STARTED,
        data: { platformId, ...other },
        choreography: ChoreographyDict.DISCORD_UPDATE_CHANNELS
    })

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    await saga.start(() => { })
}

async function createAndStartFetchMemberSaga(platformId: Types.ObjectId) {
    const saga = await MBConnection.models.Saga.create({
        status: Status.NOT_STARTED,
        data: { platformId },
        choreography: ChoreographyDict.DISCORD_FETCH_MEMBERS
    })

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    await saga.start(() => { })
}

async function createAndStartRefreshTwitterSaga(twitter_username: string, other: { discordId: Snowflake, guildId: string, message: string }) {
    const saga = await MBConnection.models.Saga.create({
        status: Status.NOT_STARTED,
        data: { twitter_username, ...other },
        choreography: ChoreographyDict.TWITTER_REFRESH
    })

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    await saga.start(() => { })
    return saga
}

async function createAndStartAnnouncementSendMessageToChannelSaga(announcementId: string, info: { channels: string[], message: string }) {
    const saga = await MBConnection.models.Saga.create({
        status: Status.NOT_STARTED,
        data: { announcementId, ...info },
        choreography: ChoreographyDict.ANNOUNCEMENT_SEND_MESSAGE_TO_CHANNEL
    })

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    await saga.start(() => { })
}

async function createAndStartAnnouncementSendMessageToUserSaga(announcementId: string, info: { discordId: Snowflake, message: string, useFallback: boolean }) {
    const saga = await MBConnection.models.Saga.create({
        status: Status.NOT_STARTED,
        data: { announcementId, ...info },
        choreography: ChoreographyDict.ANNOUNCEMENT_SEND_MESSAGE_TO_USER
    })

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    await saga.start(() => { })
}

export default {
    createAndStartGuildSaga,
    createAndStartFetchMemberSaga,
    createAndStartRefreshTwitterSaga,
    createAndStartAnnouncementSendMessageToChannelSaga,
    createAndStartAnnouncementSendMessageToUserSaga
}