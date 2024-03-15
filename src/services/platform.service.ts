import { HydratedDocument, Types } from 'mongoose';
import httpStatus from 'http-status';
import { Platform, IPlatform } from '@togethercrew.dev/db';
import ApiError from '../utils/ApiError';
import sagaService from './saga.service';
import { Snowflake } from 'discord.js';
import { analyzerAction, analyzerWindow } from '../config/analyzer.statics';
import communityService from './community.service';
import discordServices from './discord';
/**
 * Create a platform
 * @param {IPlatform} PlatformBody
 * @returns {Promise<HydratedDocument<IPlatform>>}
 */
const createPlatform = async (PlatformBody: IPlatform): Promise<HydratedDocument<IPlatform>> => {
  if (PlatformBody.name === 'discord') {
    if (PlatformBody.metadata) {
      PlatformBody.metadata = {
        action: analyzerAction,
        window: analyzerWindow,
        ...PlatformBody.metadata
      };
    }
  }
  const platform = await Platform.create(PlatformBody);
  if (PlatformBody.name === 'discord') {
    await sagaService.createAndStartFetchMemberSaga(platform._id)
  }
  return platform;
};


/**
 * Query for platforms
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 */
const queryPlatforms = async (filter: object, options: object) => {
  return Platform.paginate(filter, options);

};

/**
 * Get platform by filter
 * @param {Object} filter - Mongo filter
 * @returns {Promise<HydratedDocument<IPlatform> | null>}
 */
const getPlatformByFilter = async (filter: object): Promise<HydratedDocument<IPlatform> | null> => {
  return Platform.findOne(filter);
};


/**
 * Get Platform by id
 * @param {Types.ObjectId} id
 * @returns {Promise<HydratedDocument<IPlatform> | null>}
 */
const getPlatformById = async (id: Types.ObjectId): Promise<HydratedDocument<IPlatform> | null> => {
  return Platform.findById(id);
};

/**
 * Update Platform by filter
 * @param {Object} filter - Mongo filter
 * @param {Partial<IPlatform>} updateBody
 * @returns {Promise<HydratedDocument<IPlatform>>}
 */
const updatePlatformByFilter = async (filter: object, updateBody: Partial<IPlatform>): Promise<HydratedDocument<IPlatform>> => {
  const platform = await getPlatformByFilter(filter);
  if (!platform) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Platform not found');
  }
  if (updateBody.metadata) {
    updateBody.metadata = {
      ...platform.metadata,
      ...updateBody.metadata
    };
  }
  Object.assign(platform, updateBody);
  await platform.save();
  return platform;
};

/**
 * Update Platform 
 * @param {HydratedDocument<IPlatform>} platform - platform doc
 * @param {Partial<IPlatform>} updateBody
 * @returns {Promise<HydratedDocument<IPlatform>>}
 */
const updatePlatform = async (platform: HydratedDocument<IPlatform>, updateBody: Partial<IPlatform>, userDiscordId?: Snowflake): Promise<HydratedDocument<IPlatform>> => {
  if (updateBody.metadata) {
    updateBody.metadata = {
      ...platform.metadata,
      ...updateBody.metadata
    };
  }
  if ((updateBody.metadata?.period || updateBody.metadata?.selectedChannels) && userDiscordId) {
    await sagaService.createAndStartGuildSaga(platform._id, {
      created: false,
      discordId: userDiscordId,
      message: "Your data import into TogetherCrew is complete! See your insights on your dashboard https://app.togethercrew.com/ .If you have questions send a DM to katerinabc (Discord) or k_bc0 (Telegram)",
      useFallback: true
    })
  }

  Object.assign(platform, updateBody);
  return await platform.save();
};

/**
 * Delete Platform
 * @param {HydratedDocument<IPlatform>} platform - platform doc
 * @returns {Promise<HydratedDocument<IPlatform>>}
 */
