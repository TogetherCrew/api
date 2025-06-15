import 'dotenv/config';

import mongoose from 'mongoose';

import { Module, ModuleNames, Platform, PlatformNames } from '@togethercrew.dev/db';

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
    const platforms = await Platform.find({ name: PlatformNames.MediaWiki });
    logger.info(`Found ${platforms.length} MediaWiki platforms to update.`);

    for (const platform of platforms) {
      const metadata = platform.metadata || {};

      if ('namespace' in metadata) {
        metadata.namespaces = [0];
        delete metadata.namespace;
      } else {
        metadata.namespaces = [0];
      }

      await Platform.updateOne({ _id: platform._id }, { $set: { metadata } });

      logger.info(`Updated platform ${platform._id} metadata`);
    }

    const modules = await Module.find({ name: ModuleNames.Hivemind }).exec();
    logger.info(`Found ${modules.length} hivemind modules to update.`);

    for (const module of modules) {
      if (!module.options?.platforms) continue;

      const mediaWikiPlatform = module.options.platforms.find((p) => p.name === PlatformNames.MediaWiki);
      if (!mediaWikiPlatform) continue;

      const metadata = mediaWikiPlatform.metadata || {};
      let needsUpdate = false;

      if (!mediaWikiPlatform.metadata || 'namespace' in metadata || !('namespaces' in metadata)) {
        needsUpdate = true;

        if ('namespace' in metadata) {
          metadata.namespaces = [0];
          delete metadata.namespace;
        } else {
          metadata.namespaces = [0];
        }
      }

      if (needsUpdate) {
        await Module.updateOne(
          { _id: module._id },
          { $set: { 'options.platforms.$[platform].metadata': metadata } },
          { arrayFilters: [{ 'platform.name': 'mediaWiki' }] },
        );
        logger.info(`Updated hivemind module ${module._id} platform metadata`);
      }
    }

    logger.info('Successfully updated all MediaWiki platforms and modules');
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
    const platforms = await Platform.find({ name: PlatformNames.MediaWiki });
    logger.info(`Found ${platforms.length} MediaWiki platforms to revert.`);

    for (const platform of platforms) {
      const metadata = platform.metadata || {};

      if ('namespaces' in metadata) {
        metadata.namespace = metadata.namespaces[0];
        delete metadata.namespaces;
      }

      await Platform.updateOne({ _id: platform._id }, { $set: { metadata } });

      logger.info(`Reverted platform ${platform._id} metadata`);
    }

    const modules = await Module.find({ name: ModuleNames.Hivemind });
    logger.info(`Found ${modules.length} hivemind modules to revert.`);

    for (const module of modules) {
      if (!module.options?.platforms) continue;

      let needsUpdate = false;
      const updatedPlatforms = module.options.platforms.map((platform) => {
        if (platform.name === PlatformNames.MediaWiki) {
          const metadata = platform.metadata || {};

          if ('namespaces' in metadata) {
            metadata.namespace = metadata.namespaces[0];
            delete metadata.namespaces;
            needsUpdate = true;
          }

          return {
            ...platform,
            metadata,
          };
        }
        return platform;
      });

      if (needsUpdate) {
        await Module.updateOne({ _id: module._id }, { $set: { 'options.platforms': updatedPlatforms } });
        logger.info(`Reverted hivemind module ${module._id} platform metadata`);
      }
    }

    logger.info('Successfully reverted all MediaWiki platforms and modules');
  } catch (error) {
    logger.error('Error during migration down:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed.');
  }
};
