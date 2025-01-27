import httpStatus from 'http-status';
import { HydratedDocument, Types } from 'mongoose';

import { IIdentity, IUser, PlatformNames, User } from '@togethercrew.dev/db';

import ApiError from '../utils/ApiError';

/**
 * Create a user
 * @param {IUser} userBody
 * @returns {Promise<HydratedDocument<IUser>>}
 */
const createUser = async (userBody: IUser): Promise<HydratedDocument<IUser>> => {
  return User.create(userBody);
};

/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 */
const queryUsers = async (filter: object, options: object) => {
  return User.paginate(filter, options);
};

/**
 * Get user by filter
 * @param {Object} filter - Mongo filter
 * @returns {Promise<HydratedDocument<IUser> | null>}
 */
const getUserByFilter = async (filter: object): Promise<HydratedDocument<IUser> | null> => {
  return User.findOne(filter);
};

/**
 * Get user by id
 * @param {Types.ObjectId} id
 * @returns {Promise<HydratedDocument<IUser> | null>}
 */
const getUserById = async (id: Types.ObjectId): Promise<HydratedDocument<IUser> | null> => {
  return User.findById(id);
};

/**
 * Update user by id
 * @param {Types.ObjectId} userId
 * @param {Partial<IUser>} updateBody
 * @returns {Promise<HydratedDocument<IUser>>}
 */
const updateUserById = async (userId: Types.ObjectId, updateBody: Partial<IUser>): Promise<HydratedDocument<IUser>> => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  Object.assign(user, updateBody);
  await user.save();
  return user;
};

/**
 * Delete user by id
 * @param {Types.ObjectId} userId
 * @returns {Promise<HydratedDocument<IUser>>}
 */
const deleteUserById = async (userId: Types.ObjectId): Promise<HydratedDocument<IUser>> => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  await user.remove();
  return user;
};

/**
 * Add a community to a user by user ID.
 * @param {Types.ObjectId} userId
 * @param {Types.ObjectId} communityId
 * @returns {Promise<IUser | null>}
 */
const addCommunityToUserById = async (userId: Types.ObjectId, communityId: Types.ObjectId): Promise<IUser | null> => {
  const user = await User.findByIdAndUpdate(userId, { $addToSet: { communities: communityId } }, { new: true });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  return user;
};

/**
 * Get user by provider and providerId
 * @param {string} provider - The authentication provider (e.g., 'discord')
 * @param {string} providerId - The unique ID from the provider
 * @returns {Promise<HydratedDocument<IUser> | null>}
 */
const getUserByIdentity = async (provider: string, providerId: string): Promise<HydratedDocument<IUser> | null> => {
  return User.findOne({
    identities: {
      $elemMatch: { provider, id: providerId },
    },
  });
};

/**
 * Create a user with a specific identity
 * @param {string} provider - The authentication provider (e.g., 'discord')
 * @param {string} providerId - The unique ID from the provider
 * @param {Partial<IUser>} additionalData - Any additional user data
 * @returns {Promise<HydratedDocument<IUser>>}
 */
const createUserWithIdentity = async (
  provider: PlatformNames,
  userId: string,
  additionalData: Partial<IUser> = {},
): Promise<HydratedDocument<IUser>> => {
  const userBody: IUser = {
    identities: [
      {
        provider,
        id: userId,
      },
    ],
    ...additionalData,
  };
  return createUser(userBody);
};

/**
 * Add a new identity to an existing user
 * @param {Types.ObjectId} userId
 * @param {IIdentity} identity
 * @returns {Promise<HydratedDocument<IUser>>}
 */
const addIdentityToUser = async (userId: Types.ObjectId, identity: IIdentity): Promise<HydratedDocument<IUser>> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const existingIdentity = user.identities.find((id) => id.provider === identity.provider && id.id === identity.id);

  if (existingIdentity) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Identity already exists for this user');
  }

  user.identities.push(identity);
  await user.save();
  return user;
};

/**
 * Get a specific identity from a user's identities by provider.
 * @param {IIdentity[]} identities - The list of user identities.
 * @param {PlatformNames} provider - The provider name to search for.
 * @returns {IIdentity | undefined} - The matching identity or undefined if not found.
 */
const getIdentityByProvider = (identities: IIdentity[], provider: PlatformNames): IIdentity | undefined => {
  return identities.find((identity) => identity.provider === provider);
};

export default {
  createUser,
  getUserById,
  queryUsers,
  getUserByFilter,
  updateUserById,
  deleteUserById,
  addCommunityToUserById,
  getUserByIdentity,
  createUserWithIdentity,
  addIdentityToUser,
  getIdentityByProvider,
};
