import mongoose from 'mongoose';
import config from '../../src/config';
import RabbitMQ, { MBConnection, Queue } from '@togethercrew.dev/tc-messagebroker';
import { platformOne, platformTwo, platformThree, platformFour } from '../fixtures/platform.fixture';
import { DatabaseManager } from '@togethercrew.dev/db';

export const cleanUpTenantDatabases = async () => {
  const tenantIds = [
    platformOne.metadata?.id,
    platformTwo.metadata?.id,
    platformThree.metadata?.id,
    platformFour.metadata?.id,
  ];

  for (const tenantId of tenantIds) {
    const connection = await DatabaseManager.getInstance().getGuildDb(tenantId);
    
    await Promise.all(Object.values(connection.collections).map(async (collection) => collection.deleteMany({})));
  }
};

const setupTestDB = () => {
  beforeAll(async () => {
    mongoose.set('strictQuery', false);
    await mongoose.connect(config.mongoose.serverURL);
    await MBConnection.connect(config.mongoose.dbURL);
    RabbitMQ.connect(config.rabbitMQ.url, Queue.SERVER_API);
  });

  beforeEach(async () => {
    await Promise.all([
      // Clean up the main database
      ...Object.values(mongoose.connection.collections).map(async (collection) => collection.deleteMany({})),
      // Clean up tenant databases
      cleanUpTenantDatabases(),
    ]);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });
};

export default setupTestDB;
