import { HydratedDocument, Types } from 'mongoose';
import httpStatus from 'http-status';
import { Platform, IPlatform } from '@togethercrew.dev/db';
import ApiError from '../utils/ApiError';
import sagaService from './saga.service';
import discourseService from './discourse';
import { Snowflake } from 'discord.js';
import { analyzerAction, analyzerWindow } from '../config/analyzer.statics';
import { PlatformNames } from '@togethercrew.dev/db';

/**
 * get reputation score
 * @param {IPlatform} PlatformBody
 * @returns {Promise<HydratedDocument<IPlatform>>}
 */
const getReputationScore = async (PlatformBody: IPlatform): Promise<HydratedDocument<IPlatform>> => {
  if (PlatformBody.name === PlatformNames.Discord || PlatformBody.name === PlatformNames.Discourse) {
    if (PlatformBody.metadata) {
      PlatformBody.metadata = {
        action: analyzerAction,
        window: analyzerWindow,
        ...PlatformBody.metadata,
      };
    }
  }
  const platform = await Platform.create(PlatformBody);
  if (PlatformBody.name === PlatformNames.Discord) {
    await sagaService.createAndStartFetchMemberSaga(platform._id);
  }
  return platform;
};

export default {
  getReputationScore,
};
