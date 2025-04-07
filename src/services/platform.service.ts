import { Snowflake } from 'discord.js';
import httpStatus from 'http-status';
import { FilterQuery, HydratedDocument, ObjectId, Types } from 'mongoose';

import { IPlatform, IUser, ModuleNames, Platform, PlatformNames } from '@togethercrew.dev/db';

import { analyzerAction, analyzerWindow } from '../config/analyzer.statics';
import parentLogger from '../config/logger';
import { IAuthAndPlatform } from '../interfaces/Request.interface';
import ApiError from '../utils/ApiError';
import { platformService } from './';
import discourseService from './discourse';
import moduleService from './module.service';
import reputationScoreService from './reputationScore.service';
import sagaService from './saga.service';
import userService from './user.service';
import websiteService from './website';

const logger = parentLogger.child({ module: 'PlatformService' });
/**
 * Create a platform
 * @param {IPlatform} PlatformBody
 * @returns {Promise<HydratedDocument<IPlatform>>}
 */
const createPlatform = async (PlatformBody: IPlatform): Promise<HydratedDocument<IPlatform>> => {
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

/**
 * Query for platforms
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 */
const queryPlatforms = async (filter: FilterQuery<IPlatform>, options: object) => {
  return Platform.paginate(filter, options);
};

/**
 * Get platform by filter
 * @param {Object} filter - Mongo filter
 * @returns {Promise<HydratedDocument<IPlatform> | null>}
 */
const getPlatformByFilter = async (filter: FilterQuery<IPlatform>): Promise<HydratedDocument<IPlatform> | null> => {
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
 * Call extraction app for the given platform
 * @param {HydratedDocument<IPlatform>} platform
 * @returns {Promise<Void>}
 */
const callExtractionApp = async (platform: HydratedDocument<IPlatform>): Promise<void> => {
  switch (platform.name) {
    case PlatformNames.Discourse: {
      const scheduleId = await discourseService.coreService.createDiscourseSchedule(
        platform.id as string,
        platform.metadata?.id as string,
      );
      platform.set('metadata.scheduleId', scheduleId);
      await platform.save();
      return;
    }
    default: {
      return;
    }
  }
};

/**
 * Update Platform by filter
 * @param {Object} filter - Mongo filter
 * @param {Partial<IPlatform>} updateBody
 * @returns {Promise<HydratedDocument<IPlatform>>}
 */
const updatePlatformByFilter = async (
  filter: object,
  updateBody: Partial<IPlatform>,
): Promise<HydratedDocument<IPlatform>> => {
  const platform = await getPlatformByFilter(filter);
  if (!platform) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Platform not found');
  }
  if (updateBody.metadata) {
    updateBody.metadata = {
      ...platform.metadata,
      ...updateBody.metadata,
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
const updatePlatform = async (
  platform: HydratedDocument<IPlatform>,
  user: HydratedDocument<IUser>,
  updateBody: Partial<IPlatform>,
): Promise<HydratedDocument<IPlatform>> => {
  console.log('123', updateBody.metadata);

  // Handle special cases based on platform type
  if (platform.name === PlatformNames.Website) {
    await handleWebsiteResourceChanges(platform, updateBody);
  }
  if (platform.name === PlatformNames.Discord) {
    const discordIdentity = userService.getIdentityByProvider(user.identities, PlatformNames.Discord);
    if (discordIdentity) {
      await platformService.notifyDiscordUserImportComplete(platform.id, discordIdentity.id);
    }
  }

  console.log('321', updateBody.metadata);
  if (updateBody.metadata) {
    updateBody.metadata = {
      ...platform.metadata,
      ...updateBody.metadata,
    };
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
  await handlePlatformCleanup(platform);
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
  return await deletePlatform(platform);
};

function getMetadataKey(platformName: string): string {
  switch (platformName) {
    case PlatformNames.Discord:
      return 'id';
    case PlatformNames.Google:
      return 'id';
    case PlatformNames.GitHub:
      return 'installationId';
    case PlatformNames.Notion:
      return 'workspace_id';
    case PlatformNames.MediaWiki:
      return 'baseURL';
    case PlatformNames.Discourse:
      return 'id';
    case PlatformNames.Website:
      return 'resources';
    default:
      throw new Error('Unsupported platform');
  }
}

/**
 * Manages the connection of a platform based on unique metadata identifiers. It first checks if the platform,
 * identified by specific metadata, is actively connected in any other community to prevent duplicate active connections
 * across different communities. It then checks within the specified community whether the platform is already connected,
 * disconnected, or available for a new connection. Actions performed may include the reconnection of a previously
 * disconnected platform or the creation of a new platform if no conflicts exist.
 * The function uses a dynamically determined key from the platform's metadata to ensure uniqueness in identification.
 * @param {Types.ObjectId} communityId - The MongoDB ObjectId of the community to check within.
 * @param {IPlatform} platformData - The platform data containing name and metadata for connection management.
 * @returns {Promise<HydratedDocument<IPlatform>>} Returns a promise that resolves to the document of the reconnected or newly created platform.
 * @throws {ApiError} Throws an error if the platform is already connected in the same community, or if the same platform is connected in a different community.
 */
const managePlatformConnection = async (
  communityId: Types.ObjectId,
  platformData: IPlatform,
): Promise<HydratedDocument<IPlatform>> => {
  if (!platformData.metadata) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Metadata is Missing for the '${platformData.name}!`);
  }

  const metadataKey = getMetadataKey(platformData.name);
  const metadataId = platformData.metadata[metadataKey];

  // First, check across all communities if this platform metadata is already connected elsewhere
  const activePlatformOtherCommunity = await Platform.findOne({
    community: { $ne: communityId },
    [`metadata.${metadataKey}`]: metadataId,
    name: platformData.name,
  });

  if (activePlatformOtherCommunity) {
    throw new ApiError(httpStatus.BAD_REQUEST, `This platform is already connected to another community`);
  }
  // Check if any platform of the same name is currently active in the same community
  const existingActivePlatform = await Platform.findOne({
    community: communityId,
    name: platformData.name,
    disconnectedAt: null, // Check specifically for active platforms
  });

  // Before proceeding, check if the metadata and the specific key in metadata are present
  if (
    existingActivePlatform &&
    existingActivePlatform.metadata &&
    existingActivePlatform.metadata[metadataKey] !== metadataId
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `A platform of type '${platformData.name}' is already connected to this community.`,
    );
  }

  // Proceed to check for the specific platform instance by unique identifier within the same community
  const existingPlatform = await Platform.findOne({
    community: communityId,
    name: platformData.name,
    [`metadata.${metadataKey}`]: metadataId,
  });

  // Reconnect if previously disconnected
  if (existingPlatform && existingPlatform.disconnectedAt !== null) {
    existingPlatform.connectedAt = new Date();
    existingPlatform.disconnectedAt = null;
    await existingPlatform.save();
    return existingPlatform;
  }

  // If no such platform exists (neither active nor disconnected with the same metadata identifier), create a new one
  if (!existingPlatform) {
    return await createPlatform(platformData);
  }

  // If existing platform is already connected (safety check), throw an error
  throw new ApiError(
    httpStatus.BAD_REQUEST,
    `Platform ${platformData.name} with specified metadata is already connected to this community.`,
  );
};

/**
 * Sends a notification to the discord user upon successful data import.
 *
 * @param platformId - The ID of the platform.
 * @param userDiscordId - The Discord ID of the user.
 */
const notifyDiscordUserImportComplete = async (platformId: Types.ObjectId, userDiscordId: Snowflake): Promise<void> => {
  const IMPORT_COMPLETE_MESSAGE = `
Your data import into TogetherCrew is complete! 
See your insights on your dashboard: https://app.togethercrew.com/. 
If you have questions, send a DM to katerinabc (Discord) or k_bc0 (Telegram).
`;

  try {
    await sagaService.createAndStartGuildSaga(platformId, {
      created: false,
      discordId: userDiscordId,
      message: IMPORT_COMPLETE_MESSAGE.trim(),
      useFallback: true,
    });
    logger.info(`Notification sent to Discord ID: ${userDiscordId}`);
  } catch (error) {
    logger.error(error, `Failed to send notification to Discord ID: ${userDiscordId}`);
  }
};
const validatePlatformUpdate = (platform: IAuthAndPlatform['platform'], body: IAuthAndPlatform['body']) => {
  if (platform.name !== PlatformNames.Discord) return;

  if (platform.metadata?.isInProgress && (body.metadata?.selectedChannels || body.metadata?.period)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Updating channels or date period is not allowed during server analysis.',
    );
  }

  if (platform.metadata?.isFetchingInitialData && (body.metadata?.selectedChannels || body.metadata?.period)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Updating channels or date periods is not allowed during the initial fetching of the server.',
    );
  }
};

/**
 * get reputation score
 * @param {IPlatform} platform
 * @param {IUser} user
 */
const getReputationScore = async (platform: HydratedDocument<IPlatform>, user: HydratedDocument<IUser>) => {
  const identity = user.identities.find((id) => id.provider === platform.name);
  if (!identity) {
    throw new ApiError(httpStatus.NOT_FOUND, `User need to login with the ${platform.name} account`);
  }
  return {
    reputationScore: (await reputationScoreService.calculateReputationScoreForUser(platform, identity.id)) * 100,
  };
};

/**
 * Handle platform-specific cleanup during deletion
 * @param {HydratedDocument<IPlatform>} platform - Platform document
 * @returns {Promise<void>}
 */
const handlePlatformCleanup = async (platform: HydratedDocument<IPlatform>): Promise<void> => {
  switch (platform.name) {
    case PlatformNames.Discourse: {
      if (platform.metadata?.scheduleId) {
        await discourseService.coreService.deleteDiscourseSchedule(platform.metadata.scheduleId);
      }
      break;
    }
    case PlatformNames.Website: {
      if (platform.metadata?.scheduleId) {
        await websiteService.coreService.deleteWebsiteSchedule(platform.metadata.scheduleId);
      }
      break;
    }
    default:
      break;
  }
};

/**
 * Handle Website platform resource changes
 * @param {HydratedDocument<IPlatform>} platform - Platform document
 * @param {Partial<IPlatform>} updateBody - Update body
 * @returns {Promise<void>}
 */
const handleWebsiteResourceChanges = async (
  platform: HydratedDocument<IPlatform>,
  updateBody: Partial<IPlatform>,
): Promise<void> => {
  console.log('updateBody.metadata?.resources', updateBody.metadata?.resources, platform.metadata?.resources);

  if (!updateBody.metadata?.resources || !platform.metadata?.resources) {
    return;
  }
  const oldResources = JSON.stringify(platform.metadata.resources.sort());
  const newResources = JSON.stringify(updateBody.metadata.resources.sort());

  console.log('oldResources', oldResources, newResources);
  if (oldResources !== newResources) {
    const existingScheduleId = platform.metadata.scheduleId;

    if (existingScheduleId) {
      await websiteService.coreService.deleteWebsiteSchedule(existingScheduleId);
      updateBody.metadata.scheduleId = null;
    }

    const moduleFilter = {
      name: ModuleNames.Hivemind,
      'options.platforms': {
        $elemMatch: {
          name: PlatformNames.Website,
          platform: platform._id,
          'metadata.activated': true,
        },
      },
    };

    const hivemindModule = await moduleService.getModuleByFilter(moduleFilter);

    console.log('hivemindModule', hivemindModule);
    if (hivemindModule) {
      const scheduleId = await websiteService.coreService.createWebsiteSchedule(platform._id);
      updateBody.metadata.scheduleId = scheduleId;
    }
  }
};

export default {
  createPlatform,
  getPlatformById,
  getPlatformByFilter,
  queryPlatforms,
  updatePlatform,
  updatePlatformByFilter,
  deletePlatform,
  deletePlatformByFilter,
  managePlatformConnection,
  callExtractionApp,
  notifyDiscordUserImportComplete,
  validatePlatformUpdate,
  getReputationScore,
};