const deletePlatform = async (platform: HydratedDocument<IPlatform>): Promise<HydratedDocument<IPlatform>> => {
  return await platform.remove();
};

/**
 * Delete Platform by filter
 * @param {Object} filter - Mongo filter
 * @returns {Promise<HydratedDocument<IPlatform>>}
 */
const deletePlatformByFilter = async (filter: object): Promise<HydratedDocument<IPlatform>> => {
  const platform = await getPlatformByFilter(filter);
  if (!platform) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Platform not found');
  }
  return await platform.remove();
};



/**
 * Checks if a platform with the specified metadata ID is already connected to the given community.
 * Throws an error if such a platform exists.
 * 
 * @param {Types.ObjectId} communityId - The ID of the community to check within.
 * @param {IPlatform} PlatformBody - The platform data to check against.
 */
const checkPlatformAlreadyConnected = async (communityId: Types.ObjectId, PlatformBody: IPlatform) => {
  const platform = await getPlatformByFilter({
    community: communityId,
    'metadata.id': PlatformBody.metadata?.id,
    disconnectedAt: null
  });

  if (platform) {
    throw new ApiError(httpStatus.BAD_REQUEST, `This Platform is already connected`);
  }
}

/**
 * Checks if there is already a platform of the same name connected to the given community.
 * If such a platform exists, and there is no platform with the same metadata ID in another community,
 * the bot will leave the guild.
 * 
 * @param {Types.ObjectId} communityId - The ID of the community to check within.
 * @param {IPlatform} PlatformBody - The platform data to check against.
 */
const checkSinglePlatformConnection = async (communityId: Types.ObjectId, PlatformBody: IPlatform) => {
  const platform = await getPlatformByFilter({
    community: communityId,
    disconnectedAt: null,
    name: PlatformBody.name
  });

  if (platform) {
    const platformDoc = await getPlatformByFilter({
      'metadata.id': PlatformBody.metadata?.id,
      community: { $ne: communityId }
    });
    if (!platformDoc) {
      await discordServices.coreService.leaveBotFromGuild(PlatformBody.metadata?.id)
    }
    throw new ApiError(httpStatus.BAD_REQUEST, `Only can connect one ${PlatformBody.name} platform`);
  }

}


/**
 * Attempts to reconnect an existing platform, or adds a new platform to the community if none exists.
 * Throws an error if a platform with the same metadata ID is connected to another community.
 * 
 * @param {Types.ObjectId} communityId - The ID of the community to check within.
 * @param {IPlatform} PlatformBody - The platform data to use for reconnection or creation.
 * @returns {Promise<HydratedDocument<IPlatform>>} The updated or newly created platform document.
 */
const reconnectOrAddNewPlatform = async (communityId: Types.ObjectId, PlatformBody: IPlatform): Promise<HydratedDocument<IPlatform>> => {
  let platformDoc = await getPlatformByFilter({
    community: communityId,
    disconnectedAt: { $ne: null }, // Check for platform if it is disconnected
    name: PlatformBody.name,
    'metadata.id': PlatformBody.metadata?.id
  });


  if (platformDoc) {
    return await updatePlatform(platformDoc, { disconnectedAt: null });
  }

  platformDoc = await getPlatformByFilter({ 'metadata.id': PlatformBody.metadata?.id });
  if (platformDoc) {
    throw new ApiError(httpStatus.BAD_REQUEST, `This Platform is already connected to another community`);
  }

  const platform = await createPlatform(PlatformBody);
  await communityService.addPlatformToCommunityById(platform.community, platform.id);
  return platform;
}


export default {
  createPlatform,
  getPlatformById,
  getPlatformByFilter,
  queryPlatforms,
  updatePlatform,
  updatePlatformByFilter,
  deletePlatform,
  deletePlatformByFilter,
  checkPlatformAlreadyConnected,
  checkSinglePlatformConnection,
  reconnectOrAddNewPlatform
};