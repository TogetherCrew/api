import { Connection } from 'mongoose';
/**
 * Closes a given Mongoose connection.
 * @param {Connection} connection - The Mongoose connection object to be closed.
 * @returns {Promise<void>} - A promise that resolves when the connection has been successfully closed.
 * @throws {MongooseError} - If there is an error closing the connection, it is logged to the console and the error is thrown.
 */
export async function closeConnection(connection: Connection) {
    try {
        await connection.close();
        console.log('The connection to the database has been successfully closed.');
    } catch (err) {
        console.log('Error closing connection to the database:', err);
    }
}