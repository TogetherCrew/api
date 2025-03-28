import { HydratedDocument, Types, FilterQuery } from 'mongoose';
import httpStatus from 'http-status';
import {
  Community,
  ICommunity,
  DatabaseManager,
  GuildMember,
  IRole,
  IUser,
  ICommunityRoles,
} from '@togethercrew.dev/db';
import { ApiError, roleUtil } from '../utils';
import guildMemberService from './discord/guildMember.service';
import roleService from './discord/role.service';
import platformService from './platform.service';
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
const getCommunityByFilter = async (filter: FilterQuery<ICommunity>): Promise<HydratedDocument<ICommunity> | null> => {
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

/**
 * Populate roles
 * @param {HydratedDocument<ICommunity>} community
 * @returns {Promise<HydratedDocument<ICommunity>>}
 */
const populateRoles = async (community: HydratedDocument<ICommunity>): Promise<HydratedDocument<ICommunity>> => {
  if (community.roles) {
    for (const role of community.roles) {
      const platformId = role.source.platformId;
      const platform = await platformService.getPlatformById(platformId);
      if (platform) {
        const guildConnection = await DatabaseManager.getInstance().getGuildDb(platform?.metadata?.id);
        if (role.source.identifierType === 'member') {
          const guildMembers = await guildMemberService.getGuildMembers(
            guildConnection,
            { discordId: { $in: role.source.identifierValues } },
            { avatar: 1, discordId: 1, username: 1, discriminator: 1, nickname: 1, globalName: 1 },
          );
          guildMembers.forEach((guildMember: any) => {
            guildMember.ngu = guildMemberService.getNgu(guildMember);
            guildMember.username = guildMemberService.getUsername(guildMember);
          });
          role.source.identifierValues = guildMembers;
        } else if (role.source.identifierType === 'role') {
          const roles: IRole[] = await roleService.getRoles(
            guildConnection,
            { roleId: { $in: role.source.identifierValues } },
            { roleId: 1, color: 1, name: 1 },
          );
          role.source.identifierValues = roles;
        }
      }
    }
  }

  return community;
};

/**
 * Validates role changes to ensure an admin cannot revoke their own admin role
 * @param {HydratedDocument<IUser>} user - The user object representing the current user
 * @param {HydratedDocument<ICommunity>} community - The community document
 * @param {string[]} newRoles - The new roles to be assigned to the community
 * @throws {ApiError} If an admin tries to revoke their own admin role
 */
const validateRoleChanges = async (
  user: HydratedDocument<IUser>,
  community: HydratedDocument<ICommunity>,
  newRoles: ICommunityRoles[],
): Promise<void> => {
  const initialUserRoles: string[] = await roleUtil.getUserRolesForCommunity(user, community);
  const originalRoles = community.roles;
  community.roles = newRoles;
  const updatedUserRoles: string[] = await roleUtil.getUserRolesForCommunity(user, community);
  community.roles = originalRoles;
  if (initialUserRoles.includes('admin') && !updatedUserRoles.includes('admin')) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Admin role cannot be revoked by the user themselves.');
  }
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
  populateRoles,
  validateRoleChanges,
};
