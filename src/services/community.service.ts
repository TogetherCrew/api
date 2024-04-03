import { HydratedDocument, Types } from 'mongoose';
import httpStatus from 'http-status';
import { Community, ICommunity } from '@togethercrew.dev/db';
import ApiError from '../utils/ApiError';

/**
 * Create a community
 * @param {ICommunity} communityBody
 * @returns {Promise<HydratedDocument<ICommunity>>}
 */
const createCommunity = async (communityBody: ICommunity): Promise<HydratedDocument<ICommunity>> => {
  return Community.create(communityBody);
};

/**
 * Query for communities
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 */
const queryCommunities = async (filter: object, options: object) => {
  return Community.paginate(filter, options);
};

/**
 * Get community by filter
 * @param {Object} filter - Mongo filter
 * @returns {Promise<HydratedDocument<ICommunity> | null>}
 */
const getCommunityByFilter = async (filter: object): Promise<HydratedDocument<ICommunity> | null> => {
  return Community.findOne(filter);
};

/**
 * Get community by id
 * @param {Types.ObjectId} id
 * @returns {Promise<HydratedDocument<ICommunity> | null>}
 */
const getCommunityById = async (id: Types.ObjectId): Promise<HydratedDocument<ICommunity> | null> => {
  return Community.findById(id);
};

/**
 * Get communities by filter
 * @param {Object} filter - Mongo filter
 * @returns {Promise<HydratedDocument<ICommunity>[] | []>}
 */
const getCommunities = async (filter: object): Promise<HydratedDocument<ICommunity>[] | []> => {
  return Community.find(filter);
};

/**
 * Update community by filter
 * @param {Object} filter - Mongo filter
 * @param {Partial<ICommunity>} updateBody
 * @returns {Promise<HydratedDocument<ICommunity>>}
 */
const updateCommunityByFilter = async (
  filter: object,
  updateBody: Partial<ICommunity>,
): Promise<HydratedDocument<ICommunity>> => {
  const community = await getCommunityByFilter(filter);
  if (!community) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Community not found');
  }
  Object.assign(community, updateBody);
  await community.save();
  return community;
};

/**
 * Delete community by id
 * @param {Object} filter - Mongo filter
 * @returns {Promise<HydratedDocument<ICommunity>>}
 */
const deleteCommunityByFilter = async (filter: object): Promise<HydratedDocument<ICommunity>> => {
  const community = await getCommunityByFilter(filter);
  if (!community) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Community not found');
  }
  await community.remove();
  return community;
};

/**
 * Add a platform to a community by platform ID.
 * @param {Types.ObjectId} communityId
 * @param {Types.ObjectId} platformId
 * @returns {Promise<ICommunity | null>}
 */
const addPlatformToCommunityById = async (
  communityId: Types.ObjectId,
  platformId: Types.ObjectId,
): Promise<ICommunity | null> => {
  const community = await Community.findByIdAndUpdate(
    communityId,
    { $addToSet: { platforms: platformId } },
    { new: true },
  );

  if (!community) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Community not found');
  }

  return community;
};

export default {
  createCommunity,
  queryCommunities,
  getCommunityById,
  getCommunityByFilter,
  getCommunities,
  updateCommunityByFilter,
  deleteCommunityByFilter,
  addPlatformToCommunityById,
};
