import { ChoreographyDict, MBConnection, Status } from "@togethercrew.dev/tc-messagebroker"
import { Snowflake } from "discord.js"

async function createAndStartGuildSaga(guildId: Snowflake, other: { created: boolean, discordId: Snowflake, message: string, useFallback: boolean }) {
    const saga = await MBConnection.models.Saga.create({
        status: Status.NOT_STARTED,
        data: { guildId, ...other },
        choreography: ChoreographyDict.DISCORD_UPDATE_CHANNELS
    })

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    await saga.start(() => { })
}

export default {
    createAndStartGuildSaga
}