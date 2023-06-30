import { Connection } from 'mongoose';
import { IRole } from '@togethercrew.dev/db';

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

export default {
    getRole,
    getRoles,
};
