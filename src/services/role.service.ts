import { Connection } from 'mongoose';
import { IRole, IGuildMember } from '@togethercrew.dev/db';
import { sort } from '../utils';

type Filter = {
    name?: string;
    deletedAt?: Date | null
};

type Options = {
    sortBy?: string;
    limit?: string;
    page?: string;
};
/**
 * Get a role from the database based on the filter criteria.
 * @param {Connection} connection - Mongoose connection object for the database.
 * @param {object} filter - An object specifying the filter criteria to match the desired role entry.
 * @returns {Promise<IRole | null>} - A promise that resolves to the matching role object or null if not found.
 */
async function getRole(connection: Connection, filter: object): Promise<IRole | null> {
    return await connection.models.Role.findOne(filter);
}

/**
 * Get roles from the database based on the filter criteria.
 * @param {Connection} connection - Mongoose connection object for the database.
 * @param {object} filter - An object specifying the filter criteria to match the desired role entries.
 * @returns {Promise<IRole[] | []>} - A promise that resolves to an array of the matching role objects.
 */
async function getRoles(connection: Connection, filter: object): Promise<IRole[] | []> {
    try {
        return await connection.models.Role.find(filter);
    } catch (error) {
        console.log('Failed to retrieve  roles', error);
        return [];
    }
}

/**
 * Query roles with a filter and options.
 * @param {Connection} connection - Mongoose connection object for the database.
 * @param {Filter} filter - An object specifying the filter criteria to match the desired role entries.
 * @param {Options} options - The options object with fields like 'sortBy', 'limit' and 'page'.
 * @returns {Promise<QueryResult>} - An object with the query results and other information like 'limit', 'page', 'totalPages', 'totalResults'.
 */
async function QueryRoles(connection: Connection, filter: Filter, options: Options) {
    try {
        const { name, deletedAt } = filter;
        const { sortBy } = options;
        const limit = options.limit && parseInt(options.limit, 10) > 0 ? parseInt(options.limit, 10) : 10;
        const page = options.page && parseInt(options.page, 10) > 0 ? parseInt(options.page, 10) : 1;
        const sortParams: Record<string, 1 | -1> = sortBy ? sort.sortByHandler(sortBy) : { name: 1 };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const matchStage: any = {};
        if (name) matchStage.name = { $regex: name, $options: 'i' };
        matchStage.deletedAt = deletedAt;

        const totalResults = await connection.models.Role.countDocuments(matchStage);

        const results = await connection.models.Role.aggregate([
            { $match: matchStage },
            { $sort: sortParams },
            { $skip: limit * (page - 1) },
            { $limit: limit },
            {
                $project: {
                    roleId: 1,
                    name: 1,
                    color: 1,
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
        };
    } catch (error) {
        console.log('Failed to retrieve  roles', error);
        return {
            results: [],
            limit: 10,
            page: 1,
            totalPages: 0,
            totalResults: 0,
        };
    }
}

/**
 * Retrieves an array of roles based on the role IDs present in the guild member's data.
 * The roles are mapped from a provided roles array.
 *
 * @param {any} guildMember - The guild member for which roles need to be determined.
 * @param {Array<IRole>} roles - An array of roles to match against the guild member's role IDs.
 * @returns {Array<{ roleId: string; color: string; name: string }>} - An array of roles for the guild member.
 */
function getRolesForGuildMember(guildMember: IGuildMember, roles: Array<IRole>) {
    return guildMember.roles.map((roleId: string) => {
        const role = roles.find((role: IRole) => role.roleId === roleId);
        if (role) {
            return { roleId: role.roleId, color: role.color, name: role.name };
        }
    }).filter(role => role !== undefined);
}

export default {
    getRole,
    QueryRoles,
    getRolesForGuildMember,
    getRoles
};
