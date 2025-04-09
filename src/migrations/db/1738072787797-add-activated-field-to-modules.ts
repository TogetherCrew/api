import 'dotenv/config';

import mongoose from 'mongoose';

import { Module } from '@togethercrew.dev/db';

import config from '../../config';
import logger from '../../config/logger';

async function connectToMongoDB() {
  try {
    await mongoose.connect(config.mongoose.serverURL);
    logger.info('Connected to MongoDB!');
  } catch (error) {
    logger.fatal('Failed to connect to MongoDB!');
    throw error;
  }
}

export const up = async () => {
  await connectToMongoDB();

  const result = await Module.updateMany({}, { $set: { activated: true } });
  logger.info(`Up migration: added activated field to ${result.modifiedCount} module(s).`);

  await mongoose.connection.close();
};

export const down = async () => {};
