import { Connection } from 'mongoose';
import parentLogger from '../config/logger';

const logger = parentLogger.child({ module: 'Connection' });

/**
 * Closes a given Mongoose connection.
 * @param {Connection} connection - The Mongoose connection object to be closed.
 * @returns {Promise<void>} - A promise that resolves when the connection has been successfully closed.
 * @throws {MongooseError} - If there is an error closing the connection, it is logged to the console and the error is thrown.
 */
export async function closeConnection(connection: Connection) {
  try {
    await connection.close();
    logger.info({ database: connection.name }, 'The connection to database has been successfully closed');
  } catch (error) {
    logger.fatal({ database: connection.name, error }, 'Failed to close the connection to the database');
  }
}
