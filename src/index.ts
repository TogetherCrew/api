import mongoose from "mongoose";
import app from './app';
import config from './config';
import RabbitMQ, { MBConnection, Queue } from '@togethercrew.dev/tc-messagebroker';
import logger from './config/logger';

mongoose.set("strictQuery", false);

// Connect to RabbitMQ
const connectToRabbitMQ = async () => {
    try {
        await RabbitMQ.connect(config.rabbitMQ.url, Queue.SERVER_API);
        logger.info({ url: config.rabbitMQ.url, queue: Queue.SERVER_API }, 'Connected to RabbitMQ!');
    } catch (error) {
        logger.fatal({ url: config.rabbitMQ.url, queue: Queue.SERVER_API, error }, 'Failed to connect to RabbitMQ!')
    }
};

// Connect to Message Broker DB
const connectToMB = async () => {
    try {
        await MBConnection.connect(config.mongoose.dbURL);
        logger.info({ url: config.mongoose.dbURL }, 'Setuped Message Broker connection!');
    } catch (error) {
        logger.fatal({ url: config.mongoose.dbURL, error }, 'Failed to setup to Message Broker!!');
    }
};

// Connect to MongoDB
const connectToMongoDB = async () => {
    try {
        await mongoose.connect(config.mongoose.serverURL);
        logger.info({ url: config.mongoose.serverURL }, 'Connected to MongoDB!');
    } catch (error) {
        logger.fatal({ url: config.mongoose.serverURL, error }, 'Failed to connect to MongoDB!')
    }
};

// Initialize the application
const initApp = async () => {
    await connectToMB();
    await connectToRabbitMQ();
    await connectToMongoDB();
    app.listen(config.port, () => {
        logger.info(`Listening on ${config.port}`);
    });
};


initApp();