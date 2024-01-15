import { Connection } from 'mongoose';
import { sort } from '../../utils';
import { IGuildMember } from '@togethercrew.dev/db';
import parentLogger from '../../config/logger';

const logger = parentLogger.child({ module: 'GuildMemberService' });

type Filter = {
    activityComposition?: Array<string>;
    roles?: Array<string>;
    ngu?: string;
    allRoles: boolean,
    include?: Array<string>
    exclude?: Array<string>
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function queryGuildMembers(connection: Connection, filter: Filter, options: Options, memberActivity: any, activityCompostionsTypes: Array<string>) {
    try {
        const { allRoles, include, exclude, ngu, activityComposition } = filter;
        const { sortBy } = options;
        const limit = options.limit && parseInt(options.limit, 10) > 0 ? parseInt(options.limit, 10) : 10;
        const page = options.page && parseInt(options.page, 10) > 0 ? parseInt(options.page, 10) : 1;
        const sortParams: Record<string, 1 | -1> = sortBy ? sort.sortByHandler(sortBy) : { username: 1 };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let matchStage: any = {};
        let allActivityIds: string[] = [];

        const memberActivityDocument = await connection.models.MemberActivity.findOne().sort({ date: -1 }).select({ date: 1, _id: 0 });

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


        if (ngu) {
            matchStage.$or = [
                { "username": { $regex: ngu, $options: 'i' } },
                { "globalName": { $regex: ngu, $options: 'i' } },
                { "nickname": { $regex: ngu, $options: 'i' } }
            ];
        }


        if (allRoles === false) {
            if (include?.length) {
                matchStage.roles = { $in: include };

            } else if (exclude?.length) {
                matchStage.roles = { $nin: exclude };


            }
        }

        if (memberActivityDocument) {
            const date = new Date(memberActivityDocument.date);
            date.setHours(23, 59, 59, 999);
            matchStage.joinedAt = { $lte: date };
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
                    nickname: 1,
                    globalName: 1,
                    _id: 0,
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
    } catch (error) {
        logger.error({ database: connection.name, filter, options, memberActivity, activityCompostionsTypes, error }, 'Failed to query guild members');
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
 * Get an array of Discord IDs based on the usernames present in the guild member's data.
 * 
 * @param {Connection} connection - Mongoose connection object for the database.
 * @param {string[]} usernames - An array of usernames to match against the guild member's usernames.
 * @returns {Promise<string[]>} - A promise that resolves to an array of Discord IDs.
 */
async function getDiscordIdsFromUsernames(connection: Connection, usernames: string[]): Promise<string[]> {
    const guildMembers = await connection.models.GuildMember.find({ username: { $in: usernames } });

    return guildMembers.map((guildMember: IGuildMember) => guildMember.discordId);
}

/**
 * Determines the ngu (name to be displayed) for a given guild member.
 * The name priority is as follows: nickname, globalName, username with discriminator.
 * @param {IGuildMember} guildMember - The guild member for which the ngu needs to be determined.
 * @returns {string} - The determined ngu for the guild member.
 */
function getNgu(guildMember: IGuildMember): string {
    if (guildMember.nickname) {
        return guildMember.nickname;
    } else if (guildMember.globalName) {
        return guildMember.globalName;
    } else {
        return guildMember.discriminator === "0" ? guildMember.username : guildMember.username + "#" + guildMember.discriminator;
    }
}

/**
 * Determines the username based on discriminator.
 * @param {IGuildMember} guildMember - The guild member for which the ngu needs to be determined.
 * @returns {string} - The determined username for guild member.
 */
function getUsername(guildMember: IGuildMember): string {
    return guildMember.discriminator === "0" ? guildMember.username : guildMember.username + "#" + guildMember.discriminator;

}


/**
 * Get a guild member from the database based on the filter criteria.
 * @param {Connection} connection - Mongoose connection object for the database.
 * @param {object} filter - An object specifying the filter criteria to match the desired guild member entry.
 * @returns {Promise<IGuildMember | null>} - A promise that resolves to the matching guild member object or null if not found.
 */
async function getGuildMember(connection: Connection, filter: object): Promise<IGuildMember | null> {
    return await connection.models.GuildMember.findOne(filter);
}


export default {
    getDiscordIdsFromUsernames,
    queryGuildMembers,
    getGuildMember,
    getNgu,
    getUsername
}
