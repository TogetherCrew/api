import { Connection } from 'mongoose';
import { IRole } from '@togethercrew.dev/db';
import { IGuildMember } from 'tc_dbcomm';

/**
 * Get a role from the database based on the filter criteria.
 * @param {Connection} connection - Mongoose connection object for the database.
 * @param {object} filter - An object specifying the filter criteria to match the desired role entry.
 * @returns {Promise<IRole | null>} - A promise that resolves to the matching role object or null if not found.
 */
async function getRole(connection: Connection, filter: object): Promise<IRole | null> {
    try {
        return await connection.models.Role.findOne(filter);
    } catch (error) {
        console.log('Failed to retrieve  role', error);
        return null;
    }
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
    getRoles,
    getRolesForGuildMember
};
