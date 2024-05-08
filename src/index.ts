import mongoose from 'mongoose';
import app from './app';
import config from './config';
import RabbitMQ, { MBConnection, Queue } from '@togethercrew.dev/tc-messagebroker';
import logger from './config/logger';
import { announcementEmitter } from '@togethercrew.dev/db';
import { announcementService } from './services';

mongoose.set('strictQuery', false);

// Connect to RabbitMQ
const connectToRabbitMQ = async () => {
  try {
    await RabbitMQ.connect(config.rabbitMQ.url, Queue.SERVER_API);
    logger.info({ queue: Queue.SERVER_API }, 'Connected to RabbitMQ!');
  } catch (error) {
    logger.fatal({ queue: Queue.SERVER_API, error }, 'Failed to connect to RabbitMQ!');
  }
};

// Connect to Message Broker DB
const connectToMB = async () => {
  try {
    await MBConnection.connect(config.mongoose.dbURL);
    logger.info('Setuped Message Broker connection!');
  } catch (error) {
    logger.fatal({ error }, 'Failed to setup to Message Broker!!');
  }
};

// Connect to MongoDB
const connectToMongoDB = async () => {
  try {
    await mongoose.connect(config.mongoose.serverURL);
    logger.info('Connected to MongoDB!');
  } catch (error) {
    logger.fatal({ error }, 'Failed to connect to MongoDB!');
  }
};

const handleAnnouncementRemoval = () => {
  announcementEmitter.on('announcement:remove', (data) => {
    announcementService.onDestroyAnnouncement(data?.jobId);
  });
  announcementEmitter.on('announcement:softDelete', (data) => {
    announcementService.onDestroyAnnouncement(data?.jobId);
  });
};

// Initialize the application
const initApp = async () => {
  handleAnnouncementRemoval();
  await connectToMB();
  await connectToRabbitMQ();
  await connectToMongoDB();
  app.listen(config.port, () => {
    logger.info(`Listening on ${config.port}`);
  });
};

initApp();
