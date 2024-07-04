import { Types } from 'mongoose';
import { ChoreographyDict, MBConnection, Status } from '@togethercrew.dev/tc-messagebroker';
import { Snowflake } from 'discord.js';
import parentLogger from '../config/logger';

const logger = parentLogger.child({ module: 'SagaService' });

async function createAndStartGuildSaga(
  platformId: Types.ObjectId,
  other: { created: boolean; discordId: Snowflake; message: string; useFallback: boolean },
) {
  const saga = await MBConnection.models.Saga.create({
    status: Status.NOT_STARTED,
    data: { platformId, ...other },
    choreography: ChoreographyDict.DISCORD_UPDATE_CHANNELS,
  });
  logger.info({ platformId,other }, 'firing createAndStartGuildSaga saga');
  await saga.start(() => {});
}

async function createAndStartFetchMemberSaga(platformId: Types.ObjectId) {
  const saga = await MBConnection.models.Saga.create({
    status: Status.NOT_STARTED,
    data: { platformId },
    choreography: ChoreographyDict.DISCORD_FETCH_MEMBERS,
  });
  logger.info({ platformId }, 'firing createAndStartFetchMemberSaga saga');

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

  logger.info({ twitter_username ,other}, 'firing createAndStartRefreshTwitterSaga saga');
  await saga.start(() => {});
  return saga;
}

async function createAndStartAnnouncementSendMessageToChannelSaga(
  announcementId: string,
  info: { channels: string[]; message: string },
) {
  const saga = await MBConnection.models.Saga.create({
    status: Status.NOT_STARTED,
    data: { announcementId, ...info },
    choreography: ChoreographyDict.ANNOUNCEMENT_SEND_MESSAGE_TO_CHANNEL,
  });
  logger.info({ announcementId ,info}, 'firing createAndStartAnnouncementSendMessageToChannelSaga saga');

  await saga.start(() => {});
}

async function createAndStartAnnouncementSendMessageToUserSaga(
  announcementId: string,
  info: { platformId: Types.ObjectId; channels: string[]; message: string },
) {
  const saga = await MBConnection.models.Saga.create({
    status: Status.NOT_STARTED,
    data: { announcementId, ...info, isSafetyMessage: true },
    choreography: ChoreographyDict.ANNOUNCEMENT_SEND_MESSAGE_TO_USER,
  });
  logger.info({ announcementId ,info}, 'firing createAndStartAnnouncementSendMessageToUserSaga saga');

  await saga.start(() => {});
}

export default {
  createAndStartGuildSaga,
  createAndStartFetchMemberSaga,
  createAndStartRefreshTwitterSaga,
  createAndStartAnnouncementSendMessageToChannelSaga,
  createAndStartAnnouncementSendMessageToUserSaga,
};
