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
    let userRoles: UserRole[] = [];
    const communitDoc = await communityService.getCommunityById(communityId)
    if (communitDoc !== null) {
        if (communitDoc.users.some(id => id.equals(user.id))) {
            console.log(1)
            userRoles.push('admin');
        }
        const connectedPlatformDoc = await platformService.getPlatformByFilter({
            community: communityId,
            disconnectedAt: null
        })
        if (connectedPlatformDoc !== null) {
            console.log(2)
            const connection = await DatabaseManager.getInstance().getTenantDb(connectedPlatformDoc.metadata?.id);
            const guildMemberDoc = await discordServices.guildMemberService.getGuildMember(connection, { discordId: user.discordId });
            if (communitDoc.roles) {
                console.log(3)
                for (let i = 0; i < communitDoc.roles?.length; i++) {
                    console.log(4, communitDoc.roles[i].source.platformId, connectedPlatformDoc.id)
                    if (communitDoc.roles[i].source.platform === 'discord' && communitDoc.roles[i].source.platformId.equals(connectedPlatformDoc.id)) {
                        console.log(44)
                        if (communitDoc.roles[i].source.identifierType === 'member') {
                            console.log(5, guildMemberDoc?.discordId, communitDoc.roles[i].source)
                            if (communitDoc.roles[i].source.identifierValues.some(discordId => discordId === guildMemberDoc?.discordId)) {
                                console.log(6)
                                userRoles.push(communitDoc.roles[i].roleType);
                            }
                        }
                        else if (communitDoc.roles[i].source.identifierType === 'role') {
                            console.log(7, guildMemberDoc, communitDoc.roles[i].source)
                            if (communitDoc.roles[i].source.identifierValues.some(roleId => guildMemberDoc?.roles.includes(roleId))) {
                                console.log(8)
                                userRoles.push(communitDoc.roles[i].roleType);
                            }
                        }
                    }
                }

            }
        }
    }
    console.log(userRoles)
    userRoles = [...new Set(userRoles)];
    return userRoles;
}

export default {
    getUserRolesForCommunity
};
