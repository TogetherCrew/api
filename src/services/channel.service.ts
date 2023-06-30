import { Connection } from 'mongoose';
import { IChannel } from '@togethercrew.dev/db';

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
    try {
        return await connection.models.Channel.findOne(filter);
    } catch (error) {
        console.log('Failed to retrieve channel', error);
        return null;
    }
}

/**
 * Get channels from the database based on the filter criteria.
 * @param {Connection} connection - Mongoose connection object for the database.
 * @param {object} filter - An object specifying the filter criteria to match the desired channel entries.
 * @returns {Promise<IChannel[] | []>} - A promise that resolves to an array of the matching channel objects.
 */
async function getChannels(connection: Connection, filter: object): Promise<IChannel[] | []> {
    try {
        return await connection.models.Channel.find(filter);
    } catch (error) {
        console.log('Failed to retrieve channels', error);
        return [];
    }
}




export default {
    hasReadMessageHistory,
    getChannel,
    getChannels
}