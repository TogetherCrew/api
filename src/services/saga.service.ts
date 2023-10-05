import { ChoreographyDict, MBConnection, Status } from '@togethercrew.dev/tc-messagebroker';
import { Snowflake } from 'discord.js';

async function createAndStartGuildSaga(
  guildId: Snowflake,
  other: { created: boolean; discordId: Snowflake; message: string; useFallback: boolean },
) {
  const saga = await MBConnection.models.Saga.create({
    status: Status.NOT_STARTED,
    data: { guildId, ...other },
    choreography: ChoreographyDict.DISCORD_UPDATE_CHANNELS,
  });

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  await saga.start(() => {});
}

async function createAndStartFetchMemberSaga(guildId: Snowflake) {
  const saga = await MBConnection.models.Saga.create({
    status: Status.NOT_STARTED,
    data: { guildId },
    choreography: ChoreographyDict.DISCORD_FETCH_MEMBERS,
  });

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  await saga.start(() => {});
}

async function createAndStartRefreshTwitterSaga(
  twitter_username: string,
  other: { discordId: Snowflake; guildId: string; message: string },
) {
  const saga = await MBConnection.models.Saga.create({
    status: Status.NOT_STARTED,
    data: { twitter_username, ...other },
    choreography: ChoreographyDict.TWITTER_REFRESH,
  });

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  await saga.start(() => {});
  return saga;
}

export default {
  createAndStartGuildSaga,
  createAndStartFetchMemberSaga,
  createAndStartRefreshTwitterSaga,
};
