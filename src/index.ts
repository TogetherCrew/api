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

  RabbitMQ.publish(Queue.SERVER_API, Event.SERVER_API.EngagementTokenIssued, {
    name: 'EngagementTokenIssued',
    data: {
      eventName: 'Issue',
      args: {
        account: '0x9C27b59a4074cbfCDb193b01AA222d475b49a73F',
        tokenId: '0',
      },
      address: '0x8ff1dd3967a87c1eb46bd60b2bbf9d7eaa987c1b',
      topics: [
        '0xc65a3f767206d2fdcede0b094a4840e01c0dd0be1888b5ba800346eaa0123c16',
        '0x0000000000000000000000009c27b59a4074cbfcdb193b01aa222d475b49a73f',
        '0x0000000000000000000000000000000000000000000000000000000000000000',
      ],
      data: '0x',
      blockNumber: '6989830',
      transactionHash: '0xdc0ec58c070c2b7e0b4f9f8ccee2c5022a631fc60c4b1bfae4fe76e5b1feb671',
      transactionIndex: 21,
      blockHash: '0xbf352c1052a7309bc770c6b631783ef2443dbd0bb3e5dc147d6f32417f532f08',
      logIndex: 53,
      removed: false,
    },
  });
};

initApp();
