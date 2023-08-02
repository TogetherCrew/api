import { Connection } from 'mongoose';
import { sort } from '../utils';
import memberActivityService from './memberActivity.service';
import { IRole, IGuildMember } from '@togethercrew.dev/db';

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
 * @param {any} memberActivity - The document containing the last member activity.
 * @param {Array<string>} activityCompostionsTypes - An array containing types of activity compositions.
 * @returns {Promise<QueryResult>} - An object with the query results and other information like 'limit', 'page', 'totalPages', 'totalResults'.
 */
async function queryGuildMembers(connection: Connection, filter: Filter, options: Options, memberActivity: any, activityCompostionsTypes: Array<string>) {
    try {
        const { roles, username, activityComposition } = filter;
        const { sortBy } = options;
        const limit = options.limit && parseInt(options.limit, 10) > 0 ? parseInt(options.limit, 10) : 10;
        const page = options.page && parseInt(options.page, 10) > 0 ? parseInt(options.page, 10) : 1;
        const sortParams: Record<string, 1 | -1> = sortBy ? sort.sortByHandler(sortBy) : { username: 1 };

        let matchStage: any = {};
        let allActivityIds: string[] = [];

        const memberActivityDate = await connection.models.MemberActivity.findOne().sort({ date: -1 }).select({ date: 1, _id: 0 });

        if (activityComposition && activityComposition.length > 0) {
            // If 'others' is in activityComposition, we exclude all IDs that are part of other activities
            if (activityComposition.includes('others')) {
                allActivityIds = activityCompostionsTypes
                    .filter(activity => activity !== 'others')
                    .flatMap(activity => memberActivity[activity]);

                matchStage.discordId = { $nin: allActivityIds };
            }

            // If specific activity compositions are mentioned along with 'others', we add them separately
            if (activityComposition.some(activity => activity !== 'others')) {
                const specificActivityIds = activityComposition
                    .filter(activity => activity !== 'others')
                    .flatMap(activity => memberActivity[activity]);

                if (matchStage.discordId) {
                    matchStage = { $or: [{ discordId: { $in: specificActivityIds } }, matchStage] };
                } else {
                    matchStage.discordId = { $in: specificActivityIds };
                }
            }
        }
        if (username) {
            matchStage.username = { $regex: username, $options: 'i' };
        }

        if (roles && roles.length > 0) {
            matchStage.roles = { $in: roles };
        }

        if (memberActivityDate) {
            matchStage.joinedAt = { $lte: memberActivityDate.date };
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
 *  handel guild member roles, ngu, and username
 * @param {Array} guildMembers - guild members array.
 * @param {Array} roles - roles array.
 * @param {Any} memberActivity - The document containing the last member activity.
 * @param {Any} activityComposition
 * 
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function addNeededDataForTable(guildMembers: Array<any>, roles: Array<IRole>, memberActivity: any, activityComposition: Array<string>) {
    guildMembers.forEach((guildMember) => {
        guildMember.roles = guildMember.roles.map((roleId: string) => {
            const role = roles.find((role: IRole) => role.roleId === roleId);
            if (role) {
                return { roleId: role.roleId, color: role.color, name: role.name };
            }
        });
        guildMember.username = guildMember.discriminator === "0" ? guildMember.username : guildMember.username + "#" + guildMember.discriminator;
        guildMember.activityComposition = memberActivityService.getActivityComposition(guildMember, memberActivity, activityComposition)
    });
}

/**
 * Get a guild member from the database based on the filter criteria.
 * @param {Connection} connection - Mongoose connection object for the database.
 * @param {object} filter - An object specifying the filter criteria to match the desired guild member entry.
 * @returns {Promise<IGuildMember | null>} - A promise that resolves to the matching guild member object or null if not found.
 */
async function getGuildMember(connection: Connection, filter: object): Promise<IGuildMember | null> {
    try {
        return await connection.models.GuildMember.findOne(filter);
    } catch (error) {
        console.log('Failed to retrieve  guild member', error);
        return null;
    }
}


export default {
    queryGuildMembers,
    addNeededDataForTable,
    getGuildMember
}

