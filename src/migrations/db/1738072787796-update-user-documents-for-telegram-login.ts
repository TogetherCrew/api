import 'dotenv/config';

import mongoose from 'mongoose';

import { PlatformNames, User } from '@togethercrew.dev/db';

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

  // This single pipeline:
  // 1) sets `identities` to an array containing { provider: 'discord', id: '$discordId' }
  // 2) unsets the old `discordId` and `email` fields
  const result = await User.updateMany(
    {
      discordId: { $exists: true },
    },
    [
      {
        $set: {
          identities: [
            {
              provider: PlatformNames.Discord,
              id: '$discordId',
            },
          ],
        },
      },
      {
        $unset: ['discordId', 'email'],
      },
    ],
  );

  logger.info(`Up migration: modified ${result.modifiedCount} user(s).`);

  await mongoose.connection.close();
};

export const down = async () => {
  await connectToMongoDB();

  // We'll do a quick find() and loop if you want to revert, because the pipeline
  // would need to parse out "discordId" from identities.
  const users = await User.find({
    identities: { $exists: true, $ne: [] },
  });

  for (const userDoc of users) {
    // cast to any or .get('...')
    const user: any = userDoc;

    const discordIdentity = user.identities.find((identity: any) => identity.provider === PlatformNames.Discord);
    if (discordIdentity) {
      user.discordId = discordIdentity.id;
    }
    user.identities = [];

    // If needed, re-add `email` from some backup, if you have it.
    user.markModified('identities');
    await user.save();
  }

  logger.info('Down migration: successfully reverted to old schema.');
  await mongoose.connection.close();
};
