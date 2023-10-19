import { Connection } from 'mongoose';
import { IChannel } from '@togethercrew.dev/db';
import config from '../config';
import { discord } from '../config/oatuh2';
import guildMemberService from './guildMember.service';
import parentLogger from '../config/logger';

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
async function checkReadMessageHistoryAndViewChannelpPermissions(connection: Connection, channel: IChannel): Promise<boolean> {
    try {
        let canReadMessageHistoryAndViewChannel = true;
        const botMember = await guildMemberService.getGuildMember(connection, { discordId: config.discord.clientId });
        if (botMember && botMember.permissions) {
            canReadMessageHistoryAndViewChannel = ((BigInt(botMember?.permissions) & BigInt(discord.permissions.readMessageHistory)) !== BigInt(0)) && ((BigInt(botMember?.permissions) & BigInt(discord.permissions.ViewChannels)) !== BigInt(0))
        }
        channel.permissionOverwrites?.forEach(overwrite => {
            if (overwrite.id === config.discord.clientId && overwrite.type === 1) {
                const allowed = BigInt(overwrite.allow);
                const denied = BigInt(overwrite.deny);
                canReadMessageHistoryAndViewChannel = ((allowed & BigInt(discord.permissions.readMessageHistory)) !== BigInt(0) && (denied & BigInt(discord.permissions.readMessageHistory)) === BigInt(0)) && ((allowed & BigInt(discord.permissions.ViewChannels)) !== BigInt(0) && (denied & BigInt(discord.permissions.ViewChannels)) === BigInt(0))
            }
        })
        return canReadMessageHistoryAndViewChannel;

    } catch (error) {
        logger.error({ database: connection.name, error }, 'Failed to checkReadMessageHistoryAndViewChannelpPermissions');
        return false;
    }
}

export default {
    hasReadMessageHistory,
    getChannel,
    getChannels,
    checkReadMessageHistoryAndViewChannelpPermissions
}