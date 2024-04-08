import { Connection, HydratedDocument } from 'mongoose';
import { IRole, IGuildMember } from '@togethercrew.dev/db';

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
 * @param {Connection} connection - Mongoose connection object for the database.
 * @param {Object} filter - Mongo filter
 * @param {Object} select - Selete fields
 * @returns {Promise<HydratedDocument<IRole>[] | []>}
 */
const getRoles = async (connection: Connection, filter: object, select?: object): Promise<HydratedDocument<IRole>[] | []> => {
  return connection.models.Role.find(filter).select(select);

}

/**
 * Get an array of Discord IDs based on the role IDs present in the guild member's data.
 *
 * @param {Connection} connection - Mongoose connection object for the database.
 * @param {string[]} roleIds - An array of role IDs to match against the guild member's role IDs.
 * @returns {Promise<string[]>} - A promise that resolves to an array of Discord IDs.
 */
async function getDiscordIdsFromRoleIds(connection: Connection, roleIds: string[]): Promise<string[]> {
  const guildMembers = await connection.models.GuildMember.find({ roles: { $in: roleIds } });

  return guildMembers.map((guildMember: IGuildMember) => guildMember.discordId);
}

async function getRoleInfoFromRoleIds(connection: Connection, roleIds: string[]) {
  const roles = await connection.models.Role.find({ roleId: { $in: roleIds } });
  const roleInfo = roles.map((role: IRole) => ({ roleId: role.roleId, color: role.color, name: role.name }));
  return roleInfo;
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
  return guildMember.roles
    .map((roleId: string) => {
      const role = roles.find((role: IRole) => role.roleId === roleId);
      if (role) {
        return { roleId: role.roleId, color: role.color, name: role.name };
      }
    })
    .filter((role) => role !== undefined);
}

/**
 * Query for roles
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 */
const queryRoles = async (connection: any, filter: object, options: object) => {
  return await connection.models.Role.paginate(filter, options);
};


export default {
  getRole,
  queryRoles,
  getDiscordIdsFromRoleIds,
  getRolesForGuildMember,
  getRoleInfoFromRoleIds,
  getRoles,
};
