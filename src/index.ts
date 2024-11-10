import mongoose from 'mongoose';
import app from './app';
import config from './config';
import RabbitMQ, { MBConnection, Queue, Event } from '@togethercrew.dev/tc-messagebroker';
import logger from './config/logger';
import { announcementEmitter } from '@togethercrew.dev/db';
import { announcementService } from './services';
import rabbitMQClient from './rabbitmq/';
import initializeHandlers from './rabbitmq/handlers';
mongoose.set('strictQuery', false);
// Connect to RabbitMQ
const setupRabbitMq = async () => {
  // Establish connection
  await rabbitMQClient.connect();
  // Initialize all event handlers
  initializeHandlers();
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
  await setupRabbitMq();
  await connectToMongoDB();
  app.listen(config.port, () => {
    logger.info(`Listening on ${config.port}`);
  });
};

initApp();
