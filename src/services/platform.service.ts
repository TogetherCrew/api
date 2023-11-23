import { HydratedDocument, Types } from 'mongoose';
import httpStatus from 'http-status';
import { Platform, IPlatform } from '@togethercrew.dev/db';
import ApiError from '../utils/ApiError';

/**
 * Create a platform
 * @param {IPlatform} PlatformBody
 * @returns {Promise<HydratedDocument<IPlatform>>}
 */
const createPlatform = async (PlatformBody: IPlatform): Promise<HydratedDocument<IPlatform>> => {
    return Platform.create(PlatformBody);
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
const updatePlatform = async (platform: HydratedDocument<IPlatform>, updateBody: Partial<IPlatform>): Promise<HydratedDocument<IPlatform>> => {
    if (updateBody.metadata) {
        updateBody.metadata = {
            ...platform.metadata,
            ...updateBody.metadata
        };
    }
    Object.assign(platform, updateBody);
    return await platform.save();
};

/**
 * Delete Platform by filter
 * @param {Object} filter - Mongo filter
 * @returns {Promise<HydratedDocument<IPlatform>>}
 */
const deletePlatformByFilter = async (filter: object,): Promise<HydratedDocument<IPlatform>> => {
    const platform = await getPlatformByFilter(filter);
    if (!platform) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Platform not found');
    }
    await platform.remove();
    return platform;
};

export default {
    createPlatform,
    getPlatformById,
    getPlatformByFilter,
    queryPlatforms,
    updatePlatformByFilter,
    deletePlatformByFilter,
    updatePlatform
};