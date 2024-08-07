import 'dotenv/config';
import mongoose from 'mongoose';
import config from '../../config';
import logger from '../../config/logger';
import { DatabaseManager } from '@togethercrew.dev/db';

const connectToMongoDB = async () => {
  try {
    await mongoose.connect(config.mongoose.serverURL);
    logger.info('Connected to MongoDB!');
  } catch (error) {
    logger.fatal({ error }, 'Failed to connect to MongoDB!');
  }
};

export const up = async () => {
  // Connect to MongoDB
  await connectToMongoDB();
  const guildConnection = await DatabaseManager.getInstance().getPlatformDb('database');
  await guildConnection.createCollection('my_collection');
};

export const down = async () => {
  // Do something
};
