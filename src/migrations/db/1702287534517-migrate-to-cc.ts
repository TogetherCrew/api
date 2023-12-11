import 'dotenv/config';
import mongoose from "mongoose";
import config from '../../config';
import logger from '../../config/logger';
import { IUser, User } from '@togethercrew.dev/db'
import { DatabaseManager } from '@togethercrew.dev/db';
import { IOldUser, IGuild, oldUserSchema, guildSchema } from '../utils/oldSchemas'

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
    // const connection = mongoose.connection.useDb("RnDAO", { useCache: true });
    const connection = DatabaseManager.getInstance().getTenantDb("RnDAO");
    connection.model<IOldUser>('User', oldUserSchema);
    connection.model<IGuild>('Guild', guildSchema);



    const oldUsers = await connection.models.User.find({});
    const newUsers: IUser[] = [];
    for (let i = 0; i < oldUsers.length; i++) {
        newUsers.push({
            discordId: oldUsers[i].discordId,
            communities: [],
            tcaAt: oldUsers[i].createAt
        })
    }
    await User.create(newUsers)
};

export const down = async () => {
    // Do something   
};
