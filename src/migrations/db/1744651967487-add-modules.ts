import 'dotenv/config';

import mongoose from 'mongoose';

import { Community, Module, ModuleNames } from '@togethercrew.dev/db';

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

  try {
    const communities = await Community.find({}).exec();
    logger.info(`Found ${communities.length} communities.`);

    const newModuleNames = [ModuleNames.Announcements, ModuleNames.CommunityHealth, ModuleNames.CommunityInsights];

    for (const community of communities) {
      for (const moduleName of newModuleNames) {
        const newModule = new Module({
          name: moduleName,
          community: community._id,
          activated: true,
          options: { platforms: [] },
        });
        await newModule.save();
        logger.info(`Created module "${moduleName}" for community ${community._id}`);
      }
    }
  } catch (error) {
    logger.error('Error during migration up:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed.');
  }
};

export const down = async () => {
  await connectToMongoDB();

  try {
    const moduleNamesToDelete = [ModuleNames.Announcements, ModuleNames.CommunityHealth, ModuleNames.CommunityInsights];
    const result = await Module.deleteMany({ name: { $in: moduleNamesToDelete } });
    logger.info(`Migration down: deleted ${result.deletedCount} modules.`);
  } catch (error) {
    logger.error('Error during migration down:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed.');
  }
};
