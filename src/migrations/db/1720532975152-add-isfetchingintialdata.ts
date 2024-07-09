import 'dotenv/config';
import mongoose from 'mongoose';
import config from '../../config';
import logger from '../../config/logger';
import { Platform, PlatformNames } from '@togethercrew.dev/db';

const connectToMongoDB = async () => {
  try {
    await mongoose.connect(config.mongoose.serverURL);

    logger.info('Connected to MongoDB!');
  } catch (error) {
    logger.fatal('Failed to connect to MongoDB!');
  }
};

export const up = async () => {
  // Connect to MongoDB
  await connectToMongoDB();
  const discordPlatforms = await Platform.find({ name: PlatformNames.Discord });
  for (let i = 0; i < discordPlatforms.length; i++) {
    const platform = discordPlatforms[i];
    if (platform?.metadata) {
      platform.metadata.isFetchingIntialData = false;
      console.log(platform);
      platform.markModified('metadata');
      await platform.save();
    }
  }
};

export const down = async () => {};
