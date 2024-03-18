import { HydratedDocument, Types } from 'mongoose';
import { IPlatform, IUser } from '@togethercrew.dev/db';
import { discordServices, platformService, communityService } from '../services';
import { DatabaseManager } from '@togethercrew.dev/db';

type UserRole = 'admin' | 'view';
/**
 * Create a platform
 * @param {HydratedDocument<IUser>} user
 * @param {Types.ObjectId} communityId
 * @returns {Promise<HydratedDocument<IPlatform>>}
 */
async function getUserRolesForCommunity(user: HydratedDocument<IUser>, communityId: Types.ObjectId) {
    const userRoles: UserRole[] = [];
    const communitDoc = await communityService.getCommunityById(communityId)
    if (communitDoc !== null) {
        if (communitDoc.users.some(id => id.equals(user.id))) {
            userRoles.push('admin');
        }
        const connectedPlatformDoc = await platformService.getPlatformByFilter({
            community: communityId,
            disconnectedAt: null
        })
        if (connectedPlatformDoc !== null) {
            const connection = await DatabaseManager.getInstance().getTenantDb(connectedPlatformDoc.metadata?.id);
            const guildMemberDoc = await discordServices.guildMemberService.getGuildMember(connection, { discordId: user.discordId });
            if (communitDoc.roles) {
                for (let i = 0; i < communitDoc.roles?.length; i++) {
                    if (communitDoc.roles[i].source.platform === 'discord' && communitDoc.roles[i].source.platformId === connectedPlatformDoc.id) {
                        if (communitDoc.roles[i].source.identifierType === 'member') {
                            if (communitDoc.roles[i].source.identifierValues.some(discordId => discordId === guildMemberDoc?.discordId)) {
                                userRoles.push(communitDoc.roles[i].roleType);
                            }
                        }
                        else if (communitDoc.roles[i].source.identifierType === 'role') {
                            if (communitDoc.roles[i].source.identifierValues.some(roleId => guildMemberDoc?.roles.includes(roleId))) {
                                userRoles.push(communitDoc.roles[i].roleType);
                            }
                        }
                    }
                }

            }
        }
    }
    return userRoles;
}