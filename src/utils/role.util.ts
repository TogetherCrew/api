import { HydratedDocument, Types } from 'mongoose';
import { ICommunity, IPlatform, IUser } from '@togethercrew.dev/db';
import { discordServices, platformService, communityService } from '../services';
import { DatabaseManager } from '@togethercrew.dev/db';
import { UserRole } from '../interfaces';
/**
 * Get user roles in a community
 * @param {HydratedDocument<IUser>} user
 * @param {HydratedDocument<ICommunity>} communityId
 * @returns {Promise<HydratedDocument<IPlatform>>}
 */
async function getUserRolesForCommunity(user: HydratedDocument<IUser>, community: HydratedDocument<ICommunity>) {
  let userRoles: UserRole[] = [];
  if (community !== null) {
    if (community.users.some((id) => id.equals(user.id))) {
      userRoles.push('admin');
    }
    const connectedPlatformDoc = await platformService.getPlatformByFilter({
      community: community.id,
      disconnectedAt: null,
    });
    if (connectedPlatformDoc !== null) {
      const guildConnection = await DatabaseManager.getInstance().getGuildDb(connectedPlatformDoc.metadata?.id);
      const guildMemberDoc = await discordServices.guildMemberService.getGuildMember(guildConnection, {
        discordId: user.discordId,
      });
      if (community.roles) {
        for (let i = 0; i < community.roles?.length; i++) {
          if (
            community.roles[i].source.platform === 'discord' &&
            community.roles[i].source.platformId.equals(connectedPlatformDoc.id)
          ) {
            if (community.roles[i].source.identifierType === 'member') {
              if (
                community.roles[i].source.identifierValues.some((discordId) => discordId === guildMemberDoc?.discordId)
              ) {
                userRoles.push(community.roles[i].roleType);
              }
            } else if (community.roles[i].source.identifierType === 'role') {
              if (community.roles[i].source.identifierValues.some((roleId) => guildMemberDoc?.roles.includes(roleId))) {
                userRoles.push(community.roles[i].roleType);
              }
            }
          }
        }
      }
    }
  }
  userRoles = [...new Set(userRoles)];
  return userRoles;
}

/**
 * Get user Communities
 * @param {HydratedDocument<IUser>} user
 * @param {Types.ObjectId} communityId
 * @returns {Promise<HydratedDocument<IPlatform>>}
 */
async function getUserCommunities(user: HydratedDocument<IUser>, communities: HydratedDocument<ICommunity>[] | []) {
  const communitiesWithRoles = await Promise.all(
    communities.map(async (community) => {
      const userRoles = await getUserRolesForCommunity(user, community);
      return userRoles.length > 0 ? community : null;
    }),
  );

  return communitiesWithRoles.filter((community) => community !== null);
}

export default {
  getUserRolesForCommunity,
  getUserCommunities,
};
