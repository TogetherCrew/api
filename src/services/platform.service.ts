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
        ...PlatformBody.metadata,
      };
    }
  }
  const platform = await Platform.create(PlatformBody);
  if (PlatformBody.name === 'discord') {
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
  updateBody: Partial<IPlatform>,
  userDiscordId?: Snowflake,
): Promise<HydratedDocument<IPlatform>> => {
  if (updateBody.metadata) {
    updateBody.metadata = {
      ...platform.metadata,
      ...updateBody.metadata,
    };
  }
  if ((updateBody.metadata?.period || updateBody.metadata?.selectedChannels) && userDiscordId) {
    await sagaService.createAndStartGuildSaga(platform._id, {
      created: false,
      discordId: userDiscordId,
      message:
        'Your data import into TogetherCrew is complete! See your insights on your dashboard https://app.togethercrew.com/. If you have questions send a DM to katerinabc (Discord) or k_bc0 (Telegram).',
      useFallback: true,
    });
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

function getMetadataKey(platformName: string): string {
  switch (platformName) {
    case 'discord':
      return 'id';
    case 'google':
    case 'twitter':
      return 'userId';
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
};
