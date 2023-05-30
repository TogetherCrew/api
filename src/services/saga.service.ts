import { ChoreographyDict, MBConnection, Status } from "@togethercrew.dev/tc-messagebroker"

export async function crateAndStartGuildSaga(guildId: string, created: boolean){
    const saga = await MBConnection.models.Saga.create({
        status: Status.NOT_STARTED,
        data: { guildId, created },
        choreography: ChoreographyDict.DISCORD_UPDATE_CHANNELS
    })
    
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    await saga.start(() => { })

    return saga
}
