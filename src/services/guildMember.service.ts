import { Connection } from 'mongoose';
import { sort } from '../utils';
import memberActivityService from './memberActivity.service';
import { IRole } from '@togethercrew.dev/db';

type Filter = {
    activityComposition?: Array<string>;
    roles?: Array<string>;
    username?: string;
};

type Options = {
    sortBy?: string;
    limit?: string;
    page?: string;
};
/**
 *  Query guild members with a filter and options.
 * @param {Connection} connection - The MongoDB connection.
 * @param {Filter} filter - The filter object with fields like 'roles' and 'username'.
 * @param {Options} options - The options object with fields like 'sortBy', 'limit' and 'page'.
 * @param {Any} memberActivity - The document containing the last member activity.
 * @returns {Promise<QueryResult>} - An object with the query results and other information like 'limit', 'page', 'totalPages', 'totalResults'.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function queryGuildMembers(connection: Connection, filter: Filter, options: Options, memberActivity: any) {
    try {
        const { roles, username, activityComposition } = filter;
        const { sortBy } = options;
        const limit = options.limit && parseInt(options.limit, 10) > 0 ? parseInt(options.limit, 10) : 10;
        const page = options.page && parseInt(options.page, 10) > 0 ? parseInt(options.page, 10) : 1;
        const sortParams: Record<string, 1 | -1> = sortBy ? sort.sortByHandler(sortBy) : { username: 1 };


        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let matchStage: any = {
            discordId: { $in: memberActivity.all },
        };

        if (activityComposition && activityComposition.includes('others')) {
            matchStage = {};
        }

        if (username) {
            matchStage.username = { $regex: username, $options: 'i' };
        }

        if (roles && roles.length > 0) {
            matchStage.roles = { $in: roles };
        }

        const totalResults = await connection.models.GuildMember.countDocuments(matchStage);

        const results = await connection.models.GuildMember.aggregate([
            {
                $match: matchStage
            },
            {
                $sort: sortParams
            },
            {
                $skip: limit * (page - 1)
            },
            {
                $limit: limit
            },
            {
                $project: {
                    discordId: 1,
                    username: 1,
                    discriminator: 1,
                    roles: 1,
                    avatar: 1,
                    joinedAt: 1,
                    _id: 0
                }
            }
        ]);

        const totalPages = Math.ceil(totalResults / limit);

        return {
            results,
            limit,
            page,
            totalPages,
            totalResults,
        }
    } catch (err) {
        console.log(err);
        return {
            results: [],
            limit: 10,
            page: 1,
            totalPages: 0,
            totalResults: 0,
        }
    }


}

/**
 *  handel guild member roles and username
 * @param {Array} guildMembers - guild members array.
 * @param {Array} roles - roles array.
 * @param {Any} memberActivity - The document containing the last member activity.
 * 
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function addNeededDataForTable(guildMembers: Array<any>, roles: Array<IRole>, memberActivity: any) {
    guildMembers.forEach((guildMember) => {
        guildMember.roles = guildMember.roles.map((roleId: string) => {
            const role = roles.find((role: IRole) => role.roleId === roleId);
            if (role) {
                return { roleId: role.roleId, color: role.color, name: role.name };
            }
        });
        guildMember.username = guildMember.discriminator === "0" ? guildMember.username : guildMember.username + "#" + guildMember.discriminator;
        guildMember.activityComposition = memberActivityService.getActivityComposition(guildMember, memberActivity)
    });
}



export default {
    queryGuildMembers,
    addNeededDataForTable
}

