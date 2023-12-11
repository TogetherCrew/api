import mongoose from "mongoose";
import config from '../../config';
import logger from '../../config/logger';
import 'dotenv/config';
import { DatabaseManager } from '@togethercrew.dev/db';
import { User } from "@togethercrew.dev/db";

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
    await connectToMongoDB();
    const connection = DatabaseManager.getInstance().getTenantDb("RnDAO");
    console.log(await connection.models.Guild.find({}));

    console.log(await User.find({}))
};

export const down = async () => {
    // Do something   
};
