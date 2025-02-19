import mongoose from 'mongoose';

import { announcementEmitter } from '@togethercrew.dev/db';
import RabbitMQ, { MBConnection } from '@togethercrew.dev/tc-messagebroker';

import app from './app';
import config from './config';
import logger from './config/logger';
import rabbitMQClient from './rabbitmq/';
import { announcementService } from './services';

mongoose.set('strictQuery', false);
// Connect to RabbitMQ
const setupRabbitMq = async () => {
  // Establish connection
  await rabbitMQClient.connect();
  // Initialize all event handlers
  // initializeHandlers();
};

// Connect to Message Broker DB
const connectToMB = async () => {
  try {
    await MBConnection.connect(config.mongoose.dbURL);
    logger.info('Setuped Message Broker connection!');
  } catch (error) {
    logger.fatal({ error }, 'Failed to setup to Message Broker!');
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
  announcementEmitter.on('announcement:remove', (data: any) => {
    announcementService.onDestroyAnnouncement(data?.jobId);
  });
  announcementEmitter.on('announcement:softDelete', (data: any) => {
    announcementService.onDestroyAnnouncement(data?.jobId);
  });
};

// Initialize the application
const initApp = async () => {
  handleAnnouncementRemoval();
  await connectToMB();
  await setupRabbitMq();
  await connectToMongoDB();
  app.listen(config.port, () => {
    logger.info(`Listening on ${config.port}`);
  });
};

initApp();
