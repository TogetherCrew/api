import { Connection } from 'mongoose';
import { IChannel } from '@togethercrew.dev/db';
import config from '../../config';
import { discord } from '../../config/oAtuh2';
import guildMemberService from './guildMember.service';
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
 * Get channels from the database based on the filter criteria.
 * @param {Connection} connection - Mongoose connection object for the database.
 * @param {IChannel} channel - channel filed.
 * @returns {Promise<boolean>} - A promise that resolves to an boolean.
 */
async function checkBotChannelAccess(guildId: Snowflake, channel: IChannel): Promise<boolean> {
    try {
        const client = await coreService.DiscordBotManager.getClient();
        const guild = await client.guilds.fetch(guildId);
        const botMember = await guild.members.fetch(config.discord.clientId);

        if (!channel || !botMember) {
            return false;
        }

        // Permission constants
        const readMessageHistoryPermission = BigInt(65536); // 0x10000
        const viewChannelPermission = BigInt(1024); // 0x400

        // Check if bot has global permissions
        const botGlobalPermissions = BigInt(botMember.permissions.bitfield);
        if (!(botGlobalPermissions & readMessageHistoryPermission) || !(botGlobalPermissions & viewChannelPermission)) {
            return false;
        }

        // Check permission overwrites
        let hasAccess = true;
        const evaluateOverwrites = (overwrite: any) => {
            const allowed = BigInt(overwrite.allow);
            const denied = BigInt(overwrite.deny);

            if ((denied & readMessageHistoryPermission) || (denied & viewChannelPermission)) {
                hasAccess = false;
            } else if ((allowed & readMessageHistoryPermission) && (allowed & viewChannelPermission)) {
                hasAccess = true;
            }
        };

        channel.permissionOverwrites?.forEach(overwrite => {
            if (overwrite.type === 0 && botMember.roles.cache.has(overwrite.id)) { // Role specific overwrites
                evaluateOverwrites(overwrite);
            }
        });

        // User-specific overwrite for the bot
        const botSpecificOverwrite = channel.permissionOverwrites?.find(overwrite => overwrite.id === botMember.id && overwrite.type === 1);
        if (botSpecificOverwrite) {
            evaluateOverwrites(botSpecificOverwrite);
        }
        return hasAccess;
    } catch (error) {
        console.error('Failed to check bot channel access:', error);
        return false;
    }
}


/**
 * Query for platforms
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
    hasReadMessageHistory,
    getChannel,
    getChannels,
    checkBotChannelAccess,
    queryChannels
}