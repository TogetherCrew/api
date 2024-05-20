import { Connection } from 'mongoose';
import { IChannel } from '@togethercrew.dev/db';
import config from '../../config';
import parentLogger from '../../config/logger';
import coreService from '../discord/core.service';
import { Snowflake } from 'discord.js';
const logger = parentLogger.child({ module: 'ChannelService' });

/**
 *  check if a bot has the "Read Message History" permissio
 * @param {number} botPermissions
 * @returns {boolean}
 */
function hasReadMessageHistory(botPermissions: number): boolean {
  const READ_MESSAGE_HISTORY = 0x40;
  return (botPermissions & READ_MESSAGE_HISTORY) !== 0;
}

/**
 * Get a channel from the database based on the filter criteria.
 * @param {Connection} connection - Mongoose connection object for the database.
 * @param {object} filter - An object specifying the filter criteria to match the desired channel entry.
 * @returns {Promise<IChannel | null>} - A promise that resolves to the matching channel object or null if not found.
 */
async function getChannel(connection: Connection, filter: object): Promise<IChannel | null> {
  return await connection.models.Channel.findOne(filter);
}

/**
 * Get channels from the database based on the filter criteria.
 * @param {Connection} connection - Mongoose connection object for the database.
 * @param {object} filter - An object specifying the filter criteria to match the desired channel entries.
 * @returns {Promise<IChannel[] | []>} - A promise that resolves to an array of the matching channel objects.
 */
async function getChannels(connection: Connection, filter: object): Promise<IChannel[] | []> {
  return await connection.models.Channel.find(filter);
}

/**
 * Checks if the bot has specific permissions in a given channel.
 * This function combines all the specified permissions and checks if the bot has these permissions globally as well as any specific overwrites in the channel.
 *
 * @param {Snowflake} guildId - The ID of the guild.
 * @param {IChannel} channel - The channel to check the permissions for.
 * @param {number[]} permissionsToCheck - An array of permission numbers (in hexadecimal format) to check.
 * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating whether the bot has all the specified permissions in the given channel.
 */
async function checkBotPermissions(
  guildId: Snowflake,
  channel: IChannel,
  permissionsToCheck: number[],
): Promise<boolean> {
  try {
    const client = await coreService.DiscordBotManager.getClient();
    const guild = await client.guilds.fetch(guildId);
    const botMember = await guild.members.fetch(config.oAuth2.discord.clientId);

    if (!channel || !botMember) {
      return false;
    }

    // Combine all permissions to check using bitwise OR
    let requiredPermissions = permissionsToCheck.reduce((acc, perm) => acc | BigInt(perm), BigInt(0));

    // Check if bot has the combined global permissions using bitwise AND
    const botGlobalPermissions = BigInt(botMember.permissions.bitfield);
    if ((botGlobalPermissions & requiredPermissions) !== requiredPermissions) {
      return false;
    }

    // Function to evaluate permission overwrites
    const evaluateOverwrites = (overwrite: any) => {
      const allowed = BigInt(overwrite.allow);
      return (allowed & requiredPermissions) === requiredPermissions;
    };

    // Check permission overwrites in the channel
    let hasAccess = false;
    channel.permissionOverwrites?.forEach((overwrite) => {
      if (overwrite.type === 0 && botMember.roles.cache.has(overwrite.id)) {
        if (evaluateOverwrites(overwrite)) {
          hasAccess = true;
        }
      } else if (overwrite.type === 1 && overwrite.id === botMember.id) {
        if (evaluateOverwrites(overwrite)) {
          hasAccess = true;
        }
      }
    });

    return hasAccess;
  } catch (error) {
    logger.error({ error }, 'Failed to check bot permissions');
    return false;
  }
}

async function getChannelInfoFromChannelIds(connection: Connection, channelIds: string[]) {
  const channels = await connection.models.Channel.find({ channelId: { $in: channelIds } });
  const channelInfo = channels.map((channel: IChannel) => ({ channelId: channel.channelId, name: channel.name }));
  return channelInfo;
}

/**
 * Query for channels
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 */
const queryChannels = async (connection: any, filter: object, options: object) => {
  return await connection.models.Channel.paginate(filter, options);
};

export default {
  getChannelInfoFromChannelIds,
  hasReadMessageHistory,
  getChannel,
  getChannels,
  checkBotPermissions,
  queryChannels,
};
