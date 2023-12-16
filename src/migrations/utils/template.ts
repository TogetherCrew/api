import 'dotenv/config';
import mongoose from "mongoose";
import config from '../../config';
import logger from '../../config/logger';
import { DatabaseManager } from '@togethercrew.dev/db';

const connectToMongoDB = async () => {
    try {
        await mongoose.connect(config.mongoose.serverURL);
        logger.info({ url: config.mongoose.serverURL }, 'Connected to MongoDB!');
    } catch (error) {
        logger.fatal({ url: config.mongoose.serverURL, error }, 'Failed to connect to MongoDB!')
    }
};

export const up = async () => {
    // Connect to MongoDB
    console.log
    await connectToMongoDB();
    const connection = DatabaseManager.getInstance().getTenantDb("database");
    await connection.createCollection('my_collection');
};

export const down = async () => {
    // Do something   
};
